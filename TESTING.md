# Testing Guide

This document provides instructions for testing the Flowise AI Support Chatbot.

## Quick Start Testing

### 1. Start the Backend Server

```bash
npm run server
```

Expected output:
```
🚀 Server running on http://localhost:3001
📡 Flowise API URL: http://localhost:3000
🤖 Chatflow ID: your-chatflow-id
🔒 API Key: Configured
✅ Ready to handle chat requests at http://localhost:3001/api
```

### 2. Start the Frontend

In a separate terminal:

```bash
npm run dev
```

Visit `http://localhost:5173`

### 3. Test the Chat Widget

1. Click the blue chat button in the bottom-right corner
2. Type a message: "Hello, I need help"
3. Press Enter or click Send
4. Verify you receive a response from the bot

## Backend API Testing

### Using cURL

#### Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-06T...",
  "flowise": {
    "configured": true
  }
}
```

#### Send Message

```bash
curl -X POST http://localhost:3001/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "message": "Hello, I need help with my order"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "conversationId": "...",
    "userMessage": { ... },
    "assistantMessage": { ... }
  }
}
```

#### Get Conversation History

```bash
curl -X POST http://localhost:3001/api/chat/history \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "your-conversation-id"
  }'
```

#### Create Support Ticket

```bash
curl -X POST http://localhost:3001/api/tickets/create \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "your-conversation-id",
    "subject": "Need help with order",
    "description": "Customer needs assistance",
    "priority": "high"
  }'
```

### Using Postman

1. Import the endpoints from the API documentation
2. Set base URL: `http://localhost:3001/api`
3. Test each endpoint with sample data

## Frontend Component Testing

### Chat Widget

Test these features:

1. **Message Sending**
   - Type a message and press Enter
   - Verify message appears in chat
   - Verify bot response appears

2. **File Attachments**
   - Click paperclip icon
   - Select an image or PDF
   - Verify file appears in input area
   - Send message with file
   - Verify file is uploaded

3. **Quick Replies**
   - Click a quick reply button
   - Verify message is sent automatically
   - Verify bot responds appropriately

4. **Message Status**
   - Send a message
   - Watch status change: sent → delivered
   - If backend is down, verify "failed" status with retry button

5. **Typing Indicator**
   - Send a message
   - Verify typing indicator appears while waiting
   - Verify it disappears when response arrives

6. **Timestamps**
   - Verify each message shows a timestamp
   - Format should be: "2:45 PM"

7. **Scroll Behavior**
   - Send multiple messages
   - Verify chat auto-scrolls to latest message
   - Scroll up manually
   - Send new message
   - Verify it scrolls back to bottom

8. **Ticket Creation**
   - Have a conversation
   - Click ticket icon in header
   - Verify ticket creation success alert
   - Check backend logs for ticket details

9. **Error Handling**
   - Stop the backend server
   - Try sending a message
   - Verify error banner appears
   - Verify retry button works
   - Restart backend and retry

10. **Conversation Persistence**
    - Send several messages
    - Refresh the page
    - Click chat button again
    - Note: Memory is in-memory, so refreshing starts new conversation

## Integration Testing Scenarios

### Scenario 1: New Customer Support Session

1. Open chat widget
2. Select "How can I track my order?"
3. Verify bot provides tracking information
4. Ask follow-up question
5. Verify bot maintains context
6. Create support ticket
7. Verify ticket number is generated

### Scenario 2: File Upload Support

1. Open chat
2. Type "Here's a screenshot of the issue"
3. Attach an image file
4. Send message
5. Verify file is uploaded
6. Verify message with attachment appears

### Scenario 3: Error Recovery

1. Stop Flowise server
2. Send a message
3. Verify graceful error message
4. Start Flowise server
5. Click retry
6. Verify message sends successfully

### Scenario 4: Multiple Conversations

1. Open chat as User A
2. Have a conversation
3. Open incognito window
4. Open chat as User B
5. Have different conversation
6. Verify conversations are separate

## Performance Testing

### Load Testing

Use tools like Apache Bench or k6:

```bash
# Install k6
brew install k6  # macOS
# or download from k6.io

# Run load test
k6 run load-test.js
```

