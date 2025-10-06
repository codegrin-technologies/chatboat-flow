import { Router, Request, Response } from 'express';
import multer from 'multer';
import { FlowiseClient } from './flowise-client';
import { storage } from './storage';
import {
  validateRequest,
  sendMessageValidation,
  createTicketValidation,
  getHistoryValidation,
  validateFileUpload,
  sanitizeInput,
  sanitizeMetadata,
} from './validation';
import { Message } from './types';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export function createRoutes(flowiseClient: FlowiseClient, chatflowId: string): Router {
  const router = Router();

  router.post('/chat/send', sendMessageValidation, validateRequest, async (req: Request, res: Response) => {
    try {
      const { conversationId, userId, message, metadata } = req.body;

      const sanitizedMessage = sanitizeInput(message);
      const sanitizedMetadata = sanitizeMetadata(metadata);

      let conversation = conversationId
        ? storage.getConversation(conversationId)
        : undefined;

      if (!conversation) {
        conversation = storage.createConversation(userId, sanitizedMetadata);
      }

      const userMessage = storage.addMessage({
        conversationId: conversation.id,
        role: 'user',
        content: sanitizedMessage,
        status: 'sent',
        metadata: sanitizedMetadata,
      });

      setTimeout(() => {
        storage.updateMessageStatus(userMessage.id, conversation!.id, 'delivered');
      }, 500);

      try {
        const flowiseResponse = await flowiseClient.sendMessage(chatflowId, {
          question: sanitizedMessage,
          sessionId: conversation.flowiseSessionId || conversation.id,
          chatId: conversation.id,
        });

        if (flowiseResponse.sessionId && !conversation.flowiseSessionId) {
          storage.updateConversation(conversation.id, {
            flowiseSessionId: flowiseResponse.sessionId,
          });
        }

        const assistantMessage = storage.addMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: flowiseResponse.text || 'I apologize, but I could not generate a response.',
          status: 'delivered',
          metadata: {
            flowiseResponse: flowiseResponse,
          },
        });

        res.json({
          success: true,
          data: {
            conversationId: conversation.id,
            userMessage,
            assistantMessage,
          },
        });
      } catch (error) {
        storage.updateMessageStatus(userMessage.id, conversation.id, 'failed');

        const errorMessage = storage.addMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your message. Please try again.',
          status: 'delivered',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        res.json({
          success: true,
          data: {
            conversationId: conversation.id,
            userMessage,
            assistantMessage: errorMessage,
          },
          warning: 'Bot response failed, showing error message',
        });
      }
    } catch (error) {
      console.error('Error in /chat/send:', error);
      res.status(500).json({
        error: 'Failed to process message',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/chat/stream', sendMessageValidation, validateRequest, async (req: Request, res: Response) => {
    try {
      const { conversationId, userId, message, metadata } = req.body;

      const sanitizedMessage = sanitizeInput(message);
      const sanitizedMetadata = sanitizeMetadata(metadata);

      let conversation = conversationId
        ? storage.getConversation(conversationId)
        : undefined;

      if (!conversation) {
        conversation = storage.createConversation(userId, sanitizedMetadata);
      }

      const userMessage = storage.addMessage({
        conversationId: conversation.id,
        role: 'user',
        content: sanitizedMessage,
        status: 'delivered',
        metadata: sanitizedMetadata,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      res.write(`data: ${JSON.stringify({ type: 'start', conversationId: conversation.id, userMessage })}\n\n`);

      let fullResponse = '';

      await flowiseClient.streamMessage(
        chatflowId,
        {
          question: sanitizedMessage,
          sessionId: conversation.flowiseSessionId || conversation.id,
          chatId: conversation.id,
        },
        (chunk) => {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        },
        (finalResponse) => {
          const assistantMessage = storage.addMessage({
            conversationId: conversation!.id,
            role: 'assistant',
            content: finalResponse || fullResponse,
            status: 'delivered',
          });

          res.write(`data: ${JSON.stringify({ type: 'complete', message: assistantMessage })}\n\n`);
          res.end();
        },
        (error) => {
          console.error('Stream error:', error);
          res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
          res.end();
        }
      );
    } catch (error) {
      console.error('Error in /chat/stream:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to stream message' })}\n\n`);
      res.end();
    }
  });

  router.post('/chat/history', getHistoryValidation, validateRequest, (req: Request, res: Response) => {
    try {
      const { conversationId, limit } = req.body;

      const conversation = storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const messages = storage.getMessages(conversationId, limit);

      res.json({
        success: true,
        data: {
          conversation,
          messages,
          total: messages.length,
        },
      });
    } catch (error) {
      console.error('Error in /chat/history:', error);
      res.status(500).json({
        error: 'Failed to retrieve history',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/chat/conversations/:userId', (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const conversations = storage.getUserConversations(userId);

      res.json({
        success: true,
        data: conversations,
        total: conversations.length,
      });
    } catch (error) {
      console.error('Error in /chat/conversations:', error);
      res.status(500).json({
        error: 'Failed to retrieve conversations',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/chat/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const validation = validateFileUpload(req.file);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const file = req.file!;
      const { conversationId, messageId } = req.body;

      if (!conversationId || !messageId) {
        return res.status(400).json({ error: 'conversationId and messageId are required' });
      }

      const base64Data = file.buffer.toString('base64');
      const fileUrl = `data:${file.mimetype};base64,${base64Data}`;

      const fileAttachment = {
        id: `file-${Date.now()}`,
        filename: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        url: fileUrl,
        uploadedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: fileAttachment,
      });
    } catch (error) {
      console.error('Error in /chat/upload:', error);
      res.status(500).json({
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/tickets/create', createTicketValidation, validateRequest, async (req: Request, res: Response) => {
    try {
      const { conversationId, subject, description, priority, category, metadata } = req.body;

      const conversation = storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const sanitizedMetadata = sanitizeMetadata(metadata);

      const ticket = storage.createTicket({
        conversationId,
        subject: sanitizeInput(subject),
        description: sanitizeInput(description),
        priority: priority || 'medium',
        category,
        status: 'open',
        metadata: sanitizedMetadata,
      });

      if (req.body.webhookUrl) {
        setTimeout(async () => {
          try {
            await fetch(req.body.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'ticket.created',
                ticket,
                conversation,
              }),
            });
          } catch (webhookError) {
            console.error('Webhook delivery failed:', webhookError);
          }
        }, 0);
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error('Error in /tickets/create:', error);
      res.status(500).json({
        error: 'Failed to create ticket',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/tickets/:ticketId', (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const ticket = storage.getTicket(ticketId);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error('Error in /tickets/:ticketId:', error);
      res.status(500).json({
        error: 'Failed to retrieve ticket',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      flowise: {
        configured: !!chatflowId,
      },
    });
  });

  return router;
}
