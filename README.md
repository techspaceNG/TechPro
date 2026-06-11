# 🚀 TechPro

**TechPro** is a modern, responsive, and secure personal project management system. Designed for developers and project managers, it keeps track of active projects, project tasks, and sensitive credentials within a secure, encrypted **Vault**. It features a floating **Gemini AI Chatbot Assistant** capable of performing database actions in real-time.

---

## ✨ Features

- **📊 Centralized Dashboard**: Real-time stats showing project completion status, active task counts, secure vault credentials, and general workflow trends.
- **📁 Project & Task Tracking**: Full CRUD interface for projects, including checklist items, custom project statuses, and task progression.
- **🔒 Secure Credentials Vault**: Grouped login credentials for websites and third-party APIs. Password records are encrypted client-side using **AES-256-GCM** (authenticated encryption) and can only be decrypted and viewed on-demand by the administrator.
- **📝 Markdown Notes & Wiki**: A dual-pane markdown notes system allowing global wiki articles or project-specific logs.
- **🤖 Floating Gemini AI Assistant**: A conversational assistant powered by **Google Gemini 1.5 Flash**. Users can chat with it to perform system actions natively (e.g. *"Create a project named IoT Dashboard"*, *"Add a task configure API routes to TechPro"*, or *"Search my credentials vault"*).
- **📄 Document AI Auditer**: Drag-and-drop text file analyzer that queries the Gemini API to produce clean, structured bullet-point summaries of long documentations or code logs.
- **🛡️ NextAuth Security**: Single-user setup to protect your private system. Public registration pages automatically lock down once the primary administrator account is configured.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: MongoDB Atlas via Mongoose
- **Authentication**: NextAuth.js (Credentials Provider)
- **AI Integration**: Google Gemini 1.5 Flash API (native v1beta REST endpoints)
- **Security**: AES-256-GCM Symmetric Encryption (built-in Node `crypto` library)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or later)
- MongoDB Connection String (Atlas or Local Instance)
- Google Gemini API Key

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/techspaceNG/TechPro.git
   cd TechPro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   # MongoDB Atlas Connection
   MONGODB_URI="your-mongodb-connection-string"

   # NextAuth Setup
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="a-random-32-character-string"

   # Security Vault (Must be a secure random key string)
   ENCRYPTION_KEY="your-32-character-encryption-key"

   # AI Integration
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

5. **First-Time Registration**:
   Go to `/register` to configure the main admin profile. Once registered, the page will lock down to prevent public logins or access.

---

## 🔒 Security Architecture

The vault utilizes **AES-256-GCM** authenticated symmetric encryption to secure your passwords:
- Every encrypted payload contains its own random Initialization Vector (IV) and Authentication Tag.
- The `ENCRYPTION_KEY` is kept safe on the server-side environment.
- Passwords are encrypted before entering MongoDB and are only decrypted on-demand via a secure `/api/credentials/[id]/decrypt` route which is gated by active NextAuth session verification.

---

## 🤝 License

Distributed under the MIT License. See `LICENSE` for more information.
