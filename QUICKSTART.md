# Quick Start Guide

Get the Flowise AI Support Chatbot running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Flowise instance (local or cloud)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Flowise

### Option A: Use Docker (Easiest)

```bash
docker pull flowiseai/flowise
docker run -d -p 3000:3000 flowiseai/flowise
```

Open `http://localhost:3000`

### Option B: Use NPM

```bash
npx flowise start
```

Open `http://localhost:3000`

## Step 3: Create a Chatflow

1. Go to `http://localhost:3000`
2. Click "Add New" to create a chatflow
3. Add these nodes:
   - ChatOpenAI (or any LLM)
   - Conversation Chain
   - Buffer Memory
4. Connect them: ChatOpenAI → Conversation Chain ← Buffer Memory
5. Configure your OpenAI API key in ChatOpenAI node
6. Click "Save Chatflow"
7. Copy the Chatflow ID from the URL

## Step 4: Configure Environment

Edit `.env` file:

```env
FLOWISE_API_URL=http://localhost:3000
FLOWISE_CHATFLOW_ID=paste-your-chatflow-id-here
FLOWISE_API_KEY=

PORT=3001
CORS_ORIGIN=*
```

## Step 5: Start the Backend

```bash
npm run server
```

You should see:
```
🚀 Server running on http://localhost:3001
📡 Flowise API URL: http://localhost:3000
🤖 Chatflow ID: your-chatflow-id
✅ Ready to handle chat requests
```

## Step 6: Start the Frontend

In a new terminal:

```bash
npm run dev
```

Open `http://localhost:5173`

## Step 7: Test It Out

1. Click the blue chat button in the bottom-right corner
2. Type "Hello, I need help"
3. Press Enter
4. You should receive a response from the AI!

## Troubleshooting

### "Chatflow ID not set" warning

Update `FLOWISE_CHATFLOW_ID` in `.env` with your actual chatflow ID.

### "Failed to connect to Flowise"

- Check Flowise is running: visit `http://localhost:3000`
- Verify `FLOWISE_API_URL` in `.env` matches your Flowise URL

### "ChatOpenAI requires API key"

In Flowise:
1. Click your ChatOpenAI node
2. Add your OpenAI API key
3. Save the chatflow

### Backend won't start (port in use)

```bash
# Kill process on port 3001
lsof -i :3001
kill -9 <PID>

# Try again
npm run server
```

## What's Next?

- Read [README.md](README.md) for full documentation
- Check [FLOWISE_SETUP.md](FLOWISE_SETUP.md) for advanced chatflow configuration
- See [TESTING.md](TESTING.md) for testing instructions

## Production Deployment

Ready for production?

1. Set up a production Flowise instance
2. Update `.env` with production URLs and keys
3. Build the frontend: `npm run build`
4. Deploy backend with `npm run server:prod`
5. Deploy `dist/` folder to static hosting

## Support

Need help?
- Check the [README.md](README.md) troubleshooting section
- Review [Flowise Documentation](https://docs.flowiseai.com)
- Open an issue on GitHub

## Example Chatflow Config

Can't figure out Flowise? Here's a minimal working setup:

**Nodes:**
1. ChatOpenAI
   - Model: gpt-3.5-turbo
   - Temperature: 0.7
   - System Message: "You are a helpful customer support assistant"

2. Conversation Chain
   - Connect to ChatOpenAI

3. Buffer Memory
   - Connect to Conversation Chain
   - Enable Session ID

**Save and test in Flowise UI first before using with this app!**
