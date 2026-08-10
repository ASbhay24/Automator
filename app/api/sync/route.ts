import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { google } from "googleapis";

// Force Node.js runtime (googleapis requires Node-only modules)
export const runtime = "nodejs";

/* ------------------------------------------------------------------ */
/* /api/sync — Google Sheets BYOD Sync                                 */
/* GET  → Load CRM data & Profile from user's Google Drive             */
/* POST → Save CRM data & Profile to user's Google Drive               */
/* ------------------------------------------------------------------ */

const SPREADSHEET_NAME = "ClayLite_CRM_Data";
const DEFAULT_HEADERS = [
  "Company",
  "Website",
  "Category",
  "Personalized_Hook",
  "Contact_Email",
  "Status",
];

/* ─── Helper: Build authenticated Google clients ──────────────────── */
function getClients(accessToken: string) {
  const oAuth2Client = new google.auth.OAuth2();
  oAuth2Client.setCredentials({ access_token: accessToken });

  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  const sheets = google.sheets({ version: "v4", auth: oAuth2Client });

  return { drive, sheets };
}

/* ─── Helper: Find existing ClayLite spreadsheet in Drive ─────────── */
async function findSpreadsheet(drive: ReturnType<typeof google.drive>) {
  const res = await drive.files.list({
    q: `name='${SPREADSHEET_NAME}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  return res.data.files?.[0] || null;
}

/* ─── Helper: Create new spreadsheet with headers ─────────────────── */
async function createSpreadsheet(
  sheets: ReturnType<typeof google.sheets>,
  headers: string[]
) {
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SPREADSHEET_NAME },
      sheets: [
        { properties: { title: "CRM Data", index: 0 } },
        { properties: { title: "Profile", index: 1 } },
      ],
    },
  });

  const spreadsheetId = res.data.spreadsheetId!;

  // Write header row for CRM
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "CRM Data!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [headers],
    },
  });

  // Write headers for Profile
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Profile!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [["Key", "Value"]],
    },
  });

  return spreadsheetId;
}

/* ================================================================== */
/* GET /api/sync — Load data from Google Sheet                         */
/* ================================================================== */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.error === "RefreshTokenError") {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const { drive, sheets } = getClients(session.accessToken);
    const existing = await findSpreadsheet(drive);

    if (!existing) {
      const sheetId = await createSpreadsheet(sheets, DEFAULT_HEADERS);
      return NextResponse.json({
        rows: [],
        columns: DEFAULT_HEADERS,
        profile: null,
        sheetId,
        isNew: true, // Frontend should immediately POST its local state here!
      });
    }

    const sheetId = existing.id!;

    // Read CRM data and Profile data in parallel
    const [crmRes, profileRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "CRM Data!A:ZZ" }),
      sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Profile!A:B" }).catch(() => null), // Catch if sheet doesn't exist
    ]);

    const crmValues = crmRes.data.values || [];
    
    // Parse Profile Data
    let profileData: Record<string, any> | null = null;
    if (profileRes?.data.values && profileRes.data.values.length > 1) {
      profileData = {};
      const pValues = profileRes.data.values.slice(1); // skip header
      for (const [key, val] of pValues) {
        if (!key) continue;
        try {
          profileData[key] = val ? JSON.parse(val) : "";
        } catch {
          profileData[key] = val || "";
        }
      }
    }

    if (crmValues.length === 0) {
      // Empty CRM sheet — set up headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "CRM Data!A1",
        valueInputOption: "RAW",
        requestBody: { values: [DEFAULT_HEADERS] },
      });

      return NextResponse.json({
        rows: [],
        columns: DEFAULT_HEADERS,
        profile: profileData,
        sheetId,
        isNew: false,
      });
    }

    const headers = crmValues[0] as string[];
    const dataRows = crmValues.slice(1);

    // Parse rows into JSON objects
    const rows = dataRows.map((row, idx) => {
      const obj: Record<string, string> = { id: String(idx + 1) };
      headers.forEach((header, colIdx) => {
        obj[header] = row[colIdx] || "";
      });
      return obj;
    });

    return NextResponse.json({
      rows,
      columns: headers,
      profile: profileData,
      sheetId,
      isNew: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    console.error("[/api/sync GET]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ================================================================== */
/* POST /api/sync — Save data to Google Sheet                          */
/* ================================================================== */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.error === "RefreshTokenError") {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const body = await req.json();
    const {
      rows,
      columns,
      profile,
      sheetId: providedSheetId,
    } = body as {
      rows: Record<string, string>[];
      columns: string[];
      profile?: Record<string, any>;
      sheetId?: string;
    };

    if (!rows || !columns) {
      return NextResponse.json({ error: "Missing rows or columns in request body" }, { status: 400 });
    }

    const { drive, sheets } = getClients(session.accessToken);

    let sheetId = providedSheetId;
    if (!sheetId) {
      const existing = await findSpreadsheet(drive);
      if (existing) {
        sheetId = existing.id!;
      } else {
        sheetId = await createSpreadsheet(sheets, columns);
      }
    }

    // 1. Ensure "Profile" sheet exists if older spreadsheet
    try {
      const sheetMetadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const hasProfile = sheetMetadata.data.sheets?.some(s => s.properties?.title === "Profile");
      
      if (!hasProfile) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: "Profile" } } }]
          }
        });
      }
    } catch (e) {
      console.warn("Could not verify/create Profile sheet", e);
    }

    // 2. Prepare Data for Batch Update
    const updates = [];

    // CRM Data update
    const crmAllValues = [columns, ...rows.map(row => columns.map(col => String(row[col] ?? "")))];
    updates.push(
      sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: "CRM Data!A:ZZ" })
        .then(() => sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: "CRM Data!A1",
          valueInputOption: "RAW",
          requestBody: { values: crmAllValues },
        }))
    );

    // Profile Data update
    if (profile) {
      const profileRows = [["Key", "Value"]];
      for (const [k, v] of Object.entries(profile)) {
        profileRows.push([k, typeof v === "object" ? JSON.stringify(v) : String(v)]);
      }
      updates.push(
        sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: "Profile!A:B" })
          .then(() => sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: "Profile!A1",
            valueInputOption: "RAW",
            requestBody: { values: profileRows },
          }))
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true, sheetId, rowCount: rows.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown sync error";
    console.error("[/api/sync POST]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
