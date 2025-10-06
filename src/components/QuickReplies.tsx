import { QuickReply } from '../types/chat';

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ replies, onSelect, disabled = false }: QuickRepliesProps) {
  if (replies.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
      <p className="text-xs text-gray-600 mb-2 font-medium">Quick replies:</p>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply) => (
          <button
            key={reply.id}
            onClick={() => onSelect(reply.value)}
            disabled={disabled}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reply.text}
          </button>
        ))}
      </div>
    </div>
  );
}
