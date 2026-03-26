import { Pool } from 'pg'
import dotenv from 'dotenv'

// Load env here because this module is imported before index.ts runs dotenv.config().
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const conn = process.env.DATABASE_URL

export const pool = conn
  ? new Pool({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
    })
  : null

export async function query(text: string, params?: unknown[]) {
  if (!pool) throw new Error('DATABASE_URL not configured')
  return pool.query(text, params)
}
