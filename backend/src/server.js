import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma.js';
import weddingRoutes from './routes/wedding.js';
import guestRoutes from './routes/guests.js';
import vendorRoutes from './routes/vendors.js';
import budgetRoutes from './routes/budget.js';
import timelineRoutes from './routes/timeline.js';
import giftRoutes from './routes/gifts.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/wedding', weddingRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/gifts', giftRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Casamento SaaS rodando na porta ${PORT}`);
});
