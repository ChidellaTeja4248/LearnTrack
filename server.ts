import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import db from './src/db.ts';

dotenv.config();
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers['x-auth-token'];

  if (!token) {
    console.log('Auth failed: No token provided');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('Auth failed: Invalid token', err.message);
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Registering user: ${email}`, { body: req.body });
  try {
    console.log('Hashing password...');
    const hashedPassword = bcrypt.hashSync(password, 4);
    console.log('Password hashed. Inserting into DB...');
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const result = stmt.run(email, hashedPassword);
    console.log(`User inserted with ID: ${result.lastInsertRowid}`);
    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET);
    console.log('Token generated. Sending response.');
    res.json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (err: any) {
    console.error('Registration error:', err);
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt: ${email}`);
  try {
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
    console.log('Login successful. Sending token.');
    res.json({ token, user: { id: user.id, email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Category Routes ---
app.get('/api/categories', authenticateToken, (req: any, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.user.id);
  res.json(categories);
});

app.post('/api/categories', authenticateToken, (req: any, res) => {
  const { name } = req.body;
  const stmt = db.prepare('INSERT INTO categories (user_id, name) VALUES (?, ?)');
  const result = stmt.run(req.user.id, name);
  res.json({ id: result.lastInsertRowid, name });
});

app.delete('/api/categories/:id', authenticateToken, (req: any, res) => {
  db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// --- Entry Routes ---
app.get('/api/entries', authenticateToken, (req: any, res) => {
  const entries = db.prepare(`
    SELECT e.*, COALESCE(c.name, 'Uncategorized') as category_name 
    FROM entries e 
    LEFT JOIN categories c ON e.category_id = c.id 
    WHERE e.user_id = ? 
    ORDER BY e.date DESC
  `).all(req.user.id);
  
  // Fetch resources for these entries
  const entryIds = entries.map((e: any) => e.id);
  if (entryIds.length > 0) {
    const resources = db.prepare(`SELECT * FROM resources WHERE entry_id IN (${entryIds.map(() => '?').join(',')})`).all(...entryIds);
    entries.forEach((e: any) => {
      e.resources = resources.filter((r: any) => r.entry_id === e.id);
    });
  } else {
    entries.forEach((e: any) => {
      e.resources = [];
    });
  }
  
  res.json(entries);
});

app.post('/api/entries', authenticateToken, (req: any, res) => {
  const { category_id, date, duration_minutes, description, difficulty, resources } = req.body;
  
  try {
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO entries (user_id, category_id, date, duration_minutes, description, difficulty) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(req.user.id, category_id, date, duration_minutes, description, difficulty);
      const entryId = result.lastInsertRowid;

      if (resources && Array.isArray(resources)) {
        const resourceStmt = db.prepare('INSERT INTO resources (user_id, entry_id, title, url, type) VALUES (?, ?, ?, ?, ?)');
        for (const r of resources) {
          resourceStmt.run(req.user.id, entryId, r.title, r.url, r.type);
        }
      }
      return entryId;
    });

    const entryId = transaction();
    res.json({ id: entryId, ...req.body });
  } catch (err: any) {
    console.error('Error creating entry:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

app.delete('/api/entries/:id', authenticateToken, (req: any, res) => {
  db.prepare('DELETE FROM entries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// --- Goal Routes ---
app.get('/api/goals', authenticateToken, (req: any, res) => {
  const goals = db.prepare(`
    SELECT g.*, c.name as category_name 
    FROM goals g 
    LEFT JOIN categories c ON g.category_id = c.id 
    WHERE g.user_id = ?
  `).all(req.user.id);
  res.json(goals);
});

app.post('/api/goals', authenticateToken, (req: any, res) => {
  const { category_id, type, target_minutes, start_date } = req.body;
  const stmt = db.prepare(`
    INSERT INTO goals (user_id, category_id, type, target_minutes, start_date) 
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, category_id, type, target_minutes, start_date);
  
  // Fetch the created goal with category_name
  const createdGoal = db.prepare(`
    SELECT g.*, c.name as category_name 
    FROM goals g 
    LEFT JOIN categories c ON g.category_id = c.id 
    WHERE g.id = ?
  `).get(result.lastInsertRowid);
  
  res.json(createdGoal);
});

app.delete('/api/goals/:id', authenticateToken, (req: any, res) => {
  db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// --- Journal Routes ---
app.get('/api/journals/:date', authenticateToken, (req: any, res) => {
  const journal = db.prepare('SELECT * FROM journals WHERE user_id = ? AND date = ?').get(req.user.id, req.params.date);
  res.json(journal || null);
});

app.post('/api/journals', authenticateToken, (req: any, res) => {
  const { date, understood, struggled, revision } = req.body;
  const stmt = db.prepare(`
    INSERT INTO journals (user_id, date, understood, struggled, revision) 
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      understood = excluded.understood,
      struggled = excluded.struggled,
      revision = excluded.revision
  `);
  const result = stmt.run(req.user.id, date, understood, struggled, revision);
  res.json({ success: true });
});

// --- Flashcard Routes ---
app.get('/api/flashcards', authenticateToken, (req: any, res) => {
  const flashcards = db.prepare(`
    SELECT f.*, c.name as category_name 
    FROM flashcards f 
    JOIN categories c ON f.category_id = c.id 
    WHERE f.user_id = ?
  `).all(req.user.id);
  res.json(flashcards);
});

app.get('/api/flashcards/due', authenticateToken, (req: any, res) => {
  const flashcards = db.prepare(`
    SELECT f.*, c.name as category_name 
    FROM flashcards f 
    JOIN categories c ON f.category_id = c.id 
    WHERE f.user_id = ? AND f.next_review <= CURRENT_DATE
  `).all(req.user.id);
  res.json(flashcards);
});

app.post('/api/flashcards', authenticateToken, (req: any, res) => {
  const { category_id, front, back, interval = 0 } = req.body;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + (interval || 0));
  const next_review = nextDate.toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO flashcards (user_id, category_id, front, back, next_review, interval) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(req.user.id, category_id, front, back, next_review, interval);
  
  const created = db.prepare(`
    SELECT f.*, c.name as category_name 
    FROM flashcards f 
    JOIN categories c ON f.category_id = c.id 
    WHERE f.id = ?
  `).get(result.lastInsertRowid);
  
  res.json(created);
});

app.put('/api/flashcards/:id', authenticateToken, (req: any, res) => {
  const { category_id, front, back, interval } = req.body;
  
  let next_review = undefined;
  if (interval !== undefined) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    next_review = nextDate.toISOString().split('T')[0];
  }

  if (next_review) {
    db.prepare(`
      UPDATE flashcards 
      SET category_id = ?, front = ?, back = ?, interval = ?, next_review = ? 
      WHERE id = ? AND user_id = ?
    `).run(category_id, front, back, interval, next_review, req.params.id, req.user.id);
  } else {
    db.prepare(`
      UPDATE flashcards 
      SET category_id = ?, front = ?, back = ? 
      WHERE id = ? AND user_id = ?
    `).run(category_id, front, back, req.params.id, req.user.id);
  }
  
  const updated = db.prepare(`
    SELECT f.*, c.name as category_name 
    FROM flashcards f 
    JOIN categories c ON f.category_id = c.id 
    WHERE f.id = ?
  `).get(req.params.id);
  
  res.json(updated);
});

app.post('/api/flashcards/:id/review', authenticateToken, (req: any, res) => {
  const { quality } = req.body; // 0-5
  const cardId = req.params.id;
  const userId = req.user.id;

  const card: any = db.prepare('SELECT * FROM flashcards WHERE id = ? AND user_id = ?').get(cardId, userId);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  // If quality is high (revised successfully), delete the card as requested
  if (quality >= 3) {
    db.prepare('DELETE FROM flashcards WHERE id = ?').run(cardId);
    return res.json({ success: true, deleted: true });
  }

  // Otherwise, reset for tomorrow (Again/Hard)
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  const next_review = nextDate.toISOString().split('T')[0];

  db.prepare(`
    UPDATE flashcards 
    SET interval = 1, next_review = ? 
    WHERE id = ?
  `).run(next_review, cardId);

  res.json({ success: true, next_review, interval: 1 });
});

app.delete('/api/flashcards/:id', authenticateToken, (req: any, res) => {
  db.prepare('DELETE FROM flashcards WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// --- Resource Routes ---
app.get('/api/resources', authenticateToken, (req: any, res) => {
  const resources = db.prepare('SELECT * FROM resources WHERE user_id = ?').all(req.user.id);
  res.json(resources);
});

app.post('/api/resources', authenticateToken, (req: any, res) => {
  const { entry_id, title, url, type } = req.body;
  const stmt = db.prepare('INSERT INTO resources (user_id, entry_id, title, url, type) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(req.user.id, entry_id, title, url, type);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.delete('/api/resources/:id', authenticateToken, (req: any, res) => {
  db.prepare('DELETE FROM resources WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// --- Reading List Routes ---
app.get('/api/reading-list', authenticateToken, (req: any, res) => {
  const list = db.prepare(`
    SELECT r.*, c.name as category_name 
    FROM reading_list r 
    LEFT JOIN categories c ON r.category_id = c.id 
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(req.user.id);
  res.json(list);
});

app.post('/api/reading-list', authenticateToken, (req: any, res) => {
  const { category_id, topic, priority } = req.body;
  const stmt = db.prepare('INSERT INTO reading_list (user_id, category_id, topic, priority) VALUES (?, ?, ?, ?)');
  const result = stmt.run(req.user.id, category_id, topic, priority);
  res.json({ id: result.lastInsertRowid, ...req.body, status: 'to-learn' });
});

app.put('/api/reading-list/:id', authenticateToken, (req: any, res) => {
  const { status, priority, topic, category_id } = req.body;
  db.prepare(`
    UPDATE reading_list 
    SET status = COALESCE(?, status), 
        priority = COALESCE(?, priority),
        topic = COALESCE(?, topic),
        category_id = COALESCE(?, category_id)
    WHERE id = ? AND user_id = ?
  `).run(status, priority, topic, category_id, req.params.id, req.user.id);
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/reading-list/:id', authenticateToken, (req: any, res) => {
  db.prepare('DELETE FROM reading_list WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.sendStatus(204);
});

// --- Analytics Routes ---
app.get('/api/analytics/detailed', authenticateToken, (req: any, res) => {
  const userId = req.user.id;

  // 1. Heatmap data (last 365 days)
  const heatmap = db.prepare(`
    SELECT date, SUM(duration_minutes) as value
    FROM entries
    WHERE user_id = ? AND date >= date('now', '-365 days')
    GROUP BY date
  `).all(userId);

  // 2. Trend data (last 30 days)
  const trends = db.prepare(`
    SELECT date, SUM(duration_minutes) as total
    FROM entries
    WHERE user_id = ? AND date >= date('now', '-30 days')
    GROUP BY date
    ORDER BY date ASC
  `).all(userId);

  // 3. Difficulty distribution
  const difficulty = db.prepare(`
    SELECT COALESCE(difficulty, 'Medium') as name, COUNT(*) as value
    FROM entries
    WHERE user_id = ?
    GROUP BY difficulty
  `).all(userId);

  // 4. Category distribution
  const categories = db.prepare(`
    SELECT COALESCE(c.name, 'Uncategorized') as name, SUM(e.duration_minutes) as value
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
    GROUP BY e.category_id
  `).all(userId);

  res.json({ heatmap, trends, difficulty, categories });
});

// --- Analytics Routes ---
app.get('/api/analytics/summary', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  
  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN date = ? THEN duration_minutes ELSE 0 END), 0) as today_minutes,
      COALESCE(SUM(CASE WHEN date >= date('now', '-7 days') THEN duration_minutes ELSE 0 END), 0) as week_minutes,
      COALESCE(SUM(CASE WHEN date >= date('now', 'start of month') THEN duration_minutes ELSE 0 END), 0) as month_minutes
    FROM entries 
    WHERE user_id = ?
  `).get(today, userId);

  const mostFocused = db.prepare(`
    SELECT COALESCE(c.name, 'Uncategorized') as name, SUM(e.duration_minutes) as total
    FROM entries e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
    GROUP BY e.category_id
    ORDER BY total DESC
    LIMIT 1
  `).get(userId);

  // Simple streak calculation: count consecutive days with at least one entry
  const allDates = db.prepare(`
    SELECT DISTINCT date FROM entries 
    WHERE user_id = ? 
    ORDER BY date DESC
  `).all(userId) as { date: string }[];

  let streak = 0;
  if (allDates.length > 0) {
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    
    // Check if today or yesterday has an entry
    const latestEntryDate = new Date(allDates[0].date);
    latestEntryDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((current.getTime() - latestEntryDate.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 1) {
      streak = 1;
      for (let i = 0; i < allDates.length - 1; i++) {
        const d1 = new Date(allDates[i].date);
        const d2 = new Date(allDates[i+1].date);
        const diff = Math.floor((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  res.json({ ...stats, mostFocused, streak });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    console.log(`Database connected. User count: ${userCount.count}`);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
});
