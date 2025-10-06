import { Message, Conversation, SupportTicket } from './types';

class InMemoryStorage {
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private tickets: Map<string, SupportTicket> = new Map();
  private userConversations: Map<string, string[]> = new Map();
  private ticketCounter: number = 0;

  createConversation(userId: string, metadata?: Record<string, unknown>): Conversation {
    const conversation: Conversation = {
      id: this.generateId(),
      userId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata,
    };

    this.conversations.set(conversation.id, conversation);

    if (!this.userConversations.has(userId)) {
      this.userConversations.set(userId, []);
    }
    this.userConversations.get(userId)!.push(conversation.id);

    return conversation;
  }

  getConversation(conversationId: string): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  getUserConversations(userId: string): Conversation[] {
    const conversationIds = this.userConversations.get(userId) || [];
    return conversationIds
      .map(id => this.conversations.get(id))
      .filter((conv): conv is Conversation => conv !== undefined)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  updateConversation(conversationId: string, updates: Partial<Conversation>): Conversation | undefined {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return undefined;

    const updated = {
      ...conversation,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.conversations.set(conversationId, updated);
    return updated;
  }

  addMessage(message: Omit<Message, 'id' | 'createdAt'>): Message {
    const newMessage: Message = {
      ...message,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    const conversationMessages = this.messages.get(message.conversationId) || [];
    conversationMessages.push(newMessage);
    this.messages.set(message.conversationId, conversationMessages);

    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      this.updateConversation(message.conversationId, {
        updatedAt: new Date().toISOString(),
      });
    }

    return newMessage;
  }

  getMessages(conversationId: string, limit?: number): Message[] {
    const messages = this.messages.get(conversationId) || [];
    if (limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  updateMessageStatus(messageId: string, conversationId: string, status: Message['status']): Message | undefined {
    const messages = this.messages.get(conversationId) || [];
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex === -1) return undefined;

    messages[messageIndex] = {
      ...messages[messageIndex],
      status,
    };

    this.messages.set(conversationId, messages);
    return messages[messageIndex];
  }

  createTicket(ticket: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): SupportTicket {
    this.ticketCounter++;
    const ticketNumber = `TKT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(this.ticketCounter).padStart(4, '0')}`;

    const newTicket: SupportTicket = {
      ...ticket,
      id: this.generateId(),
      ticketNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tickets.set(newTicket.id, newTicket);

    this.updateConversation(ticket.conversationId, {
      status: 'escalated',
    });

    return newTicket;
  }

  getTicket(ticketId: string): SupportTicket | undefined {
    return this.tickets.get(ticketId);
  }

  getTicketByNumber(ticketNumber: string): SupportTicket | undefined {
    return Array.from(this.tickets.values()).find(t => t.ticketNumber === ticketNumber);
  }

  getConversationTickets(conversationId: string): SupportTicket[] {
    return Array.from(this.tickets.values())
      .filter(t => t.conversationId === conversationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateTicket(ticketId: string, updates: Partial<SupportTicket>): SupportTicket | undefined {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return undefined;

    const updated = {
      ...ticket,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === 'resolved' || updates.status === 'closed') {
      updated.resolvedAt = new Date().toISOString();
    }

    this.tickets.set(ticketId, updated);
    return updated;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  clearAll(): void {
    this.conversations.clear();
    this.messages.clear();
    this.tickets.clear();
    this.userConversations.clear();
    this.ticketCounter = 0;
  }
}

export const storage = new InMemoryStorage();
