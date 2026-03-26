export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!key || String(key).startsWith('your_')) {
    res.status(500).json({ error: 'GROQ_API_KEY not set in environment' })
    return
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        temperature: 0.7,
        ...req.body,
      }),
    })
    const data = (await r.json()) as { error?: { message?: string } }

    if (data.error) {
      // eslint-disable-next-line no-console
      console.error('Groq API error:', data.error)
      res.status(400).json({ error: data.error.message || 'Groq API failed' })
      return
    }
    res.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Groq proxy error'
    // eslint-disable-next-line no-console
    console.error('Groq proxy error:', message)
    res.status(500).json({ error: message })
  }
}
