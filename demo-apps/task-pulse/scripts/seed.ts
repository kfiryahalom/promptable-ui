import bcrypt from 'bcryptjs';
import { getDb } from '../src/lib/db';

async function seed() {
  const db = getDb();

  const users = [
    { email: 'user1@demo.com', password: 'password123' },
    { email: 'user2@demo.com', password: 'password123' },
  ];

  for (const user of users) {
    const hashed = await bcrypt.hash(user.password, 10);
    db.prepare('INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)').run(
      user.email,
      hashed
    );
    console.log(`Seeded: ${user.email}`);
  }

  console.log('Done.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
