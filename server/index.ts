import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();
const PORT = 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'treasure-game-secret-key';

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'] }));
app.use(express.json());

function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未登入' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token 無效' });
  }
}

// 註冊
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '請填寫 email 與密碼' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(email, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email } });
  } catch {
    res.status(409).json({ error: '此 email 已被註冊' });
  }
});

// 登入
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'email 或密碼錯誤' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { email: user.email } });
});

// 儲存分數（需登入）
app.post('/api/scores', authMiddleware, (req: any, res) => {
  const { score } = req.body;
  if (score === undefined) return res.status(400).json({ error: '缺少分數' });
  db.prepare('INSERT INTO scores (user_id, email, score) VALUES (?, ?, ?)').run(req.user.id, req.user.email, score);
  res.json({ ok: true });
});

// 排行榜（公開）
app.get('/api/scores', (_req, res) => {
  const rows = db.prepare('SELECT email, score, created_at FROM scores ORDER BY score DESC LIMIT 10').all();
  res.json(rows);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
