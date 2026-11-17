# 🏗️ MailPilot AI — System Architecture & Component Specification

This document provides a detailed architectural breakdown of the **MailPilot AI** platform, illustrating the interaction between the frontend client applications, backend application services, artificial intelligence engines, third-party communication APIs, and the cloud persistence layer.

---

## 1. High-Level System Architecture

The following diagram illustrates the complete end-to-end topology of MailPilot AI across its four core tiers: Client Presentation, API Gateway & Application Services, AI & Integration Engines, and the Cloud Persistence Layer.

```mermaid
flowchart TD
    subgraph ClientTier["1. Presentation Layer (Firebase Hosting)"]
        UI_SPA["MailPilot Web Application<br/>(React 18 + Vite + Tailwind CSS)"]
        subgraph SubPortals["Dual-Portal Interface"]
            AssistantPortal["Executive Assistant Portal<br/>• Inbox & 4-Tier Triage<br/>• AI Composer & Editor<br/>• Thread Analyzer"]
            ClientPortal["Executive Client Portal<br/>• Clean Decision Feed<br/>• 1-Click Approvals<br/>• Delegated Queue"]
        end
        UI_SPA --> AssistantPortal
        UI_SPA --> ClientPortal
    end

    subgraph GatewayTier["2. API Gateway & Application Server (Render)"]
        ExpressServer["Node.js / Express Server<br/>(Port 10000 / Production HTTPS)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
        CORSSecurity["CORS & Origin Validation Engine"]
        ExpressServer --> CORSSecurity
        CORSSecurity --> AuthMiddleware
    end

    subgraph ServiceTier["3. Business Logic & AI Intelligence Layer"]
        AuthService["Auth & Session Controller<br/>• Local & Google OAuth2 Handlers"]
        TriageEngine["Autonomous Triage Engine<br/>• 4-Tier Keyword & Rule Parser<br/>• Urgency & Deadline Extractor"]
        GeminiService["Google Gemini 2.5 Flash Engine<br/>• Multi-Tone Draft Synthesis<br/>• Executive Thread Summaries<br/>• Intent & Sentiment Analysis"]
        SyncService["Real-Time Inbox Sync Service<br/>• Gmail REST API v1 Adapter<br/>• Microsoft Graph v1.0 Adapter"]
        CalendarService["Calendar & Meeting Engine<br/>• Appointment Extraction<br/>• Event Scheduling"]
    end

    subgraph ExternalServices["4. External APIs & Cloud Services"]
        GoogleOAuth["Google Cloud Identity Platform<br/>(OAuth 2.0 / OpenID Connect)"]
        GoogleGeminiAPI["Google Gemini 2.5 Flash API"]
        GmailAPI["Google Workspace Gmail API"]
        MSGraphAPI["Microsoft Graph API (Outlook 365)"]
    end

    subgraph DatabaseTier["5. Cloud Persistence Layer"]
        MongoAtlas[("MongoDB Atlas Cloud Cluster<br/>(AWS us-east-1 / M0 Shared)")]
        LocalFallback[("Local Persistent Disk Storage<br/>(WiredTiger Engine Fallback)")]
    end

    %% Connections
    UI_SPA -- "HTTPS / REST API" --> ExpressServer
    AuthMiddleware --> AuthService
    AuthMiddleware --> TriageEngine
    AuthMiddleware --> SyncService

    AuthService <--> GoogleOAuth
    TriageEngine <--> GeminiService
    GeminiService <--> GoogleGeminiAPI
    SyncService <--> GmailAPI
    SyncService <--> MSGraphAPI
    SyncService --> CalendarService

    AuthService --> MongoAtlas
    TriageEngine --> MongoAtlas
    SyncService --> MongoAtlas
    MongoAtlas -. "Auto-failover if IP restricted" .-> LocalFallback
```

---

## 2. Email Lifecycle & AI Triage Sequence

This sequence diagram details how an incoming email is fetched, processed by the AI layer, presented to the assistant, delegated, and approved by the executive client.

