import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'src', 'learning_tracker.db');
const db = new Database(dbPath);

const tables = ['users', 'categories', 'entries', 'goals', 'journals', 'flashcards', 'resources', 'reading_list'];

console.log('--- Database Stats ---');
for (const table of tables) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    console.log(`${table}: ${count.count} rows`);
  } catch (err: any) {
    console.log(`${table}: Error - ${err.message}`);
  }
}

const users = db.prepare('SELECT id, email FROM users').all() as { id: number, email: string }[];
console.log('\n--- Users ---');
console.log(users);

console.log('\n--- Categories per User ---');
for (const user of users) {
  const categories = db.prepare('SELECT id, name FROM categories WHERE user_id = ?').all(user.id) as { id: number, name: string }[];
  console.log(`${user.email} (ID: ${user.id}): ${categories.length} categories`);
  console.log(categories);
}
