# Flowise AI Support Chatbot

A production-ready support chatbot that integrates Flowise AI Chatflows with a React frontend and secure Node.js backend. Built to replicate the in-app support chat experience similar to Uber's support system.

## Features

### Frontend (React + TypeScript + Vite)
- 💬 Responsive chat widget component
- 📱 Mobile-friendly design
- 📎 File attachment support (images, PDFs, documents)
- ⚡ Quick reply buttons
- ⌨️ Typing indicators
- ✅ Message status indicators (sent/delivered/failed)
- 🕐 Message timestamps
- 🔄 Error handling with retry capability
- 📜 Conversation history
- 🎨 Clean, modern UI with Tailwind CSS

### Backend (Node.js + Express)
- 🔒 Secure API proxy for Flowise
- 🛡️ Request validation and sanitization
- 📊 Rate limiting (100 requests per 15 minutes)
- 🔄 Automatic retry logic for failed requests
- 💾 In-memory conversation storage
- 🎫 Support ticket creation system
- 🪝 Webhook integration for external systems
- 📁 File upload handling with validation
- 🔐 API key protection (never exposed to frontend)

## Project Structure

```
project/
├── server/                   # Backend Node.js application
│   ├── index.ts             # Express server entry point
│   ├── routes.ts            # API endpoint definitions
│   ├── flowise-client.ts    # Flowise API integration
│   ├── storage.ts           # In-memory data storage
│   ├── validation.ts        # Input validation & sanitization
│   └── types.ts             # TypeScript type definitions
├── src/                     # Frontend React application
│   ├── components/          # React components
│   │   ├── ChatWidget.tsx   # Main chat widget component
│   │   ├── ChatMessage.tsx  # Individual message component
│   │   ├── ChatInput.tsx    # Message input with file upload
│   │   ├── QuickReplies.tsx # Quick reply buttons
│   │   └── TypingIndicator.tsx # Typing animation
│   ├── hooks/
│   │   └── useChat.ts       # Chat logic custom hook
│   ├── types/
│   │   └── chat.ts          # TypeScript interfaces
│   └── App.tsx              # Example integration page
└── .env                     # Environment variables
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Flowise AI instance (local or cloud)
- A configured Flowise chatflow

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create or update the `.env` file in the project root:

```env
# Flowise Configuration
FLOWISE_API_URL=http://localhost:3000
FLOWISE_CHATFLOW_ID=your-chatflow-id-here
FLOWISE_API_KEY=your-api-key-here

# Server Configuration
PORT=3001
CORS_ORIGIN=*

# Frontend Configuration (already set)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Finding Your Chatflow ID:**
1. Open your Flowise dashboard
2. Navigate to your chatflow
3. The chatflow ID is in the URL: `http://localhost:3000/chatflow/YOUR_CHATFLOW_ID`

### 3. Start the Backend Server

```bash
npm run server
```

The backend will start on `http://localhost:3001`

### 4. Start the Frontend Development Server

In a separate terminal:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 5. Test the Chatbot

1. Open `http://localhost:5173` in your browser
2. Click the blue chat button in the bottom-right corner
3. Start chatting with the AI assistant

## API Endpoints

### Chat Endpoints

#### POST `/api/chat/send`
Send a message and get bot response.

**Request:**
```json
{
  "conversationId": "optional-conversation-id",
  "userId": "user-123",
  "message": "Hello, I need help",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "conv-123",
    "userMessage": { ... },
    "assistantMessage": { ... }
  }
}
```

#### POST `/api/chat/stream`
Stream bot responses in real-time (Server-Sent Events).

#### POST `/api/chat/history`
Retrieve conversation message history.

**Request:**
```json
{
  "conversationId": "conv-123",
  "limit": 50
}
```

#### GET `/api/chat/conversations/:userId`
Get all conversations for a user.

#### POST `/api/chat/upload`
Upload file attachments.

**Form Data:**
- `file`: File to upload (max 10MB)
- `conversationId`: Associated conversation
- `messageId`: Associated message

### Ticket Endpoints

#### POST `/api/tickets/create`
Create a support ticket from a conversation.

**Request:**
```json
{
  "conversationId": "conv-123",
  "subject": "Need help with order",
  "description": "Full conversation context",
  "priority": "medium",
  "category": "orders",
  "webhookUrl": "https://your-system.com/webhook"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ticket-id",
    "ticketNumber": "TKT-20241006-0001",
    "status": "open",
    ...
  }
}
```

#### GET `/api/tickets/:ticketId`
Get ticket details.

#### GET `/api/health`
Health check endpoint.

## Integration Guide

### Basic Integration

