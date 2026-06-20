import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Público: listar presentes do casamento
router.get('/public/:slug', async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({ where: { slug: req.params.slug } });
    if (!wedding || !wedding.isPublic) return res.status(404).json({ error: 'Not found' });

    const gifts = await prisma.gift.findMany({
      where: { weddingId: wedding.id, isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ gifts, pixKey: wedding.pixKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: CRUD presentes
router.get('/', authMiddleware, async (req, res) => {
  const gifts = await prisma.gift.findMany({
    where: { weddingId: req.weddingId },
    orderBy: { name: 'asc' },
  });
  res.json(gifts);
});

router.post('/', authMiddleware, async (req, res) => {
  const gift = await prisma.gift.create({
    data: { ...req.body, weddingId: req.weddingId },
  });
  res.status(201).json(gift);
});

router.patch('/:id', authMiddleware, async (req, res) => {
  const result = await prisma.gift.updateMany({
    where: { id: req.params.id, weddingId: req.weddingId },
    data: req.body,
  });
  if (result.count === 0) return res.status(404).json({ error: 'Not found' });
  const gift = await prisma.gift.findUnique({ where: { id: req.params.id } });
  res.json(gift);
});

router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.gift.deleteMany({ where: { id: req.params.id, weddingId: req.weddingId } });
  res.json({ success: true });
});

export default router;
