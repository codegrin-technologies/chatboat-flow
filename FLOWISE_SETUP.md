# Flowise Setup Guide

This guide walks you through setting up Flowise AI and creating a chatflow for use with this support chatbot.

## What is Flowise?

Flowise is an open-source UI visual tool to build customized LLM orchestration flows and AI agents. It provides a drag-and-drop interface to create chatbots powered by various LLMs.

## Installation Options

### Option 1: Docker (Recommended)

```bash
docker pull flowiseai/flowise
docker run -d -p 3000:3000 flowiseai/flowise
```

Visit `http://localhost:3000` to access Flowise.

### Option 2: NPM

```bash
npm install -g flowise
npx flowise start
```

### Option 3: Cloud Deployment

Use Flowise Cloud at https://flowiseai.com for a managed solution.

## Creating Your First Chatflow

### Step 1: Access Flowise Dashboard

1. Open `http://localhost:3000` (or your Flowise URL)
2. You'll see the Flowise dashboard with chatflows

### Step 2: Create a New Chatflow

1. Click "Add New" to create a chatflow
2. Give it a name like "Support Chatbot"

### Step 3: Build the Chatflow

Here's a basic support chatbot configuration:

#### Components to Add:

1. **Chat Model** (Required)
   - Drag "ChatOpenAI" or "ChatAnthropic" node
   - Configure with your API key
   - Set model: `gpt-4` or `claude-3-sonnet`
   - Temperature: 0.7 for balanced responses

2. **Conversation Chain** (Required)
   - Drag "Conversation Chain" node
   - Connect Chat Model to it

3. **Buffer Memory** (Recommended)
   - Drag "Buffer Memory" node
   - Connect to Conversation Chain
   - This enables conversation context

4. **System Message** (Optional)
   - Add system prompt for support context:
   ```
   You are a friendly and helpful customer support assistant.

   Your responsibilities:
   - Answer customer questions clearly and professionally
   - Be empathetic and understanding
   - Provide step-by-step solutions when needed
   - Offer to escalate complex issues to human agents
   - Keep responses concise but informative

   If you don't know something, be honest and offer alternatives.
   Always maintain a positive, helpful tone.
   ```

### Step 4: Configure Memory Settings

1. Click on Buffer Memory node
2. Set Session ID: Enable this to maintain user context
3. Memory Key: `chat_history`

### Step 5: Save and Deploy

1. Click "Save Chatflow" button
2. Note the Chatflow ID from the URL or settings
3. Copy this ID to your `.env` file

## Example Chatflow Configurations

### Basic Support Bot

```
[ChatOpenAI] → [Conversation Chain] → Output
                      ↑
               [Buffer Memory]
```

### Advanced Support Bot with Tools

```
[ChatOpenAI] → [Agent] → [Calculator Tool]
                 ↑         [Search Tool]
                 ↑         [Custom API Tool]
          [Buffer Memory]
```

### Chatbot with Document Knowledge

```
[Document Loader] → [Text Splitter] → [Vector Store]
                                            ↓
[ChatOpenAI] → [Retrieval QA Chain] ←──────┘
                      ↑
               [Buffer Memory]
```

## Getting Your Chatflow ID

1. In Flowise, open your chatflow
2. Look at the browser URL: `http://localhost:3000/chatflow/abc123def456`
3. The ID is the last part: `abc123def456`
4. Copy this to your `.env` file as `FLOWISE_CHATFLOW_ID`

## API Key Configuration (Optional)

To secure your Flowise API:

1. In Flowise, go to Settings
2. Generate an API key
3. Copy the key to your `.env` as `FLOWISE_API_KEY`

## Testing Your Chatflow

### Test in Flowise UI

1. Click the "Test" button in your chatflow
2. Try sending messages to verify responses
3. Check that memory/context works across messages

### Test with this Application

1. Configure your `.env` with the chatflow ID
2. Start the backend: `npm run server`
3. Start the frontend: `npm run dev`
4. Open the chat widget and test

## Common Chatflow Patterns

### Pattern 1: Simple FAQ Bot

Good for: Basic question answering

**Components:**
- Chat Model (OpenAI/Anthropic)
- Conversation Chain
- Buffer Memory

**Prompt:**
```
You are an FAQ assistant. Answer questions based on common customer inquiries.
Be concise and helpful. If you don't know, suggest contacting support.
```

