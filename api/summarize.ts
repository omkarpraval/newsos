export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const article = req.body?.article
  if (!article) {
    res.status(400).json({ error: 'article is required' })
    return
  }

  const prompt = `Summarize this article in 3 bullet points for an Indian business audience. Return JSON only: { "bullets": string[] }\nArticle: ${JSON.stringify(article)}`

  const key = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
  if (!key) {
    res.status(503).json({ error: 'GROQ_API_KEY not configured' })
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
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    res.status(r.status).json(await r.json())
  } catch {
    res.status(500).json({ error: 'Summarization failed' })
  }
}
