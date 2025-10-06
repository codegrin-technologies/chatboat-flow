import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatWidget } from './components/ChatWidget';
import { QuickReply } from './types/chat';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [userId] = useState(() => `user-${Date.now()}`);

  const quickReplies: QuickReply[] = [
    { id: '1', text: 'How can I track my order?', value: 'How can I track my order?' },
    { id: '2', text: 'I need to return an item', value: 'I need to return an item' },
    { id: '3', text: 'Talk to an agent', value: 'I would like to speak with a support agent' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Flowise AI Support Chatbot
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Production-ready chatbot with React frontend and Node.js backend
            </p>
            <p className="text-sm text-gray-500">
              Powered by Flowise AI Chatflows API
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Frontend Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Responsive chat interface</li>
                  <li>✓ Message status indicators</li>
                  <li>✓ File attachments support</li>
                  <li>✓ Quick reply buttons</li>
                  <li>✓ Typing indicators</li>
                  <li>✓ Timestamp display</li>
                  <li>✓ Error handling & retry</li>
                  <li>✓ Conversation history</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Backend Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Secure API proxy</li>
                  <li>✓ Rate limiting</li>
                  <li>✓ Request validation</li>
                  <li>✓ File sanitization</li>
                  <li>✓ Session management</li>
                  <li>✓ Retry logic</li>
                  <li>✓ Support ticket creation</li>
                  <li>✓ Webhook integration</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Try It Out</h2>
            <p className="text-gray-600 mb-6">
              Click the chat button below to test the chatbot. Configure your Flowise API
              credentials in the <code className="bg-gray-100 px-2 py-1 rounded text-sm">.env</code> file
              to connect to your chatflow.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Configuration Required</h3>
              <p className="text-sm text-blue-800 mb-2">
                To use this chatbot, set these environment variables:
              </p>
              <div className="bg-white rounded p-3 text-xs font-mono">
                <div>FLOWISE_API_URL=http://localhost:3000</div>
                <div>FLOWISE_CHATFLOW_ID=your-chatflow-id</div>
                <div>FLOWISE_API_KEY=your-api-key (optional)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 animate-in slide-in-from-bottom-5">
          <ChatWidget
            apiUrl="http://localhost:3001/api"
            userId={userId}
            quickReplies={quickReplies}
            headerTitle="Support Chat"
            headerSubtitle="We're here to help"
            showTimestamps={true}
            onConversationCreated={(id) => console.log('Conversation created:', id)}
            onTicketCreated={(id) => console.log('Ticket created:', id)}
          />
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110 flex items-center justify-center z-50"
        title={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}

export default App;
