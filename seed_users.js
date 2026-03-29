import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const users = [
    { email: 'cfo@newsos.com', persona: 'trader', role: 'pro' },
    { email: 'founder@newsos.com', persona: 'founder', role: 'pro' },
    { email: 'investor@newsos.com', persona: 'learner', role: 'basic' }
  ];

  const hash = await bcrypt.hash('password123', 10);

  console.log('Seeding dummy users...');
  for (const u of users) {
    try {
      await pool.query(
        'INSERT INTO profiles (email, password_hash, persona, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [u.email, hash, u.persona, u.role]
      );
      console.log(`User ${u.email} created.`);
    } catch (e) {
      console.error(`Failed on ${u.email}:`, e.message);
    }
  }
  
  console.log('Seeding complete!');
  process.exit(0);
}

seed();
