import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/* POST /api/enrich                                                    */
/* High-Speed Triple-Fallback Pipeline (Ultra Fast Timeouts)          */
/* Primary Engine: Google Gemini (gemini-3.6-flash)                    */
/* Secondary: OpenRouter (nvidia/nemotron-3-nano-30b-a3b:free)         */
/* Tertiary: NVIDIA NIM (meta/llama-3.3-70b-instruct)                  */
/* ------------------------------------------------------------------ */

const CONTEXT_CHAR_LIMIT = 4000;

const STRICT_SYSTEM_INSTRUCTION =
  "You are a strict text extractor. Output ONLY the final response string. " +
  "Do NOT include thinking steps, reasoning, prefixes, quotes, XML tags, or meta-commentary like " +
  "'We need to output...', 'Here is the sentence:', or 'Based on the website...'. " +
  "Start directly with the exact text requested.";

/* ---------- Post-Processing Sanitizer ---------- */

function sanitizeLLMOutput(raw: string): string {
  if (!raw) return "";

  let cleaned = raw.trim();

  // Strip <think>...</think> blocks (DeepSeek / Nemotron thinking tags)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Strip common thinking/meta prefixes
  const metaPrefixes = [
    /^here\s+is\s+(the\s+)?(sentence|text|hook|response|output|result)?:?\s*/i,
    /^we\s+need\s+to\s+[^:\n]+:?\s*/i,
    /^based\s+on\s+the\s+website[^:\n]*:?\s*/i,
    /^the\s+requested\s+sentence\s+is:?\s*/i,
    /^sure,?\s*(here\s+is)?:?\s*/i,
    /^certainly,?\s*(here\s+is)?:?\s*/i,
    /^output:?\s*/i,
    /^result:?\s*/i,
  ];

  for (const pattern of metaPrefixes) {
    cleaned = cleaned.replace(pattern, "").trim();
  }

  // Strip wrapping outer quotes ("..." or '...')
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Strip markdown code fences if wrapped in ```text ... ```
  if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
    cleaned = cleaned
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
  }

  return cleaned;
}

/* ---------- Fast Jina Scraper (3.5s max) ---------- */

async function scrapeViaJina(url: string): Promise<string> {
  try {
    const resp = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/markdown" },
      signal: AbortSignal.timeout(3_500),
    });
    if (!resp.ok) return "";
    const text = await resp.text();
    return text.trim().slice(0, CONTEXT_CHAR_LIMIT);
  } catch {
    return "";
  }
}

/* ---------- Google Gemini ---------- */

async function callGemini(
  context: string,
  prompt: string,
  companyName: string,
  apiKey: string
): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const userMsg = [
    STRICT_SYSTEM_INSTRUCTION,
    "",
    `Company: ${companyName}`,
    "",
    "--- Website Context (truncated) ---",
    context,
    "--- End Context ---",
    "",
    `Task: ${prompt}`,
  ].join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: userMsg,
  });

  return sanitizeLLMOutput(response.text?.trim() ?? "");
}

/* ---------- OpenRouter (5s max) ---------- */

async function callOpenRouter(
  context: string,
  prompt: string,
  companyName: string,
  apiKey: string
): Promise<string> {
  const userMsg = [
    `Company: ${companyName}`,
    "",
    "--- Website Context (truncated) ---",
    context,
    "--- End Context ---",
    "",
    `Task: ${prompt}`,
  ].join("\n");

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ClayLite",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [
          { role: "system", content: STRICT_SYSTEM_INSTRUCTION },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(5_000),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content?.trim();
  if (!rawText) {
    throw new Error("OpenRouter returned an empty completion response.");
  }
  return sanitizeLLMOutput(rawText);
}

/* ---------- OpenAI ---------- */

async function callOpenAI(
  context: string,
  prompt: string,
  companyName: string,
  apiKey: string
): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey, timeout: 6_000 });

  const userMsg = [
    `Company: ${companyName}`,
    "",
    "--- Website Context (truncated) ---",
    context,
    "--- End Context ---",
    "",
    `Task: ${prompt}`,
  ].join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: STRICT_SYSTEM_INSTRUCTION },
      { role: "user", content: userMsg },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  return sanitizeLLMOutput(response.choices[0]?.message?.content?.trim() ?? "");
}

/* ---------- NVIDIA NIM ---------- */

