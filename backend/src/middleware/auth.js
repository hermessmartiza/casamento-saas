import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'casamento-saas-secret-dev';

export function generateToken(weddingId) {
  return jwt.sign({ weddingId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.weddingId = decoded.weddingId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
