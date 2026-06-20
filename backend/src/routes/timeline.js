import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Admin: CRUD cronograma
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const where = { weddingId: req.weddingId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const tasks = await prisma.timelineTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { priority: 'asc' }],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body, weddingId: req.weddingId };
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);
    const task = await prisma.timelineTask.create({ data });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);
    // Auto-set completedAt when status changes to DONE
    if (data.status === 'DONE' && !data.completedAt) {
      data.completedAt = new Date();
    }
    const result = await prisma.timelineTask.updateMany({
      where: { id: req.params.id, weddingId: req.weddingId },
      data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.timelineTask.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.timelineTask.deleteMany({
      where: { id: req.params.id, weddingId: req.weddingId },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