async function callNvidia(
  context: string,
  prompt: string,
  companyName: string,
  apiKey: string
): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    apiKey,
    baseURL: "https://integrate.api.nvidia.com/v1",
    timeout: 7_000,
  });

  const userMsg = [
    `Company: ${companyName}`,
    "",
    "--- Website Context (truncated) ---",
    context,
    "--- End Context ---",
    "",
    `Task: ${prompt}`,
  ].join("\n");

  const modelsToTry = [
    "meta/llama-3.3-70b-instruct",
    "nvidia/nemotron-4-340b-instruct",
    "nemotron-3-nano-omni-30b-a3b-reasonign",
  ];

  let lastErr: any = null;
  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: STRICT_SYSTEM_INSTRUCTION },
          { role: "user", content: userMsg },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return sanitizeLLMOutput(
        response.choices[0]?.message?.content?.trim() ?? ""
      );
    } catch (err: any) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("NVIDIA NIM call failed");
}

/* ---------- Quota / 429 helper ---------- */

function isQuotaError(err: any): boolean {
  const msg = (err?.message || String(err)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("exceeded") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate") ||
    msg.includes("limit")
  );
}

/* ---------- POST Handler ---------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      url,
      prompt,
      companyName,
      provider = "gemini",
    } = body as {
      url: string;
      prompt: string;
      companyName: string;
      provider: "gemini" | "nvidia" | "openai";
    };

    if (!url || !prompt || !companyName || !companyName.trim()) {
      return NextResponse.json(
        { result: "", skipped: true, message: "Row skipped: empty company or URL" },
        { status: 200 }
      );
    }

    // --- 1. Scrape context (Max 3.5 seconds) ---
    let context = await scrapeViaJina(url);
    if (!context) {
      context = `Company website: ${url}. Category/Name: ${companyName}`;
    }

    // --- 2. Route based on provider selection ---
    let result = "";
    let _fallbackUsed = false;
    let _fallbackProvider = "";

    if (provider === "nvidia") {
      const openrouterKey = process.env.OPENROUTER_API_KEY;
      if (!openrouterKey || openrouterKey === "your_openrouter_key_here") {
        return NextResponse.json(
          { error: "OPENROUTER_API_KEY not configured in .env.local" },
          { status: 500 }
        );
      }
      result = await callOpenRouter(context, prompt, companyName, openrouterKey);
    } else if (provider === "openai") {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey || openaiKey === "your_openai_key_here") {
        return NextResponse.json(
          { error: "OPENAI_API_KEY not configured in .env.local" },
          { status: 500 }
        );
      }
      result = await callOpenAI(context, prompt, companyName, openaiKey);
    } else {
      // Default: Gemini primary -> OpenRouter fallback -> NVIDIA NIM fallback
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey || geminiKey === "your_gemini_key_here") {
        return NextResponse.json(
          { error: "GEMINI_API_KEY not configured in .env.local" },
          { status: 500 }
        );
      }

      try {
        result = await callGemini(context, prompt, companyName, geminiKey);
      } catch (geminiErr: any) {
        console.warn(
          `[/api/enrich] Gemini failed for "${companyName}". Trying OpenRouter fallback...`
        );

        const openrouterKey = process.env.OPENROUTER_API_KEY;
        let openrouterFailed = false;

        if (openrouterKey && openrouterKey !== "your_openrouter_key_here") {
          try {
            result = await callOpenRouter(
              context,
              prompt,
              companyName,
              openrouterKey
            );
            _fallbackUsed = true;
            _fallbackProvider = "OpenRouter";
          } catch (orErr: any) {
            openrouterFailed = true;
            console.warn(
              `[/api/enrich] OpenRouter also failed for "${companyName}". Falling back to NVIDIA NIM...`
            );
          }
        } else {
          openrouterFailed = true;
        }

        // If OpenRouter failed or key missing, attempt NVIDIA NIM
        if (openrouterFailed) {
          const nvidiaKey = process.env.NVIDIA_API_KEY;
          if (!nvidiaKey || nvidiaKey === "your_nvidia_key_here") {
            return NextResponse.json(
              {
                error: `Gemini & OpenRouter failed, and NVIDIA_API_KEY is missing. Gemini error: ${geminiErr?.message}`,
              },
              { status: 500 }
            );
          }

          try {
            result = await callNvidia(context, prompt, companyName, nvidiaKey);
            _fallbackUsed = true;
            _fallbackProvider = "NVIDIA";
          } catch (nvidiaErr: any) {
            return NextResponse.json(
              {
                error: `All engines failed. Gemini: ${geminiErr?.message} | NVIDIA: ${nvidiaErr?.message}`,
              },
              { status: 500 }
            );
          }
        }
      }
    }

    return NextResponse.json({
      result,
      _fallbackUsed,
      _fallbackProvider,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/enrich] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
