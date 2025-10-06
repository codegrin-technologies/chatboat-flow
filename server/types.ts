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

export interface SupportTicket {
  id: string;
  conversationId: string;
  ticketNumber: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface FlowiseMessageRequest {
  question: string;
  sessionId?: string;
  chatId?: string;
  uploads?: Array<{
    data: string;
    type: string;
    name: string;
    mime: string;
  }>;
}

export interface FlowiseMessageResponse {
  text?: string;
  question?: string;
  chatId?: string;
  sessionId?: string;
  memoryType?: string;
  [key: string]: unknown;
}
