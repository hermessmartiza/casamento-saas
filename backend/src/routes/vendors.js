import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Admin: CRUD fornecedores
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, paymentStatus } = req.query;
    const where = { weddingId: req.weddingId };
    if (category) where.category = category;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { budgetItems: true } } },
    });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const vendor = await prisma.vendor.create({
      data: { ...req.body, weddingId: req.weddingId },
    });
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const vendor = await prisma.vendor.updateMany({
      where: { id: req.params.id, weddingId: req.weddingId },
      data: req.body,
    });
    if (vendor.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.vendor.deleteMany({
      where: { id: req.params.id, weddingId: req.weddingId },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
