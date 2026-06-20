import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Admin: CRUD orçamento
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, isPaid } = req.query;
    const where = { weddingId: req.weddingId };
    if (category) where.category = category;
    if (isPaid !== undefined) where.isPaid = isPaid === 'true';

    const items = await prisma.budgetItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vendor: { select: { id: true, name: true } } },
    });

    // Totals
    const allItems = await prisma.budgetItem.findMany({
      where: { weddingId: req.weddingId },
    });
    const totalEstimated = allItems.reduce((sum, i) => sum + i.estimatedAmount, 0);
    const totalActual = allItems.reduce((sum, i) => sum + i.actualAmount, 0);

    res.json({ items, totalEstimated, totalActual });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.budgetItem.create({
      data: { ...req.body, weddingId: req.weddingId },
      include: { vendor: { select: { id: true, name: true } } },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.body.paidDate) req.body.paidDate = new Date(req.body.paidDate);
    const result = await prisma.budgetItem.updateMany({
      where: { id: req.params.id, weddingId: req.weddingId },
      data: req.body,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.budgetItem.findUnique({
      where: { id: req.params.id },
      include: { vendor: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.budgetItem.deleteMany({
      where: { id: req.params.id, weddingId: req.weddingId },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
