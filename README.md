# MailPilot AI ✈️

> AI-Powered Email Management Dashboard for Personal Assistants

MailPilot AI is an intelligent email management platform that helps personal assistants efficiently organize and manage their clients' emails. Using AI-powered classification, the system automatically determines who should respond to each email — the assistant, the client, or no one at all.

## ✨ Key Features

- **AI Email Classification** — Automatically categorizes emails as Assistant to Reply, Client to Reply, No Reply Needed, or Needs Review
- **Dual Dashboard** — Full-featured assistant dashboard + minimalistic client-facing view
- **Smart Insights** — AI-generated summaries, action items, deadlines, and meeting extraction
- **Draft Generation** — AI-powered professional email reply drafting
- **Real-time Sync** — Client actions (delegate, mark handled) instantly update the assistant's view
- **Multi-Client Support** — Manage multiple clients from a single dashboard

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI | Rule-based classifier with Gemini API integration point |
| Auth | JWT (JSON Web Tokens) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Personal-AI-Assistant

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mailpilot
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Seed the Database

```bash
cd backend
npm run seed
```

This creates demo users, clients, and 30+ realistic email conversations.

### Run the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Assistant | sarah@mailpilot.ai | password123 |
| Client | james@techvision.com | password123 |

## 📱 Screens

1. **Login/Register** — Authentication with role-based access
2. **Onboarding** — Connect email accounts (simulated)
3. **Dashboard** — Stats, recent conversations, charts, AI insights
4. **Email Inbox** — Advanced filtering, search, sort by classification
5. **Email Detail** — Full conversation, AI analysis, draft replies
6. **AI Assistant** — Chat-based email assistant
7. **Client Dashboard** — Minimal view showing only emails needing client attention
8. **Client Management** — Add/edit clients, manage accounts
9. **Meetings** — Extracted meetings and appointments
10. **Settings** — Profile, accounts, AI preferences

## 🤖 AI Classification

Every email is analyzed and assigned:

| Classification | Description | Example |
|---------------|-------------|---------|
| ASSISTANT_TO_REPLY | Assistant should handle | Scheduling, admin tasks |
| CLIENT_TO_REPLY | Client must respond personally | Approvals, decisions |
| NO_REPLY_NEEDED | No response required | Newsletters, notifications |
| NEEDS_REVIEW | Ambiguous — needs human review | Mixed content emails |

Each classification includes:
- Confidence score (0-1)
- AI reasoning
- Summary
- Priority level
- Suggested action

## 📄 License

MIT
