import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT \'basic\'');
    console.log('Migration Complete: role column added');
  } catch (err) {
    console.error('Migration Failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
