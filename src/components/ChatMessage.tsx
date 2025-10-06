import { CheckCheck, Clock, XCircle, User, Bot } from 'lucide-react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  showTimestamp?: boolean;
  onRetry?: () => void;
}

export function ChatMessage({ message, showTimestamp = true, onRetry }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isFailed = message.status === 'failed';

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = () => {
    if (isFailed) {
      return <XCircle className="w-3 h-3 text-red-500" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-3 h-3 text-green-500" />;
    }
    return <Clock className="w-3 h-3 text-gray-400" />;
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-gray-700" />
        )}
      </div>

      <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          } ${isFailed ? 'opacity-60' : ''}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="text-xs opacity-80">
                  📎 {attachment.filename}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {showTimestamp && (
            <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
          )}
          {isUser && <div className="flex items-center">{getStatusIcon()}</div>}
          {isFailed && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-blue-500 hover:text-blue-600 underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
