import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: '.env' });

const key = process.env.GROQ_API_KEY;
const model = 'llama-3.3-70b-versatile';

async function test() {
    console.log('Testing Groq with key:', key?.slice(0, 10) + '...');
    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: 'Say hello' }],
            }),
        });
        const data = await r.json();
        console.log('Status:', r.status);
        fs.writeFileSync('groq_test_result.json', JSON.stringify(data, null, 2));
        console.log('Result written to groq_test_result.json');
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

test();
