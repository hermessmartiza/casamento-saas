import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Público: busca casamento por slug (site público)
router.get('/public/:slug', async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, slug: true, coupleName: true, partner1Name: true, partner2Name: true,
        weddingDate: true, location: true, description: true, primaryColor: true,
        accentColor: true, logo: true, coverImage: true, isPublic: true,
      },
    });
    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });
    if (!wedding.isPublic) return res.status(403).json({ error: 'Not public' });
    res.json(wedding);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login admin
router.post('/login', async (req, res) => {
  try {
    const { slug, password } = req.body;
    const wedding = await prisma.wedding.findUnique({ where: { slug } });
    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });
    const valid = await bcrypt.compare(password, wedding.adminPassword);
    if (!valid) return res.status(401).json({ error: 'Invalid password' });
    const token = generateToken(wedding.id);
    res.json({ token, wedding: { id: wedding.id, slug: wedding.slug, coupleName: wedding.coupleName } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: dados do próprio casamento
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({
      where: { id: req.weddingId },
      include: {
        _count: { select: { guests: true, vendors: true, budgetItems: true, timelineTasks: true } },
      },
    });
    if (!wedding) return res.status(404).json({ error: 'Wedding not found' });
    const { adminPassword, ...data } = wedding;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: atualizar dados
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const allowed = ['coupleName', 'partner1Name', 'partner2Name', 'weddingDate',
      'location', 'description', 'primaryColor', 'accentColor', 'logo', 'coverImage', 'isPublic'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (req.body.weddingDate) data.weddingDate = new Date(req.body.weddingDate);
    const wedding = await prisma.wedding.update({
      where: { id: req.weddingId },
      data,
    });
    const { adminPassword, ...out } = wedding;
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
