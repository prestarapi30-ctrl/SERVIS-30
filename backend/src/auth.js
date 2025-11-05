import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { generateTokenSaldo } from './utils.js';

const JWT_SECRET = process.env.JWT_SECRET;

export async function registerUser({ name, email, password, phone }) {
  const hashed = await bcrypt.hash(password, 10);
  const tokenSaldo = generateTokenSaldo();
  const res = await query(
    `INSERT INTO users(name, email, password_hash, phone, token_saldo)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, email, phone, role, token_saldo, balance, created_at`,
    [name, email, hashed, phone || null, tokenSaldo]
  );
  return res.rows[0];
}

export async function loginUser({ email, password }) {
  const res = await query(`SELECT * FROM users WHERE email=$1`, [email]);
  const user = res.rows[0];
  if (!user) throw new Error('Credenciales inválidas');
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Credenciales inválidas');
  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token_saldo: user.token_saldo,
      balance: user.balance
    }
  };
}

export function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  next();
}