```tsx
import { ChatWidget } from './components/ChatWidget';

function App() {
  return (
    <ChatWidget
      apiUrl="http://localhost:3001/api"
      userId="user-123"
      headerTitle="Support Chat"
      headerSubtitle="We're here to help"
      showTimestamps={true}
      onConversationCreated={(id) => console.log('New conversation:', id)}
      onTicketCreated={(id) => console.log('Ticket created:', id)}
    />
  );
}
```

### With Quick Replies

```tsx
const quickReplies = [
  { id: '1', text: 'Track Order', value: 'How can I track my order?' },
  { id: '2', text: 'Returns', value: 'I need to return an item' },
  { id: '3', text: 'Talk to Agent', value: 'Connect me with an agent' },
];

<ChatWidget
  {...props}
  quickReplies={quickReplies}
/>
```

### Embedded in Existing App

```tsx
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

function MyApp() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div>
      {/* Your existing app content */}

      {/* Chat widget positioned fixed */}
      {showChat && (
        <div className="fixed bottom-20 right-6 z-50">
          <ChatWidget {...props} />
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 p-4 bg-blue-500 rounded-full"
      >
        <MessageCircle />
      </button>
    </div>
  );
}
```

## Configuration Options

### ChatWidget Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiUrl` | string | Yes | Backend API URL |
| `userId` | string | Yes | Unique user identifier |
| `conversationId` | string | No | Resume existing conversation |
| `quickReplies` | QuickReply[] | No | Quick reply buttons |
| `placeholder` | string | No | Input placeholder text |
| `headerTitle` | string | No | Chat header title |
| `headerSubtitle` | string | No | Chat header subtitle |
| `theme` | 'light' \| 'dark' | No | Color theme |
| `showTimestamps` | boolean | No | Show message timestamps |
| `onConversationCreated` | function | No | Callback when conversation starts |
| `onTicketCreated` | function | No | Callback when ticket is created |

## File Upload Support

Supported file types:
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, TXT
- Max file size: 10MB per file
- Multiple files supported per message

## Security Features

1. **API Key Protection**: Flowise API keys stored only on backend
2. **Input Sanitization**: All user inputs sanitized before processing
3. **File Validation**: File type and size validation
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **CORS Protection**: Configurable CORS origins
6. **Request Validation**: Schema validation using express-validator
7. **Helmet.js**: Security headers automatically applied

## Error Handling

The chatbot includes comprehensive error handling:

- Network errors: Automatic retry with exponential backoff
- Failed messages: Retry button for users
- Validation errors: Clear error messages
- Server errors: Graceful degradation
- Connection issues: Reconnection logic

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

## Production Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Deploy the `server/` directory
3. Start with `npm run server`

### Frontend Deployment

1. Build the frontend: `npm run build`
2. Deploy the `dist/` directory to static hosting (Vercel, Netlify, etc.)
3. Update `apiUrl` in ChatWidget to point to production backend

### Environment Variables for Production

```env
FLOWISE_API_URL=https://your-flowise-instance.com
FLOWISE_CHATFLOW_ID=your-production-chatflow-id
FLOWISE_API_KEY=your-production-api-key
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

## Flowise Chatflow Configuration

### Example Chatflow Setup

1. **Chat Model**: Use OpenAI, Anthropic, or other LLM
2. **Memory**: Enable conversation memory for context
3. **Tools**: Add custom tools for specific functionality
4. **Prompt**: Configure system prompt for support context

### Recommended Prompt Template

```
You are a helpful customer support assistant. Your role is to:
- Answer customer questions clearly and concisely
- Be empathetic and professional
- Offer to create a support ticket for complex issues
- Provide quick solutions when possible

If you cannot help with something, politely let the user know and offer to escalate to a human agent.
```

## Troubleshooting

### Backend won't start
- Verify Node.js version (18+)
- Check if port 3001 is available
- Ensure all dependencies are installed

### Frontend can't connect to backend
- Verify backend is running on correct port
- Check CORS settings in backend
- Ensure `apiUrl` in ChatWidget matches backend URL

### Flowise connection fails
- Verify Flowise instance is running
- Check `FLOWISE_API_URL` is correct
- Confirm `FLOWISE_CHATFLOW_ID` is valid
- Test API key if authentication is enabled

### Messages not sending
- Check browser console for errors
- Verify backend logs for issues
- Test `/api/health` endpoint
- Check network tab in browser DevTools

## Future Enhancements

Potential features to add:
- [ ] Database persistence (Supabase integration ready)
- [ ] User authentication
- [ ] Chat transcript export
- [ ] Analytics and metrics
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Rich media messages (cards, carousels)
- [ ] Agent handoff system
- [ ] Chatbot training interface

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Flowise documentation: https://docs.flowiseai.com
3. Open an issue on GitHub