### Pattern 2: Document-Aware Bot

Good for: Support with knowledge base

**Components:**
- Document Loader (PDF, URLs, etc.)
- Recursive Text Splitter
- OpenAI Embeddings
- Pinecone/Supabase Vector Store
- Conversational Retrieval QA Chain

**Use case:** Bot can answer questions using your documentation

### Pattern 3: Action-Capable Agent

Good for: Task execution (order lookup, etc.)

**Components:**
- Agent (OpenAI Functions)
- Custom API Tools
- Buffer Memory

**Use case:** Bot can make API calls to your systems

### Pattern 4: Multi-Step Support Flow

Good for: Guided troubleshooting

**Components:**
- Sequential Chain
- Multiple prompts for different steps
- Buffer Memory

**Use case:** Step-by-step problem resolution

## Optimizing for Support Use Cases

### 1. Prompt Engineering

Include in your system message:
- Support tone and empathy guidelines
- Available escalation paths
- Common issue categories
- Response length preferences

### 2. Memory Configuration

- Use Buffer Memory for short conversations
- Use Buffer Window Memory for limiting context
- Enable session IDs for multi-session continuity

### 3. Response Quality

- Temperature: 0.5-0.7 (balance creativity and consistency)
- Max tokens: 150-300 (keep responses concise)
- Top P: 0.9 (focused but natural responses)

### 4. Error Handling

Configure fallback responses:
```
If you encounter an error or cannot help, respond:
"I apologize, I'm having trouble processing that request.
Would you like me to create a support ticket for you?"
```

## Monitoring and Analytics

### Flowise Built-in Analytics

1. View chatflow usage in the dashboard
2. Monitor API calls and costs
3. Review conversation logs

### Custom Tracking

The backend logs all interactions. You can:
- Track conversation metrics
- Analyze common questions
- Identify escalation patterns
- Monitor response times

## Troubleshooting

### Chatflow Not Responding

1. Check that all nodes are connected
2. Verify API keys are valid
3. Test individual nodes
4. Check Flowise logs

### Memory Not Working

1. Ensure Buffer Memory is connected
2. Verify Session ID is being passed
3. Check memory configuration

### Slow Responses

1. Reduce max tokens
2. Optimize prompt length
3. Use faster models (gpt-3.5-turbo)
4. Check network latency

## Advanced Features

### Streaming Responses

Enable streaming in your Chat Model:
- Set `streaming: true`
- The backend's `/api/chat/stream` endpoint will handle it

### Multi-Language Support

Add language detection:
1. Use Language Tool node
2. Route to language-specific chains
3. Configure multi-language prompts

### Sentiment Analysis

Add sentiment detection:
1. Use Sentiment Tool
2. Route negative sentiment to priority queue
3. Alert human agents for urgent issues

## Security Best Practices

1. **Never expose Flowise API keys in frontend**
   - Always use the backend proxy (already implemented)

2. **Sanitize user inputs**
   - Already handled by backend validation

3. **Rate limiting**
   - Already implemented (100 req/15min)

4. **API authentication**
   - Enable in Flowise settings
   - Configure in backend `.env`

## Resources

- Flowise Documentation: https://docs.flowiseai.com
- Flowise GitHub: https://github.com/FlowiseAI/Flowise
- Community Discord: https://discord.gg/jbaHfsRVBW
- Example Chatflows: https://docs.flowiseai.com/use-cases

## Example .env Configuration

```env
# Local Flowise
FLOWISE_API_URL=http://localhost:3000
FLOWISE_CHATFLOW_ID=abc123def456
FLOWISE_API_KEY=sk-flowise-123456

# Cloud Flowise
FLOWISE_API_URL=https://your-instance.flowiseai.com
FLOWISE_CHATFLOW_ID=your-cloud-chatflow-id
FLOWISE_API_KEY=your-cloud-api-key
```

## Next Steps

1. Create your chatflow in Flowise
2. Test it thoroughly in the Flowise UI
3. Copy the chatflow ID to your `.env`
4. Start the backend and frontend
5. Test end-to-end with the chat widget
6. Iterate on your chatflow based on user feedback

## Support

Need help setting up Flowise?
- Check Flowise docs: https://docs.flowiseai.com
- Join Discord: https://discord.gg/jbaHfsRVBW
- GitHub Issues: https://github.com/FlowiseAI/Flowise/issues
