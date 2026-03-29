const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

console.log('Environment variables:');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY);
console.log('VITE_GOOGLE_API_KEY:', process.env.VITE_GOOGLE_API_KEY);
console.log('All env keys containing GOOGLE:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));