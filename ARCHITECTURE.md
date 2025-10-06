# Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              React Frontend (Port 5173)                 │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │    │
│  │  │  ChatWidget  │  │ ChatMessage  │  │  ChatInput  │ │    │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │    │
│  │         │                  │                  │         │    │
│  │  ┌──────┴──────────────────┴──────────────────┘        │    │
│  │  │            useChat Hook                             │    │
│  │  └─────────────────┬───────────────────────────────────┘    │
│  │                    │ HTTP/Fetch API                    │    │
│  └────────────────────┼───────────────────────────────────┘    │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │ https (CORS Protected)
                        │
┌───────────────────────┼──────────────────────────────────────────┐
│                       ▼                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Node.js Backend (Port 3001)                     │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │           Express Server                          │  │    │
│  │  │  ┌────────────┐  ┌─────────────┐  ┌───────────┐ │  │    │
│  │  │  │   CORS     │  │   Helmet    │  │Rate Limit │ │  │    │
│  │  │  └────────────┘  └─────────────┘  └───────────┘ │  │    │
│  │  └──────────────────────┬───────────────────────────┘  │    │
│  │                         │                               │    │
│  │  ┌──────────────────────┴───────────────────────────┐  │    │
│  │  │              API Routes                           │  │    │
│  │  │  /chat/send    /chat/stream    /chat/history     │  │    │
│  │  │  /chat/upload  /tickets/create  /health          │  │    │
│  │  └──────────────────────┬───────────────────────────┘  │    │
│  │                         │                               │    │
│  │  ┌──────────────────────┴──────────┐                   │    │
│  │  │                                  │                   │    │
│  │  ▼                                  ▼                   │    │
│  │  ┌─────────────┐         ┌──────────────────┐         │    │
│  │  │  Validation │         │ Flowise Client   │         │    │
│  │  │  Sanitize   │         │ (with retries)   │         │    │
│  │  └─────────────┘         └────────┬─────────┘         │    │
│  │                                    │                    │    │
│  │  ┌─────────────────────────────────┘                   │    │
│  │  │                                                      │    │
│  │  ▼                                                      │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │         In-Memory Storage                         │  │    │
│  │  │  ┌──────────┐  ┌─────────┐  ┌────────────────┐  │  │    │
│  │  │  │Conversat-│  │Messages │  │Support Tickets │  │  │    │
│  │  │  │  ions    │  │         │  │                │  │  │    │
│  │  │  └──────────┘  └─────────┘  └────────────────┘  │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                         │                                        │
│                         │ HTTP/REST API                          │
│                         │ (with API Key)                         │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Flowise AI (Port 3000)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Chatflow                             │    │
│  │                                                          │    │
│  │  ┌──────────┐       ┌────────────────┐                │    │
│  │  │   LLM    │◄──────│Conversation    │                │    │
│  │  │(OpenAI)  │       │    Chain       │                │    │
│  │  └──────────┘       └────────┬───────┘                │    │
│  │                              │                          │    │
│  │                    ┌─────────▼─────────┐               │    │
│  │                    │  Buffer Memory    │               │    │
│  │                    │  (Session State)  │               │    │
│  │                    └───────────────────┘               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Sends Message

```
User Types Message
    │
    ▼
ChatInput Component
    │
    ▼
useChat Hook
    │
    ├──> (Optional) Upload Files via /chat/upload
    │
    ▼
POST /api/chat/send
    │
    ▼
Express Route Handler
    │
    ├──> Input Validation
    ├──> Sanitization
    │
    ▼
Storage: Create/Update Conversation
    │
    ├──> Add User Message
    │
    ▼
Flowise Client
    │
    ├──> Retry Logic
    │
    ▼
Flowise API: POST /prediction/{chatflowId}
    │
    ▼
LLM Processes Message
    │
    ▼
Flowise Returns Response
    │
    ▼
Storage: Add Assistant Message
    │
    ▼
Response Returned to Frontend
    │
    ▼
ChatMessage Component Renders
    │
    ▼
User Sees Response
```

### 2. File Upload Flow

```
User Selects File
    │
    ▼
ChatInput Component
    │
    ├──> Preview File
    ├──> Show File Name & Size
    │
    ▼
User Sends Message
    │
    ▼
POST /api/chat/upload
    │
    ├──> Validate File Type
    ├──> Validate File Size
    ├──> Sanitize Filename
    │
    ▼
Multer Processes Upload
    │
    ├──> Convert to Base64
    ├──> Store in Memory
    │
    ▼
Return File URL
    │
    ▼
Attach to Message
    │
    ▼
Send Message with Attachment
```

### 3. Ticket Creation Flow

```
User Clicks Ticket Icon
    │
    ▼
ChatWidget Component
    │
    ▼
POST /api/tickets/create
    │
    ├──> Validate Conversation Exists
    ├──> Generate Ticket Number
    │
    ▼
Storage: Create Ticket
    │
    ├──> Update Conversation Status
    │
    ▼
(Optional) Trigger Webhook
    │
    ▼
Return Ticket Details
    │
    ▼
Show Success Alert
```

## Component Hierarchy

```
App.tsx
  │
  └─> ChatWidget
        │
        ├─> useChat (hook)
        │     │
        │     └─> API Calls
        │
        ├─> Header
        │     │
        │     └─> Ticket Button
        │
        ├─> Error Banner
        │
        ├─> Messages Container
        │     │
        │     ├─> ChatMessage (multiple)
        │     │     │
        │     │     ├─> Avatar
        │     │     ├─> Message Bubble
        │     │     ├─> Timestamp
        │     │     └─> Status Icon
        │     │
        │     └─> TypingIndicator
        │
        ├─> QuickReplies
        │     │
        │     └─> Reply Buttons
        │
        └─> ChatInput
              │
              ├─> File Attachments
              ├─> Textarea
              └─> Send Button
```

