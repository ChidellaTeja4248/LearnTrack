import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'src', 'learning_tracker.db');
const db = new Database(dbPath);

const userId = 2; // chidellateja164@gmail.com
const categoryId = 1; // DSA

try {
  const stmt = db.prepare(`
    INSERT INTO entries (user_id, category_id, date, duration_minutes, description, difficulty) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(userId, categoryId, '2026-03-02', 60, 'Test entry', 'Medium');
  console.log('Entry inserted:', result.lastInsertRowid);
} catch (err: any) {
  console.error('Error inserting entry:', err.message);
}
