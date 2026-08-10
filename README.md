<div align="center">
  <img src="https://img.icons8.com/?size=512&id=v9hN7Kz72o1X&format=png" alt="Logo" width="100" height="100" />
  <h1>ClayLite CRM</h1>
  <p><strong>A hyper-personalized, AI-powered internship application and outreach CRM.</strong></p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://authjs.dev/"><img src="https://img.shields.io/badge/NextAuth_v5-8A2BE2?style=for-the-badge&logo=next.js&logoColor=white" alt="NextAuth v5" /></a>
  </p>
</div>

---

## ⚡ Overview

**ClayLite** is a modern, beautifully designed outreach CRM built specifically for students and job seekers to manage, automate, and hyper-personalize their cold emails and internship applications. 

By deeply integrating Large Language Models (LLMs) and your own personal profile, ClayLite analyzes a company's website and mission to generate a bespoke, highly targeted email hook. With our seamless **"Bring Your Own Database" (BYOD)** architecture, your entire CRM syncs magically with your personal Google Drive using the Google Sheets API.

---

## ✨ Key Features

- 🧠 **AI-Powered Enrichment:** Instantly generate personalized cold-email hooks tailored to any company's mission using **OpenRouter**, **Google Gemini**, or **OpenAI**.
- ☁️ **BYOD Google Sheets Sync:** Never lose your data. Sign in with Google to automatically backup, sync, and restore your CRM grid directly from a secure Google Sheet in your personal Drive.
- 🎨 **Hyper-Personalized Outreach:** Configure your college, major, GitHub, portfolio, and projects in the built-in Profile system to automatically weave them into your generated outreach emails.
- 📊 **Dynamic Data Grid:** A high-performance spreadsheet interface to track applications, cycle statuses (To Apply ➔ Applied ➔ Interviewing), and manage unlimited prospects.
- 🌗 **Premium UI/UX:** Built with Tailwind CSS, featuring a sleek dark mode, glassmorphism elements, fluid micro-animations, and responsive design.

---

## 🏗️ Technology Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **Authentication:** [Auth.js (NextAuth v5)](https://authjs.dev/) with Google OAuth
- **Database/Storage:** Google Drive & Google Sheets API (`googleapis`)
- **AI Integration:** Direct integrations with `OpenAI`, `Google Generative AI`, and `OpenRouter`

---

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **pnpm**
- A **Google Cloud Console** project (for OAuth and Sheets API)

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/clay-lite.git
cd clay-lite

# Install dependencies
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root of your project and populate it with your API keys and Google OAuth credentials.

```env
# AI Provider Keys (At least one is required)
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
NVIDIA_API_KEY=your_nvidia_api_key

# Google OAuth & BYOD Storage (Required for Google Sign-in and Sync)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=a_random_32_character_secret_string
```

> **Note on Google Setup:** Ensure you have enabled the **Google Sheets API** and **Google Drive API** in your Google Cloud Console. Set your Authorized JavaScript Origin to `http://localhost:3000` and Redirect URI to `http://localhost:3000/api/auth/callback/google`.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## 📖 Usage Guide

1. **Configure Your Profile:** Click the **Profile** button in the sidebar to add your name, college, custom links, and projects. This data forms the backbone of your AI-generated emails.
2. **Configure AI Settings:** Open the **Settings** gear to choose your preferred AI provider and model (e.g., Gemini 1.5 Pro, Claude 3.5 Sonnet via OpenRouter).
3. **Import Prospects:** Use the "Import CSV" feature or load the starter batches to populate your CRM.
4. **Enrich Data:** Select rows and hit the **"✨ Enrich Data"** button to let AI research the company and draft your perfect email hook.
5. **Sync to Cloud:** Click **Sign in with Google**. Your local grid and profile will seamlessly upload to a new Google Sheet named `ClayLite_CRM_Data` in your Drive, automatically syncing changes as you work.

---

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <i>Built with ❤️ for ambitious students and job seekers everywhere.</i>
</div>
