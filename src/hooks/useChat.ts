import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '../types/chat';

interface UseChatOptions {
  apiUrl: string;
  userId: string;
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  onError?: (error: Error) => void;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  conversationId: string | null;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  clearError: () => void;
}

export function useChat({
  apiUrl,
  userId,
  conversationId: initialConversationId,
  onConversationCreated,
  onError,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialConversationId) {
      loadConversationHistory(initialConversationId);
    }
  }, [initialConversationId]);

  const loadConversationHistory = async (convId: string) => {
    try {
      const response = await fetch(`${apiUrl}/chat/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      });

      if (!response.ok) {
        throw new Error('Failed to load conversation history');
      }

      const result = await response.json();
      if (result.success && result.data.messages) {
        setMessages(result.data.messages);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) {
        return;
      }

      setIsLoading(true);
      setError(null);

      abortControllerRef.current = new AbortController();

      try {
        let attachmentData: string[] = [];

        if (attachments && attachments.length > 0) {
          attachmentData = await Promise.all(
            attachments.map(async (file) => {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('conversationId', conversationId || 'temp');
              formData.append('messageId', 'temp');

              const uploadResponse = await fetch(`${apiUrl}/chat/upload`, {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current?.signal,
              });

              if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
              }

              const uploadResult = await uploadResponse.json();
              return uploadResult.data;
            })
          );
        }

        const response = await fetch(`${apiUrl}/chat/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            userId,
            message: content,
            metadata: attachmentData.length > 0 ? { attachments: attachmentData } : undefined,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          if (!conversationId && result.data.conversationId) {
            setConversationId(result.data.conversationId);
            onConversationCreated?.(result.data.conversationId);
          }

          setMessages((prev) => [
            ...prev,
            result.data.userMessage,
            result.data.assistantMessage,
          ]);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
        onError?.(errorObj);
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [apiUrl, userId, conversationId, onConversationCreated, onError]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message || message.role !== 'user') {
        return;
      }

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      await sendMessage(message.content);
    },
    [messages, sendMessage]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    retryMessage,
    clearError,
  };
}