```mermaid
sequenceDiagram
    autonumber
    actor ExternalSender as External Sender
    participant Gmail as Gmail / Outlook API
    participant Sync as Background Sync Service
    participant Gemini as Google Gemini AI Engine
    participant DB as MongoDB Atlas
    actor Assistant as Executive Assistant
    actor Client as Executive Client

    ExternalSender->>Gmail: Sends new email thread
    Sync->>Gmail: Polls / receives new messages via REST API
    Gmail-->>Sync: Returns raw MIME messages & metadata
    
    Sync->>Gemini: Requests classification, summary & deadline extraction
    Gemini-->>Sync: Returns 4-Tier classification, priority & executive summary
    
    Sync->>DB: Stores email thread & triggers ActivityLog entry
    
    Assistant->>DB: Loads Assistant Dashboard & Inbox (/emails)
    DB-->>Assistant: Displays categorized email under "Client to Reply"
    
    Assistant->>Gemini: Requests AI reply draft (Tone: Formal Executive)
    Gemini-->>Assistant: Returns polished, context-aware draft
    
    Assistant->>DB: Edits draft & clicks "Delegate to Client"
    DB-->>DB: Status changes to "delegated" (enters Client Approval Queue)
    
    Client->>DB: Opens Executive Portal (/client)
    DB-->>Client: Displays summary & prepared draft awaiting approval
    
    Client->>DB: Clicks "Approve & Send"
    DB->>Gmail: Outbound dispatch via Gmail API
    Gmail-->>ExternalSender: Delivers approved executive response
```

---

## 3. Database Entity-Relationship Model (ERD)

The data model is structured in MongoDB Atlas to support multi-account linking, robust thread tracking, and complete audit logging:

```mermaid
erDiagram
    USER ||--o{ CLIENT : manages
    USER {
        ObjectId _id PK
        string name
        string email
        string password
        string role "assistant | client"
        string avatar
        date createdAt
    }

    CLIENT ||--o{ EMAIL_ACCOUNT : owns
    CLIENT ||--o{ EMAIL : receives
    CLIENT {
        ObjectId _id PK
        string name
        string email
        string company
        ObjectId assistantId FK
        string status "active | inactive"
    }

    EMAIL_ACCOUNT {
        ObjectId _id PK
        ObjectId clientId FK
        string provider "gmail | outlook"
        string email
        string status "connected | error"
        string accessToken
        string refreshToken
        date lastSync
    }

    EMAIL ||--o{ DRAFT : has
    EMAIL {
        ObjectId _id PK
        ObjectId clientId FK
        string threadId UK
        string subject
        string preview
        string classification "ASSISTANT_TO_REPLY | CLIENT_TO_REPLY | NO_REPLY_NEEDED | NEEDS_REVIEW"
        string priority "URGENT | HIGH | MEDIUM | LOW"
        boolean isImportant
        boolean isUnread
        string status "inbox | delegated | completed | archived"
        date createdAt
    }

    DRAFT {
        ObjectId _id PK
        ObjectId emailId FK
        ObjectId clientId FK
        string content
        string tone "formal | concise | friendly | executive"
        string status "draft | pending_approval | approved | sent"
        string generatedBy "ai | manual"
    }

    CLIENT ||--o{ ACTIVITY_LOG : logs
    ACTIVITY_LOG {
        ObjectId _id PK
        ObjectId clientId FK
        string action
        string description
        string entityType
        ObjectId entityId
        date timestamp
    }
```

---

## 4. Technology Stack & Deployment Specifications

| Layer | Technology | Hosting / Platform | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | **Firebase Hosting** (`mailpilot-ai-app.web.app`) | Dual-portal responsive UI, client-side routing, optimistic state updates. |
| **Backend** | Node.js 20, Express, JWT, Morgan, Helmet | **Render.com** Web Service (`mailpolitai.onrender.com`) | RESTful API routes, OAuth2 callback handshakes, role-based authorization. |
| **AI Intelligence** | Google Gemini 2.5 Flash API + Neural Rule Engine | **Google Cloud Vertex / AI Studio** | Sub-second email classification, tone adaptation, and executive summarization. |
| **Persistence** | MongoDB 7.0 + Mongoose ODM | **MongoDB Atlas** (AWS US-East Cluster) | Document storage with automated indexing on threadId, clientId, and timestamps. |
| **Integrations** | Google Workspace OAuth 2.0, Microsoft Graph API | **Google Cloud Platform & Azure** | Multi-inbox message synchronization and calendar event extraction. |
