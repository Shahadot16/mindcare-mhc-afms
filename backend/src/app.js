import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler, notFoundRoute } from './middleware/error.middleware.js';

const app = express();

app.set('trust proxy', 1); // correct client IPs behind a reverse proxy (rate limit, audit log)
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api', routes);

app.use(notFoundRoute);
app.use(errorHandler);

export default app;
