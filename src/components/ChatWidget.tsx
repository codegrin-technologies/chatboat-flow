import { useEffect, useRef } from 'react';
import { AlertCircle, X, Ticket } from 'lucide-react';
import { ChatWidgetProps } from '../types/chat';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QuickReplies } from './QuickReplies';
import { TypingIndicator } from './TypingIndicator';

export function ChatWidget({
  apiUrl,
  userId,
  conversationId: initialConversationId,
  onConversationCreated,
  onTicketCreated,
  quickReplies = [],
  placeholder = 'Type your message...',
  headerTitle = 'Support Chat',
  headerSubtitle = 'We\'re here to help',
  theme = 'light',
  showTimestamps = true,
  className = '',
}: ChatWidgetProps) {
  const {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    retryMessage,
    clearError,
  } = useChat({
    apiUrl,
    userId,
    conversationId: initialConversationId,
    onConversationCreated,
    onError: (err) => console.error('Chat error:', err),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      scrollToBottom('auto');
    }
  }, []);

  const handleSendMessage = async (content: string, files?: File[]) => {
    await sendMessage(content, files);
  };

  const handleQuickReplySelect = (value: string) => {
    sendMessage(value);
  };

  const handleCreateTicket = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`${apiUrl}/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          subject: 'Support Request',
          description: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          priority: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      const result = await response.json();
      if (result.success && result.data) {
        onTicketCreated?.(result.data.id);
        alert(`Ticket created successfully! Ticket #${result.data.ticketNumber}`);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('Failed to create ticket. Please try again.');
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full bg-white rounded-lg shadow-xl overflow-hidden ${className}`}
      style={{ maxHeight: '600px', maxWidth: '400px' }}
    >
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{headerTitle}</h3>
          <p className="text-xs opacity-90">{headerSubtitle}</p>
        </div>
        {conversationId && messages.length > 0 && (
          <button
            onClick={handleCreateTicket}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Create support ticket"
          >
            <Ticket className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-xs text-red-600">{error.message}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-sm">Start a conversation</p>
              <p className="text-xs mt-1">How can we help you today?</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                showTimestamp={showTimestamps}
                onRetry={
                  message.status === 'failed'
                    ? () => retryMessage(message.id)
                    : undefined
                }
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {quickReplies.length > 0 && (
        <QuickReplies
          replies={quickReplies}
          onSelect={handleQuickReplySelect}
          disabled={isLoading}
        />
      )}

      <ChatInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={placeholder}
      />
    </div>
  );
}
