export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'sent' | 'delivered' | 'failed';
  attachments?: FileAttachment[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  flowiseSessionId?: string;
  status: 'active' | 'resolved' | 'escalated';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface QuickReply {
  id: string;
  text: string;
  value: string;
}

export interface ChatWidgetProps {
  apiUrl: string;
  userId: string;
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
  onTicketCreated?: (ticketId: string) => void;
  quickReplies?: QuickReply[];
  placeholder?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  theme?: 'light' | 'dark';
  showTimestamps?: boolean;
  className?: string;
}
