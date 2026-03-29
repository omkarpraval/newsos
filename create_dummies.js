const USERS = [
    { email: 'cfo@newsos.com', password: 'password123', persona: 'trader' },
    { email: 'founder@newsos.com', password: 'password123', persona: 'founder' },
    { email: 'student@newsos.com', password: 'password123', persona: 'learner' },
];

async function run() {
    console.log('--- Registering Dummy Users ---');
    for (const u of USERS) {
        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(u)
            });
            const data = await res.json();
            if (res.ok) {
                console.log(`[PASS] User ${u.email}: Success`);
            } else {
                console.log(`[INFO] User ${u.email}: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error(`[FAIL] User ${u.email}: Could not connect to server. Ensure "npm run dev" is running.`);
        }
    }
    console.log('--- Done ---');
}

run();