## State Management

### Frontend State (React)

```typescript
// useChat Hook State
{
  messages: Message[],           // All messages in conversation
  isLoading: boolean,            // Loading state
  error: Error | null,           // Error state
  conversationId: string | null  // Current conversation ID
}

// ChatWidget State
{
  isOpen: boolean,               // Widget open/closed
  userId: string                 // Current user ID
}
```

### Backend State (In-Memory)

```typescript
// Storage Maps
{
  conversations: Map<id, Conversation>,
  messages: Map<conversationId, Message[]>,
  tickets: Map<id, Ticket>,
  userConversations: Map<userId, conversationId[]>
}
```

## Security Layers

```
┌──────────────────────────────────────┐
│     1. Frontend Validation           │
│     - Input length checks             │
│     - File type validation            │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│     2. CORS Protection               │
│     - Origin validation               │
│     - Credentials handling            │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│     3. Rate Limiting                 │
│     - 100 req/15min per IP            │
│     - Prevents abuse                  │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│     4. Input Validation              │
│     - Schema validation               │
│     - Type checking                   │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│     5. Input Sanitization            │
│     - Remove HTML/scripts             │
│     - Limit lengths                   │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│     6. API Key Protection            │
│     - Keys stored on backend          │
│     - Never exposed to client         │
└─────────────┬────────────────────────┘
              │
              ▼
┌──────────────────────────────────────┐
│     7. Security Headers              │
│     - Helmet.js                       │
│     - CSP, XSS protection             │
└──────────────────────────────────────┘
```

## Error Handling Strategy

```
┌─────────────────────────────────────┐
│         Error Occurs                 │
└───────────────┬─────────────────────┘
                │
                ▼
        Is it retryable?
                │
        ┌───────┴───────┐
        │               │
       YES             NO
        │               │
        ▼               ▼
  ┌─────────┐    ┌──────────┐
  │ Retry   │    │ Return   │
  │ Logic   │    │ Error    │
  └────┬────┘    └────┬─────┘
       │              │
       │ Max          │
       │ Retries?     │
       │              │
       ▼              ▼
  ┌─────────────────────┐
  │  Log Error          │
  └─────────┬───────────┘
            │
            ▼
  ┌─────────────────────┐
  │ Show User-Friendly  │
  │ Error Message       │
  └─────────────────────┘
```

## Performance Optimizations

1. **Message Rendering**
   - React key-based reconciliation
   - Efficient re-renders
   - Virtual scrolling ready

2. **API Calls**
   - Retry with exponential backoff
   - Request deduplication
   - Abort controller for cancellation

3. **File Uploads**
   - Client-side validation before upload
   - Size limits enforced
   - Base64 for simple storage

4. **Memory Management**
   - In-memory storage (fast access)
   - Conversation cleanup (future)
   - Message limit per conversation (future)

## Scalability Considerations

### Current Implementation (In-Memory)
- ✓ Fast read/write operations
- ✓ Simple implementation
- ✗ Data lost on restart
- ✗ Single server limitation

### Future Database Implementation
- ✓ Data persistence
- ✓ Multi-server support
- ✓ Horizontal scaling
- ✓ Conversation history
- Note: Supabase schema already designed

## Integration Points

### 1. Flowise Integration
```
Backend ──HTTP──> Flowise API
         ├─> Authentication: Bearer token
         ├─> Request: Question + Session ID
         └─> Response: AI-generated text
```

### 2. Webhook Integration
```
Backend ──HTTP POST──> External System
         └─> Payload: Ticket/Event data
```

### 3. Frontend Embedding
```
Host App ──Import──> ChatWidget Component
         └─> Props: Configuration
```

## Monitoring Points

1. **Backend Metrics**
   - Request count
   - Response time
   - Error rate
   - Rate limit hits

2. **Flowise Metrics**
   - API call count
   - Response latency
   - Error rate
   - Token usage

3. **Frontend Metrics**
   - Message send success rate
   - UI interaction latency
   - Error occurrence

## Deployment Architecture

```
┌───────────────────────────────────────┐
│         CDN / Static Hosting          │
│         (Frontend - dist/)            │
│    ┌──────────────────────────────┐   │
│    │  Vercel / Netlify / S3       │   │
│    └──────────────────────────────┘   │
└───────────────┬───────────────────────┘
                │
                │ API Calls
                │
┌───────────────▼───────────────────────┐
│      Node.js Backend Server           │
│      (Docker / Cloud Run / EC2)       │
│    ┌──────────────────────────────┐   │
│    │  Express + TypeScript        │   │
│    │  Environment Variables       │   │
│    └──────────────────────────────┘   │
└───────────────┬───────────────────────┘
                │
                │ API Calls
                │
┌───────────────▼───────────────────────┐
│         Flowise Instance              │
│    (Docker / Cloud / Self-hosted)     │
│    ┌──────────────────────────────┐   │
│    │  Chatflows + LLM             │   │
│    └──────────────────────────────┘   │
└───────────────────────────────────────┘
```

## Technology Stack Summary

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **Language**: TypeScript
- **Execution**: tsx
- **Security**: Helmet, CORS
- **Validation**: express-validator

### AI Engine
- **Platform**: Flowise AI
- **LLMs**: OpenAI, Anthropic, etc.
- **Memory**: Buffer Memory
- **API**: REST

### Development
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Hot Reload**: Vite HMR, tsx watch
