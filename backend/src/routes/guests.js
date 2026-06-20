import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Público: listar convidados (se site público)
router.get('/public/:slug', async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({ where: { slug: req.params.slug } });
    if (!wedding || !wedding.isPublic) return res.status(404).json({ error: 'Not found' });
    const guests = await prisma.guest.findMany({
      where: { weddingId: wedding.id },
      orderBy: { name: 'asc' },
    });
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RSVP público (convidado confirma/recusa)
router.patch('/rsvp/:guestId', async (req, res) => {
  try {
    const { rsvpStatus, plusOneName, dietaryRestrictions } = req.body;
    const data = {};
    if (rsvpStatus) data.rsvpStatus = rsvpStatus;
    if (plusOneName !== undefined) data.plusOneName = plusOneName;
    if (dietaryRestrictions !== undefined) data.dietaryRestrictions = dietaryRestrictions;
    const guest = await prisma.guest.update({
      where: { id: req.params.guestId },
      data,
    });
    res.json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: CRUD convidados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, side, category } = req.query;
    const where = { weddingId: req.weddingId };
    if (status) where.rsvpStatus = status;
    if (side) where.side = side;
    if (category) where.category = category;
    const guests = await prisma.guest.findMany({ where, orderBy: { name: 'asc' } });
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const guest = await prisma.guest.create({
      data: { ...req.body, weddingId: req.weddingId },
    });
    res.status(201).json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const guest = await prisma.guest.updateMany({
      where: { id: req.params.id, weddingId: req.weddingId },
      data: req.body,
    });
    if (guest.count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.guest.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.guest.deleteMany({
      where: { id: req.params.id, weddingId: req.weddingId },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
