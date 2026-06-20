import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Público: listar seções visíveis
router.get('/public/:slug', async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({ where: { slug: req.params.slug } });
    if (!wedding || !wedding.isPublic) return res.status(404).json({ error: 'Not found' });

    const sections = await prisma.weddingSection.findMany({
      where: { weddingId: wedding.id, isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: listar todas (inclusive invisíveis)
router.get('/', authMiddleware, async (req, res) => {
  const sections = await prisma.weddingSection.findMany({
    where: { weddingId: req.weddingId },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(sections);
});

// Admin: criar
router.post('/', authMiddleware, async (req, res) => {
  const { type, title, content, sortOrder } = req.body;
  const section = await prisma.weddingSection.create({
    data: {
      weddingId: req.weddingId,
      type: type || 'text',
      title: title || '',
      content: content || {},
      sortOrder: sortOrder || 0,
    },
  });
  res.status(201).json(section);
});

// Admin: atualizar
router.patch('/:id', authMiddleware, async (req, res) => {
  const data = { ...req.body };
  delete data.id;
  delete data.weddingId;

  const result = await prisma.weddingSection.updateMany({
    where: { id: req.params.id, weddingId: req.weddingId },
    data,
  });
  if (result.count === 0) return res.status(404).json({ error: 'Not found' });
  const section = await prisma.weddingSection.findUnique({ where: { id: req.params.id } });
  res.json(section);
});

// Admin: reordenar (recebe array de ids na ordem)
router.put('/reorder', authMiddleware, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });

  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.weddingSection.updateMany({
        where: { id, weddingId: req.weddingId },
        data: { sortOrder: i },
      })
    )
  );
  res.json({ success: true });
});

// Admin: deletar
router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.weddingSection.deleteMany({
    where: { id: req.params.id, weddingId: req.weddingId },
  });
  res.json({ success: true });
});

export default router;
