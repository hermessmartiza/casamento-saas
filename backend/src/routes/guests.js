import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { generatePix, checkPixStatus } from '../services/efi.js';

const router = Router();

// Público: buscar convidado por nome ou ID
router.get('/public/:slug', async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({ where: { slug: req.params.slug } });
    if (!wedding || !wedding.isPublic) return res.status(404).json({ error: 'Not found' });

    const { name, guestId } = req.query;

    // Busca por ID específico (link direto)
    if (guestId) {
      const guest = await prisma.guest.findFirst({
        where: { id: guestId, weddingId: wedding.id },
      });
      if (!guest) return res.status(404).json({ error: 'Guest not found' });
      return res.json(guest);
    }

    // Busca por nome (parcial, case insensitive)
    if (name) {
      const guests = await prisma.guest.findMany({
        where: {
          weddingId: wedding.id,
          name: { contains: name, mode: 'insensitive' },
        },
        orderBy: { name: 'asc' },
        take: 10,
      });
      return res.json(guests);
    }

    res.json([]);
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

// Público: auto-registro com pagamento
router.post('/self-register/:slug', async (req, res) => {
  try {
    const wedding = await prisma.wedding.findUnique({ where: { slug: req.params.slug } });
    if (!wedding || !wedding.isPublic) return res.status(404).json({ error: 'Not found' });

    const { name, email, phone, adultCount, childCount, dietaryRestrictions } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const adults = parseInt(adultCount) || 1;
    const children = parseInt(childCount) || 0;
    const pricePerGuest = wedding.pricePerGuest || 0;
    const pricePerChild = wedding.pricePerChild || 0;
    const totalAmount = (adults * pricePerGuest) + (children * pricePerChild);

    // Create guest record
    const guest = await prisma.guest.create({
      data: {
        weddingId: wedding.id,
        name,
        email: email || null,
        phone: phone || null,
        adultCount: adults,
        childCount: children,
        dietaryRestrictions: dietaryRestrictions || null,
        rsvpStatus: 'CONFIRMED',
        paymentStatus: totalAmount > 0 ? 'PENDING' : 'PAID',
        paymentAmount: totalAmount,
      },
    });

    // If free, done
    if (totalAmount <= 0) {
      return res.status(201).json({ guest, paymentRequired: false });
    }

    // Generate PIX
    try {
      // EFI requires txid: 26-35 alphanumeric chars. CUID is 25, so pad it.
      const txid = guest.id + 'x'; // 25 + 1 = 26 chars
      const pix = await generatePix(wedding, totalAmount, txid);
      await prisma.guest.update({
        where: { id: guest.id },
        data: { txid: pix.txid },
      });
      return res.status(201).json({
        guest,
        paymentRequired: true,
        pix,
        amount: totalAmount,
      });
    } catch (pixErr) {
      // PIX failed but guest is created - they can pay later
      console.error('PIX generation failed:', pixErr.message);
      return res.status(201).json({
        guest,
        paymentRequired: true,
        pixError: pixErr.message,
        amount: totalAmount,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Público: verificar status do pagamento
router.get('/check-payment/:guestId', async (req, res) => {
  try {
    const guest = await prisma.guest.findUnique({
      where: { id: req.params.guestId },
      include: { wedding: true },
    });
    if (!guest) return res.status(404).json({ error: 'Not found' });

    if (guest.paymentStatus === 'PAID') {
      return res.json({ status: 'PAID', guest });
    }

    if (!guest.txid) {
      return res.json({ status: 'PENDING', message: 'Aguardando pagamento' });
    }

    try {
      const pixStatus = await checkPixStatus(guest.wedding, guest.txid);
      if (pixStatus.status === 'CONCLUIDA') {
        await prisma.guest.update({
          where: { id: guest.id },
          data: {
            paymentStatus: 'PAID',
            paymentMethod: 'PIX',
            paidAt: pixStatus.paidAt ? new Date(pixStatus.paidAt) : new Date(),
          },
        });
        return res.json({ status: 'PAID', guest: { ...guest, paymentStatus: 'PAID' } });
      }
      return res.json({ status: pixStatus.status || 'PENDING' });
    } catch {
      return res.json({ status: 'PENDING', message: 'Verificando...' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
