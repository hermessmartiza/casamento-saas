import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { certExists } from '../services/efi.js';

const router = Router();

// Público: criar novo casamento (registro self-service)
router.post('/register', async (req, res) => {
  try {
    const { slug, coupleName, partner1Name, partner2Name, password } = req.body;
    if (!slug || !coupleName || !partner1Name || !partner2Name || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    }

    const existing = await prisma.wedding.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ error: 'Este nome já está em uso' });

    const adminPassword = await bcrypt.hash(password, 10);
    const wedding = await prisma.wedding.create({
      data: { slug, coupleName, partner1Name, partner2Name, adminPassword },
    });

    const token = generateToken(wedding.id);
    res.status(201).json({
      token,
      wedding: { id: wedding.id, slug: wedding.slug, coupleName: wedding.coupleName },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Público: busca casamento por slug (site público)
router.get('/public/:slug', async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, slug: true, coupleName: true, partner1Name: true, partner2Name: true,
        weddingDate: true, location: true, description: true, primaryColor: true,
        accentColor: true, logo: true, coverImage: true, isPublic: true, pixKey: true,
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
      'location', 'description', 'primaryColor', 'accentColor', 'logo', 'coverImage', 'isPublic', 'pixKey',
      'pricePerGuest', 'pricePerChild', 'efiClientId', 'efiClientSecret', 'efiPixKey', 'efiSandbox'];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.weddingDate === '' || data.weddingDate === null) {
      data.weddingDate = null;
    } else if (data.weddingDate) {
      data.weddingDate = new Date(data.weddingDate);
    }
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

// Upload certificado .p12
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = process.env.CERTS_DIR || '/app/certs';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `${req.weddingId}.p12`),
  }),
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.p12') || file.originalname.endsWith('.pfx')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .p12 ou .pfx'));
    }
  },
  limits: { fileSize: 1024 * 1024 }, // 1MB
});

router.post('/cert', authMiddleware, upload.single('cert'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    res.json({ success: true, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verificar se certificado existe
router.get('/cert-status', authMiddleware, (req, res) => {
  res.json({ exists: certExists(req.weddingId) });
});

export default router;
