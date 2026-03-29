require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
require('dotenv').config({ path: require('node:path').join(__dirname, '.env.local') });

console.log('=== Environment Variables ===');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '[SET]' : '[NOT SET]');
console.log('VITE_GOOGLE_API_KEY:', process.env.VITE_GOOGLE_API_KEY ? '[SET]' : '[NOT SET]');
console.log('ALL VITE_ vars:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
console.log('=== Full Env (filtered) ===');
const filtered = Object.keys(process.env)
  .filter(k => !k.includes('KEY') && !k.includes('SECRET') && !k.includes('TOKEN'))
  .sort();
for (const key of filtered) {
  console.log(`${key}: ${process.env[key]}`);
}