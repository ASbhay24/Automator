export type ApplicationStatus =
  | "To Apply"
  | "Applied 📩"
  | "Response Received 💬"
  | "Interviewing 🎯";

export interface CompanyRow {
  id: string;
  Company: string;
  Website: string;
  Category: string;
  Personalized_Hook: string;
  Contact_Email: string;
  Status: ApplicationStatus;
  [key: string]: string; // support dynamic columns
}

export const starterData: CompanyRow[] = [
  {
    id: "1",
    Company: "Supabase",
    Website: "https://supabase.com",
    Category: "Developer Tools / BaaS",
    Personalized_Hook: "",
    Contact_Email: "founders@supabase.com",
    Status: "To Apply",
  },
  {
    id: "2",
    Company: "PostHog",
    Website: "https://posthog.com",
    Category: "Product Analytics",
    Personalized_Hook: "",
    Contact_Email: "careers@posthog.com",
    Status: "To Apply",
  },
  {
    id: "3",
    Company: "Convex",
    Website: "https://convex.dev",
    Category: "Reactive Backend",
    Personalized_Hook: "",
    Contact_Email: "founders@convex.dev",
    Status: "To Apply",
  },
  {
    id: "4",
    Company: "Clerk",
    Website: "https://clerk.com",
    Category: "Auth & User Management",
    Personalized_Hook: "",
    Contact_Email: "team@clerk.com",
    Status: "To Apply",
  },
  {
    id: "5",
    Company: "Inngest",
    Website: "https://inngest.com",
    Category: "Event-Driven Orchestration",
    Personalized_Hook: "",
    Contact_Email: "hello@inngest.com",
    Status: "To Apply",
  },
  {
    id: "6",
    Company: "Trigger.dev",
    Website: "https://trigger.dev",
    Category: "Background Jobs",
    Personalized_Hook: "",
    Contact_Email: "founders@trigger.dev",
    Status: "To Apply",
  },
  {
    id: "7",
    Company: "BetterStack",
    Website: "https://betterstack.com",
    Category: "Observability & Uptime",
    Personalized_Hook: "",
    Contact_Email: "jobs@betterstack.com",
    Status: "To Apply",
  },
  {
    id: "8",
    Company: "Resend",
    Website: "https://resend.com",
    Category: "Email Infrastructure",
    Personalized_Hook: "",
    Contact_Email: "zeno@resend.com",
    Status: "To Apply",
  },
];

export const additionalYCStartups: Omit<CompanyRow, "id">[] = [
  {
    Company: "Vercel",
    Website: "https://vercel.com",
    Category: "Frontend Cloud & Deployment",
    Personalized_Hook: "",
    Contact_Email: "careers@vercel.com",
    Status: "To Apply",
  },
  {
    Company: "Linear",
    Website: "https://linear.app",
    Category: "Issue Tracking & Project Management",
    Personalized_Hook: "",
    Contact_Email: "founders@linear.app",
    Status: "To Apply",
  },
  {
    Company: "Raycast",
    Website: "https://raycast.com",
    Category: "Desktop Productivity",
    Personalized_Hook: "",
    Contact_Email: "jobs@raycast.com",
    Status: "To Apply",
  },
  {
    Company: "Modal",
    Website: "https://modal.com",
    Category: "Serverless AI Compute",
    Personalized_Hook: "",
    Contact_Email: "team@modal.com",
    Status: "To Apply",
  },
  {
    Company: "Pinecone",
    Website: "https://pinecone.io",
    Category: "Vector Database",
    Personalized_Hook: "",
    Contact_Email: "careers@pinecone.io",
    Status: "To Apply",
  },
  {
    Company: "Dub.co",
    Website: "https://dub.co",
    Category: "Open Source Link Management",
    Personalized_Hook: "",
    Contact_Email: "steven@dub.co",
    Status: "To Apply",
  },
  {
    Company: "Mintlify",
    Website: "https://mintlify.com",
    Category: "AI Documentation Platform",
    Personalized_Hook: "",
    Contact_Email: "founders@mintlify.com",
    Status: "To Apply",
  },
  {
    Company: "Cursor",
    Website: "https://cursor.com",
    Category: "AI Code Editor",
    Personalized_Hook: "",
    Contact_Email: "founders@cursor.com",
    Status: "To Apply",
  },
];

/** All default column keys in display order */
export const defaultColumns = [
  "Company",
  "Website",
  "Category",
  "Personalized_Hook",
  "Contact_Email",
  "Status",
] as const;
