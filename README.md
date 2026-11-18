<p align="center">
  <img src="frontend/public/logo.png" alt="MailPilot AI Logo" width="80" />
</p>

<h1 align="center">✈️ MailPilot AI</h1>

<p align="center">
  <strong>AI-Powered Executive Email Management & Delegation Platform</strong>
</p>

<p align="center">
  <a href="https://mailpilot-ai-app.web.app">🌐 Live Demo</a> ·
  <a href="#-getting-started">🚀 Getting Started</a> ·
  <a href="#-architecture">🏗️ Architecture</a> ·
  <a href="#-tech-stack">🛠️ Tech Stack</a> ·
  <a href="#-api-reference">📡 API Reference</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61dafb?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Live Demo](#-live-demo)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**MailPilot AI** is a full-stack, production-ready email management platform designed for busy executives and their executive assistants. It bridges the gap between high-volume email inboxes and intelligent, AI-driven triage — enabling seamless delegation workflows between assistant and executive roles.

Executives receive hundreds of emails daily. Critical client messages get buried under newsletters, vendor pitches, and internal FYIs. MailPilot AI solves this by:

1. **Connecting** directly to Gmail via OAuth 2.0 and syncing the real inbox.
2. **Classifying** every email thread automatically using Google Gemini AI.
3. **Summarizing** threads and **drafting** context-aware reply suggestions.
4. **Delegating** emails bidirectionally between assistants and executives with dedicated dashboards.

---

## ✨ Key Features

### 🔐 Authentication & Onboarding
- Secure email/password registration and login with JWT tokens
- Google OAuth 2.0 sign-in with one-click account linking
- Guided onboarding flow for first-time users
- Auto-provisioned personal workspace on sign-up

### 📬 Real-Time Gmail Integration
- OAuth 2.0 Gmail connection with offline refresh tokens
- One-click inbox sync (up to 50 recent threads per sync)
- Automatic extraction of sender, recipients, subject, body, and attachments
- Persistent email account linking per client workspace

### 🤖 AI-Powered Intelligence (Google Gemini)
- **Smart Classification**: Every email is categorized into one of four types:
  - `ASSISTANT_TO_REPLY` — Assistant should handle the response
  - `CLIENT_TO_REPLY` — Requires executive's personal attention
  - `NO_REPLY_NEEDED` — Informational, no action required
  - `NEEDS_REVIEW` — Ambiguous, flagged for manual triage
- **Priority Detection**: HIGH / MEDIUM / LOW with confidence scores
- **Thread Summarization**: Concise TL;DR summaries of multi-message threads
- **AI Reply Drafting**: Context-aware draft responses matching the thread's tone and content

### 👥 Dual-Role Delegation System
- **Assistant Dashboard**: Full operational triage with classification filters, bulk actions, search, and sync controls
- **Executive (Client) Dashboard**: Streamlined approval interface showing only items requiring executive decision
- **Bidirectional Delegation**: Assistant can delegate to client, client can delegate back to assistant
- **Multi-Client Workspaces**: Manage multiple executive clients from a single assistant account

### 🔍 Global Search & Filtering
- Real-time search across subjects, senders, email body content, and AI summaries
- URL-synced search queries (bookmarkable, shareable)
- Global ⌘K / Ctrl+K keyboard shortcut for instant search focus
- Advanced filtering by classification, priority, read/unread status, and importance

### 🎨 Modern UI/UX
- Responsive design optimized for desktop and mobile
- Dark mode / Light mode toggle with system preference detection
- Smooth transitions, micro-interactions, and loading skeletons
- Toast notifications for all user actions
- Professional modal dialogs with pinned action bars

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** (Firebase Hosting) | [https://mailpilot-ai-app.web.app](https://mailpilot-ai-app.web.app) |
| **Backend API** (Render) | [https://mailpolitai.onrender.com](https://mailpolitai.onrender.com) |
| **Health Check** | [https://mailpolitai.onrender.com/api/health](https://mailpolitai.onrender.com/api/health) |

---

## 🏗️ Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│                                                                     │
│   ┌───────────────────┐           ┌───────────────────┐            │
│   │  Assistant View    │           │  Executive View    │           │
│   │  (Full Dashboard)  │           │  (Approval Portal) │           │
│   │                    │           │                    │            │
│   │  • Email Inbox     │           │  • Priority Items  │           │
│   │  • AI Classification│          │  • One-click Actions│          │
│   │  • Search & Filter │           │  • Delegate Back   │           │
│   │  • Client Mgmt     │           │                    │           │
│   └────────┬───────────┘           └────────┬──────────┘            │
│            │        React + Vite + Tailwind  │                      │
│            └───────────────┬─────────────────┘                      │
│                            │ HTTPS (Axios)                          │
└────────────────────────────┼────────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                     API GATEWAY                                     │
│                            │                                        │
│              ┌─────────────▼──────────────┐                        │
│              │    Express.js REST API      │                        │
│              │    (Node.js Backend)        │                        │
│              │                             │                        │
│              │  • JWT Authentication       │                        │
│              │  • CORS + Helmet Security   │                        │
│              │  • Request Validation       │                        │
│              └──┬──────┬──────┬──────┬────┘                        │
│                 │      │      │      │                              │
│     ┌───────┐  │  ┌───┴──┐  │  ┌───┴───┐                          │
│     │ Auth  │  │  │Email │  │  │Client │                           │
│     │Routes │  │  │Routes│  │  │Routes │                           │
│     └───┬───┘  │  └──┬───┘  │  └───┬───┘                          │
│         │      │     │      │      │                               │
│     ┌───┴──┐ ┌─┴──┐ │  ┌───┴──┐  │   ┌────────┐                  │
│     │  AI  │ │Acct│ │  │Dash- │  │   │Meeting │                   │
│     │Routes│ │Rtes│ │  │board │  │   │Routes  │                   │
│     └──┬───┘ └─┬──┘ │  └──┬───┘  │   └────┬───┘                  │
│        │       │     │     │      │        │                       │
└────────┼───────┼─────┼─────┼──────┼────────┼───────────────────────┘
         │       │     │     │      │        │
┌────────┼───────┼─────┼─────┼──────┼────────┼───────────────────────┐
│        │   SERVICE LAYER   │      │        │                       │
│        │       │     │     │      │        │                       │
│   ┌────▼────┐  │  ┌──▼──────────▼─┐  ┌───▼─────────┐            │
│   │ Gemini  │  │  │ Gmail Sync    │  │ Executive   │             │
│   │ Service │  │  │ Service       │  │ Assistant   │             │
│   │         │  │  │               │  │ Engine      │             │
│   │•Classify│  │  │•OAuth2 Tokens │  │             │             │
│   │•Summariz│  │  │•Fetch Threads │  │•Auto-Provisi│             │
│   │•Draft   │  │  │•Parse Bodies  │  │•Workspace   │             │
│   └────┬────┘  │  └───────┬───────┘  └─────────────┘             │
│        │       │          │                                       │
│   ┌────▼────┐  │  ┌───────▼───────┐                              │
│   │Google   │  │  │  Integration  │                               │
│   │Gemini   │  │  │  Service      │                               │
│   │API      │  │  │  (Provider    │                               │
│   │(2.5     │  │  │   Router)     │                               │
│   │ Flash)  │  │  │               │                               │
│   └─────────┘  │  └───────────────┘                               │
│                │                                                   │
└────────────────┼───────────────────────────────────────────────────┘
                 │
┌────────────────┼───────────────────────────────────────────────────┐
│          DATA LAYER                                                │
│                │                                                   │
│   ┌────────────▼─────────────┐    ┌──────────────────────┐        │
│   │   MongoDB Atlas          │    │  External APIs       │        │
│   │                          │    │                      │        │
│   │  Collections:            │    │  • Google Gemini AI  │        │
│   │  ├── users               │    │  • Gmail REST API    │        │
│   │  ├── emails              │    │  • Google OAuth 2.0  │        │
│   │  ├── clients             │    │  • Google Calendar   │        │
│   │  ├── emailaccounts       │    │                      │        │
│   │  ├── drafts              │    └──────────────────────┘        │
│   │  ├── meetings            │                                    │
│   │  └── activitylogs        │                                    │
│   └──────────────────────────┘                                    │
└───────────────────────────────────────────────────────────────────┘
```

### Request Flow — Email Classification Pipeline

```
User clicks "Sync Emails"
        │
        ▼
┌───────────────────┐
│ POST /api/accounts│
│ /sync/gmail       │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐     ┌───────────────────┐
│ integrationService│────▶│ gmailSyncService   │
│ .syncProvider()   │     │ .syncGmailInbox()  │
└───────────────────┘     └────────┬───────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
              ▼                    ▼                     ▼
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │ Fetch Gmail  │     │ Parse Thread │     │ Store Email  │
   │ Threads via  │     │ Messages,    │     │ in MongoDB   │
   │ REST API     │     │ Headers,     │     │ with sender, │
   │ (OAuth2 JWT) │     │ Body (HTML/  │     │ subject,     │
   │              │     │ plain text)  │     │ preview      │
   └──────────────┘     └──────────────┘     └──────┬───────┘
                                                     │
                                                     ▼
                                          ┌──────────────────┐
                                          │ aiClassifier     │
                                          │ .classifyEmail() │
                                          │                  │
                                          │ Gemini 2.5 Flash │
                                          │ Prompt:          │
                                          │ • Sender context │
                                          │ • Subject + body │
                                          │ • Thread history │
                                          └────────┬─────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │ classification:     │
                                        │  type, confidence,  │
                                        │  priority, reason,  │
                                        │  summary,           │
                                        │  suggestedAction    │
                                        └─────────────────────┘
```

### Authentication Flow

```
┌──────────┐    POST /api/auth/register     ┌──────────┐
│  Client  │ ──────────────────────────────▶ │  Server  │
│ (React)  │                                 │(Express) │
│          │  ◀── { token, user } ────────── │          │
│          │                                 │          │
│          │    GET /api/accounts/google/auth │          │
│          │ ──────────────────────────────▶ │          │
│          │                                 │          │
│          │  ◀── Redirect to Google ─────── │          │
│          │                                 │          │
│          │    Google OAuth Consent Screen   │          │
│          │ ──────────────────────────────▶ │  Google  │
│          │                                 │  OAuth   │
│          │  ◀── Authorization Code ─────── │          │
│          │                                 │          │
│          │    /api/accounts/google/callback │          │
│          │ ──────────────────────────────▶ │          │
│          │                                 │          │
│          │  ◀── Redirect to /auth/callback │          │
│          │      with JWT token             │          │
└──────────┘                                 └──────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 18** | Component-based UI framework |
| **Vite 5** | Lightning-fast build tool and dev server |
| **Tailwind CSS 3** | Utility-first CSS framework |
| **React Router 6** | Client-side routing with nested layouts |
| **Axios** | HTTP client for API communication |
| **Recharts** | Data visualization (dashboard charts) |
| **Lucide React** | Beautiful, consistent icon library |
| **date-fns** | Date formatting and manipulation |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js 4** | REST API framework |
| **MongoDB + Mongoose 8** | NoSQL database with ODM |
| **JWT (jsonwebtoken)** | Stateless authentication tokens |
| **bcryptjs** | Password hashing |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |
| **express-validator** | Input validation and sanitization |

### AI & Integrations
| Technology | Purpose |
|-----------|---------|
| **Google Gemini 2.5 Flash** | Email classification, summarization, reply drafting |
| **Gmail REST API** | Real-time inbox sync via OAuth 2.0 |
| **Google OAuth 2.0** | Secure authentication and API authorization |

### Infrastructure & Deployment
| Service | Purpose |
|---------|---------|
| **Firebase Hosting** | Frontend static site hosting with global CDN |
| **Render** | Backend Node.js hosting with auto-deploy |
| **MongoDB Atlas** | Managed cloud database cluster |
| **Google Cloud Platform** | OAuth client credentials and API management |

---

## 📁 Project Structure

```
MailPilot-AI/
├── backend/                          # Express.js REST API
│   ├── config/
│   │   └── db.js                     # MongoDB connection (Atlas + local fallback)
│   ├── middleware/
│   │   ├── auth.js                   # JWT authentication middleware
│   │   └── errorHandler.js           # Global error handling
│   ├── models/
│   │   ├── User.js                   # User accounts (name, email, password, role)
│   │   ├── Email.js                  # Email threads (sender, messages, classification)
│   │   ├── Client.js                 # Executive client workspaces
│   │   ├── EmailAccount.js           # Connected email accounts (Gmail/Outlook tokens)
│   │   ├── Draft.js                  # AI-generated reply drafts
│   │   ├── Meeting.js                # Extracted meeting information
│   │   └── ActivityLog.js            # User activity audit trail
│   ├── routes/
│   │   ├── auth.js                   # POST /register, /login, /google
│   │   ├── emails.js                 # GET/PUT emails, search, classify, delegate
│   │   ├── clients.js                # CRUD client workspaces
│   │   ├── ai.js                     # POST /classify, /summarize, /draft-reply
│   │   ├── accounts.js               # Google OAuth flow, sync triggers
│   │   ├── dashboard.js              # Dashboard stats and aggregations
│   │   └── meetings.js               # Meeting CRUD
│   ├── services/
│   │   ├── geminiService.js          # Google Gemini API client wrapper
│   │   ├── aiClassifier.js           # Prompt-engineered classification pipeline
│   │   ├── aiAssistant.js            # Summarization and reply drafting
│   │   ├── gmailSyncService.js       # Gmail REST API thread fetching & parsing
│   │   ├── integrationService.js     # Provider-agnostic sync router
│   │   └── executiveAssistantEngine.js # Auto-provisioning engine
│   ├── seed/                         # Demo data seeding scripts
│   ├── server.js                     # Express app entry point
│   ├── package.json
│   └── .env.example                  # Environment variable template
│
├── frontend/                         # React SPA
│   ├── public/
│   │   └── logo.png                  # Application logo
│   ├── src/
│   │   ├── api/
│   │   │   └── index.js              # Axios API client with interceptors
│   │   ├── components/
│   │   │   ├── SearchBar.jsx         # Global search with ⌘K shortcut
│   │   │   ├── Modal.jsx             # Reusable modal dialog
│   │   │   ├── EmailCard.jsx         # Email list item component
│   │   │   ├── ClassificationBadge.jsx # AI classification pill
│   │   │   ├── PriorityBadge.jsx     # Priority indicator
│   │   │   ├── ClientSelector.jsx    # Client workspace switcher
│   │   │   ├── FilterBar.jsx         # Email filter controls
│   │   │   ├── NotificationPanel.jsx # Notification dropdown
│   │   │   ├── ProfileMenu.jsx       # User profile menu
│   │   │   ├── StatCard.jsx          # Dashboard metric card
│   │   │   ├── Toast.jsx             # Toast notification system
│   │   │   ├── LoadingSpinner.jsx    # Loading indicators
│   │   │   └── EmptyState.jsx        # Empty state illustrations
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Authentication state management
│   │   │   └── AppContext.jsx        # Global app state (clients, theme, counts)
│   │   ├── layouts/
│   │   │   ├── AssistantLayout.jsx   # Sidebar + header layout for assistants
│   │   │   └── ClientLayout.jsx      # Minimal layout for executive portal
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Login page with Google OAuth
│   │   │   ├── Register.jsx          # Registration page
│   │   │   ├── Onboarding.jsx        # First-time user onboarding
│   │   │   ├── AuthCallback.jsx      # OAuth redirect handler
│   │   │   ├── Dashboard.jsx         # Main assistant dashboard
│   │   │   ├── EmailInbox.jsx        # Email list with search, filters, pagination
│   │   │   ├── EmailDetail.jsx       # Thread view with AI tools
│   │   │   ├── AIAssistant.jsx       # AI assistant interaction page
│   │   │   ├── Clients.jsx           # Client workspace management
│   │   │   ├── ClientDashboard.jsx   # Executive approval portal
│   │   │   ├── Meetings.jsx          # Meeting management
│   │   │   └── Settings.jsx          # App settings and integrations
│   │   ├── utils/
│   │   │   ├── constants.js          # Nav items, classification configs
│   │   │   └── helpers.js            # Utility functions (colors, dates, initials)
│   │   ├── App.jsx                   # Route definitions
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Global styles and animations
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── firebase.json                     # Firebase Hosting configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** account (or local MongoDB)
- **Google Cloud Platform** project with:
  - OAuth 2.0 Client ID (Web Application)
  - Gmail API enabled
  - Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/gowtham-v-data/MailPolitAI.git
cd MailPolitAI
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)
npm run dev    # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev    # Starts on http://localhost:5173
```

### 4. Open the App

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔧 Environment Variables

Create a `backend/.env` file based on the template below:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-secret-key

# MongoDB Atlas (Cloud Database)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/mailpilot?retryWrites=true&w=majority

# Google Gemini AI (Classification, Summarization & Reply Drafting)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# Gmail API & Google OAuth 2.0
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/accounts/google/callback

# Frontend URL (for CORS and OAuth redirects)
FRONTEND_URL=http://localhost:5173
```

### How to Get Each Credential

| Variable | Where to Get It |
|----------|----------------|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Create Cluster → Connect → Connection String |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API Key |
| `GOOGLE_CLIENT_ID` / `SECRET` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client |
| `JWT_SECRET` | Any strong random string (use `openssl rand -hex 32`) |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Sign in with email/password |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Emails
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/emails` | List emails with search, filters, pagination |
| `GET` | `/api/emails/:id` | Get single email thread with messages |
| `PUT` | `/api/emails/:id/classify` | Manually change classification |
| `PUT` | `/api/emails/:id/delegate` | Delegate email to client |
| `PUT` | `/api/emails/:id/complete` | Mark email as handled |
| `PUT` | `/api/emails/:id/important` | Toggle important flag |
| `GET` | `/api/emails/stats/:clientId?` | Get email count statistics |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/classify/:id` | AI-classify a specific email |
| `POST` | `/api/ai/summarize/:id` | Generate AI summary for a thread |
| `POST` | `/api/ai/draft-reply/:id` | Generate AI draft reply |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/clients` | List all client workspaces |
| `POST` | `/api/clients` | Create a new client workspace |
| `PUT` | `/api/clients/:id` | Update client details |
| `DELETE` | `/api/clients/:id` | Deactivate a client |

### Accounts & Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/accounts/google/auth` | Initiate Google OAuth flow |
| `GET` | `/api/accounts/google/callback` | OAuth redirect handler |
| `POST` | `/api/accounts/sync/:provider` | Sync inbox from connected account |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Aggregated dashboard statistics |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |

---

## 🚢 Deployment

### Frontend — Firebase Hosting

```bash
cd frontend
npm run build
npx firebase-tools deploy --only hosting --project mailpilot-ai-app
```

### Backend — Render

1. Connect your GitHub repo to [Render](https://render.com)
2. Create a **Web Service** pointing to the `backend/` directory
3. Set the build command to `npm install`
4. Set the start command to `npm start`
5. Add all environment variables from `.env`

### Production Environment Variables

For production deployment, update:
```env
NODE_ENV=production
FRONTEND_URL=https://mailpilot-ai-app.web.app
GOOGLE_REDIRECT_URI=https://mailpolitai.onrender.com/api/accounts/google/callback
```

---

## 📸 Screenshots

### Assistant Dashboard
> Main operational dashboard with email statistics, classification breakdown, and recent activity.

### Email Inbox with AI Classification
> Intelligent inbox with real-time search, priority badges, and AI-powered classification tags.

### AI Email Summary & Reply Drafting
> Thread view showing AI-generated summary and context-aware draft reply suggestions.

### Executive Client Dashboard
> Streamlined executive portal showing only items requiring personal attention.

### Client Workspace Management
> Professional client card grid with search, status badges, and quick actions.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Gowtham V** — [GitHub](https://github.com/gowtham-v-data)

---

<p align="center">
  Built with ❤️ using React, Node.js, MongoDB, and Google Gemini AI
</p>
