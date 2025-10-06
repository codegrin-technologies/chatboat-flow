import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { FlowiseClient } from './flowise-client';
import { createRoutes } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const FLOWISE_API_URL = process.env.FLOWISE_API_URL || 'http://localhost:3000';
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;
const FLOWISE_CHATFLOW_ID = process.env.FLOWISE_CHATFLOW_ID || '';

if (!FLOWISE_CHATFLOW_ID) {
  console.warn('⚠️  WARNING: FLOWISE_CHATFLOW_ID not set. The chatbot will not function properly.');
  console.warn('   Please set FLOWISE_CHATFLOW_ID in your .env file.');
}

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

const flowiseClient = new FlowiseClient({
  apiUrl: FLOWISE_API_URL,
  apiKey: FLOWISE_API_KEY,
});

const routes = createRoutes(flowiseClient, FLOWISE_CHATFLOW_ID);
app.use('/api', routes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Flowise API URL: ${FLOWISE_API_URL}`);
  console.log(`🤖 Chatflow ID: ${FLOWISE_CHATFLOW_ID || 'NOT SET'}`);
  console.log(`🔒 API Key: ${FLOWISE_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`\n✅ Ready to handle chat requests at http://localhost:${PORT}/api`);
});

export default app;
