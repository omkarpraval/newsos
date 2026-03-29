import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

console.log('GOOGLE_API_KEY from process.env:', process.env.GOOGLE_API_KEY ? '[SET]' : '[NOT SET]');
console.log('VITE_GOOGLE_API_KEY from process.env:', process.env.VITE_GOOGLE_API_KEY ? '[SET]' : '[NOT SET]');