Example load test script:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    userId: `user-${__VU}`,
    message: 'Hello, I need help',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:3001/api/chat/send', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => r.json().data !== undefined,
  });

  sleep(1);
}
```

### Rate Limiting Test

Test the rate limiter (100 requests per 15 minutes):

```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl -X POST http://localhost:3001/api/chat/send \
    -H "Content-Type: application/json" \
    -d '{"userId": "test", "message": "test"}' &
done
```

Expected: The 101st request should be rate limited.

## Browser Compatibility Testing

Test in these browsers:

- ✓ Chrome (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Edge (latest)
- ✓ Mobile Safari (iOS)
- ✓ Mobile Chrome (Android)

### Responsive Testing

Test at these viewport sizes:

- 320px (iPhone SE)
- 375px (iPhone 12)
- 768px (iPad)
- 1024px (iPad Pro)
- 1440px (Desktop)

## Security Testing

### 1. API Key Protection

```bash
# Try to access Flowise directly from frontend
# Should fail - API key not exposed
```

### 2. Input Validation

Test with malicious inputs:

```bash
# XSS attempt
curl -X POST http://localhost:3001/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "message": "<script>alert(\"XSS\")</script>"
  }'
```

Expected: Input sanitized, no script execution

### 3. SQL Injection Attempt

```bash
curl -X POST http://localhost:3001/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test",
    "message": "\" OR 1=1; DROP TABLE users; --"
  }'
```

Expected: Treated as normal text, no database impact

### 4. File Upload Validation

Try uploading:
- ✓ Valid image (should work)
- ✗ .exe file (should be rejected)
- ✗ 50MB file (should be rejected)
- ✗ File with no extension (should be rejected)

### 5. Rate Limit Bypass Attempt

Try sending requests from multiple IPs or with different headers.
Expected: Still rate limited per IP.

## Troubleshooting Tests

### Backend Not Starting

```bash
# Check port availability
lsof -i :3001

# If port is busy, kill the process
kill -9 <PID>

# Restart backend
npm run server
```

### Flowise Connection Failed

```bash
# Test Flowise directly
curl http://localhost:3000/api/v1/chatflows

# If fails, check Flowise is running
docker ps | grep flowise
```

### Messages Not Sending

1. Check browser console for errors
2. Check network tab for failed requests
3. Check backend logs
4. Verify Flowise chatflow ID is correct

## Automated Testing

### Unit Tests (Future Enhancement)

Example test structure:

```typescript
// storage.test.ts
describe('InMemoryStorage', () => {
  it('should create a conversation', () => {
    const conv = storage.createConversation('user-1');
    expect(conv.userId).toBe('user-1');
    expect(conv.status).toBe('active');
  });

  it('should add messages to conversation', () => {
    const conv = storage.createConversation('user-1');
    const msg = storage.addMessage({
      conversationId: conv.id,
      role: 'user',
      content: 'Hello',
      status: 'sent',
    });
    expect(msg.content).toBe('Hello');
  });
});
```

### Integration Tests (Future Enhancement)

```typescript
// api.test.ts
describe('Chat API', () => {
  it('should send message and get response', async () => {
    const response = await fetch('http://localhost:3001/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        message: 'Hello',
      }),
    });
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

## Test Checklist

Before deploying to production:

- [ ] All backend endpoints return expected responses
- [ ] Frontend chat widget displays correctly
- [ ] Messages send and receive successfully
- [ ] File uploads work
- [ ] Quick replies function
- [ ] Typing indicator appears
- [ ] Message status updates
- [ ] Timestamps display
- [ ] Error handling works
- [ ] Ticket creation succeeds
- [ ] Rate limiting functions
- [ ] Input validation works
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] No console errors
- [ ] API keys not exposed
- [ ] Performance acceptable

## Reporting Issues

When reporting a bug, include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/environment details
5. Console errors (if any)
6. Backend logs (if relevant)
7. Screenshots/videos

## Performance Benchmarks

Target metrics:

- Message send latency: < 2 seconds
- File upload: < 3 seconds
- Typing indicator delay: < 500ms
- Rate limit: 100 req/15min per IP
- Concurrent users: 100+
- Memory usage: < 500MB

## Next Steps

After testing:

1. Document any issues found
2. Fix critical bugs
3. Optimize performance bottlenecks
4. Add monitoring/analytics
5. Deploy to staging environment
6. Repeat testing in staging
7. Deploy to production
