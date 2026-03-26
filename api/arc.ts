export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const { topic, articles } = req.body || {}
  if (!topic || !Array.isArray(articles)) {
    res.status(400).json({ error: 'topic and articles[] required' })
    return
  }

  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!key) {
    res.status(503).json({ error: 'GROQ_API_KEY not configured' })
    return
  }

  const prompt = `Analyze the story arc for "${topic}" with these articles.
Return JSON: { title, summary, timeline[], players[], sentimentShift, contradictions[], watchNext[], prediction }.
Articles: ${JSON.stringify(articles)}`

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    res.status(r.status).json(await r.json())
  } catch {
    res.status(500).json({ error: 'Arc analysis failed' })
  }
}
