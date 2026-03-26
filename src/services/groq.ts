import type { NewsArticle, Persona, UiLanguage } from '../types'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

export function tryParseJson<T>(raw: string): T | null {
  const trimmed = raw.trim()
  const unwrapped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(unwrapped) as T
  } catch {
    const start = unwrapped.indexOf('{')
    const end = unwrapped.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(unwrapped.slice(start, end + 1)) as T
      } catch {
        return null
      }
    }
    return null
  }
}

export function parseGroqJSON(text: string): unknown {
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse Groq JSON response')
  }
}

export async function callGroq(
  promptOrMessages: string | Array<{ role: string; content: string }>,
  systemPrompt?: string
): Promise<string> {
  const allMessages = Array.isArray(promptOrMessages)
    ? systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...promptOrMessages]
      : promptOrMessages
    : [
        {
          role: 'system',
          content:
            systemPrompt ||
            'You are NewsOS, an AI-native news intelligence system. Reply with valid JSON only when asked.',
        },
        { role: 'user', content: promptOrMessages },
      ]

  const response = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 2000,
      temperature: 0.4,
      messages: allMessages,
    }),
  })

  const data = (await response.json()) as {
    error?: string
    choices?: { message?: { content?: string } }[]
  }
  if (!response.ok || data.error) {
    throw new Error(`Groq error: ${data.error || response.status}`)
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty Groq response')
  return content
}

const articleSnippet = (a: NewsArticle) =>
  JSON.stringify({
    title: a.title,
    description: a.description,
    content: a.content?.slice(0, 1200),
    url: a.url,
  })

export async function personalizeArticle(article: NewsArticle, persona: Persona) {
  const prompt = `You are a news editor for a ${persona} (trader/founder/learner).
Rewrite this headline and summary to be maximally relevant to their perspective.
Return JSON only: { "headline": string, "summary": string (2 sentences max), "relevanceScore": number 1-10 }
Article: ${articleSnippet(article)}`
  const raw = await callGroq(prompt)
  return tryParseJson<{ headline: string; summary: string; relevanceScore: number }>(raw)
}

export async function generateBriefingJson(topic: string, articles: NewsArticle[]) {
  const articlesJson = JSON.stringify(
    articles.map((a) => ({
      title: a.title,
      description: a.description,
      publishedAt: a.publishedAt,
      source: a.source?.name,
      url: a.url,
    }))
  )
  const n = articles.length
  const prompt = `You are an elite financial journalist synthesizing ${n} news articles about: "${topic}".

Create a structured deep briefing with these exact sections:
1. THE HEADLINE SUMMARY (3 sentences, what happened and why it matters)
2. KEY FACTS (exactly 5 bullet points, numbers and specifics only)
3. THE PLAYERS (who is involved and what each wants)
4. OPPOSING VIEWS (2 contrasting perspectives with attribution)
5. MARKET / POLICY IMPACT (specific consequences, use numbers)
6. WHAT TO WATCH NEXT (3 forward-looking signals to monitor)

Return JSON only with keys: "summary", "facts" (array of strings), "players" (array of {name, role, stance}), "views" (array of {side, text, attribution}), "impact", "watchNext" (array of 3 strings).
Articles: ${articlesJson}`
  const raw = await callGroq(prompt)
  return tryParseJson<{
    summary: string
    facts: string[]
    players: { name: string; role: string; stance: string }[]
    views: { side: string; text: string; attribution?: string }[]
    impact: string
    watchNext: string[]
  }>(raw)
}

export async function summarizeBullets(article: NewsArticle): Promise<string[]> {
  const prompt = `Return JSON only: { "bullets": string[] } with exactly 3 short bullet points (max 18 words each) summarizing this story:
${article.title}
${article.description || ''}`
  const raw = await callGroq(prompt)
  const parsed = tryParseJson<{ bullets: string[] }>(raw)
  if (parsed?.bullets?.length) return parsed.bullets.slice(0, 3)
  return [
    article.description?.slice(0, 140) || article.title,
    `Source: ${article.source?.name ?? 'News'}`,
    article.publishedAt ? `Published ${article.publishedAt.slice(0, 10)}` : 'Latest update',
  ]
}

export async function generateNarration(article: NewsArticle, zoneName: string) {
  const prompt = `You are a dramatic, immersive news narrator — like a voice from a magical newspaper.
Write a 3-sentence spoken narration for this news story, starting with "Breaking from ${zoneName}..."
Make it vivid, serious, and engaging. End with one provocative question.
Article: ${article.title} — ${article.description || ''}`
  return callGroq(prompt)
}

export async function answerAboutSection(
  sectionText: string,
  question: string,
  persona: Persona,
  topic: string
) {
  const prompt = `Context topic: ${topic}. Section:\n${sectionText}\n\nUser (${persona}) asks: ${question}\nAnswer concisely in 2-4 sentences.`
  return callGroq(prompt)
}

export async function translateArticleGroq(article: NewsArticle, language: string) {
  const prompt = `You are a native ${language} news journalist writing for a ${language}-speaking audience in India.

Translate AND culturally adapt this English business news article:
- Replace Western financial references with Indian equivalents (e.g. "Fed" → "RBI", "Wall Street" → "Dalal Street")
- Use idioms and expressions natural to ${language} speakers
- Add local context where helpful
- Keep numbers and proper nouns in their original form
- Write at a Class 10 reading level — accessible but not condescending

Return JSON only: { "headline": string, "summary": string (3 sentences), "fullText": string, "localContext": string (1 sentence) }

Article: ${articleSnippet(article)}
Language: ${language}`
  const raw = await callGroq(prompt)
  return tryParseJson<{
    headline: string
    summary: string
    fullText: string
    localContext: string
  }>(raw)
}

export async function generateArcAnalysis(topic: string, articles: NewsArticle[]) {
  const articlesJson = JSON.stringify(
    articles.map((a) => ({
      title: a.title,
      description: a.description,
      publishedAt: a.publishedAt,
      url: a.url,
    }))
  )
  const n = articles.length
  const prompt = `You are a data journalist analyzing the complete story arc of: "${topic}"

Analyze these ${n} articles and return JSON only:
{
  "title": "Story title",
  "summary": "2-sentence story so far",
  "timeline": [
    { "date": "YYYY-MM-DD", "headline": "short", "event": "what happened", "sentiment": "positive|negative|neutral", "importance": 1-5 }
  ],
  "players": [
    { "name": "...", "role": "...", "stance": "...", "influence": 1-10 }
  ],
  "sentimentShift": "overall trajectory description",
  "contradictions": ["surprising angle 1", "surprising angle 2"],
  "watchNext": ["signal 1", "signal 2", "signal 3"],
  "prediction": "One bold prediction about where this story goes"
}
Articles: ${articlesJson}`
  const raw = await callGroq(prompt)
  return tryParseJson<import('../types').ArcAnalysis>(raw)
}

export async function generateVideoScript(article: NewsArticle) {
  const prompt = `You are a broadcast news video scriptwriter.
Write a 75-second video script for this news story with EXACTLY this structure:

SCENE 1 — HOOK (0-10s): One punchy sentence. Dramatic opener.
SCENE 2 — CONTEXT (10-30s): What happened. 2-3 sentences.
SCENE 3 — KEY DATA (30-50s): 3 specific numbers/facts, each as a separate beat.
SCENE 4 — IMPACT (50-65s): Who is affected and how.
SCENE 5 — OUTRO (65-75s): What to watch next. Sign-off line.

For each scene also return: animation_type (one of: text_reveal, counter_up, map_zoom, chart_animate, fade_quote), background_color (hex)

Return JSON only: { "title": string, "scenes": [{ "id": string, "duration": number, "text": string, "animation_type": string, "background_color": string }] }

Article: ${articleSnippet(article)}`
  const raw = await callGroq(prompt)
  return tryParseJson<import('../types').VideoScript>(raw)
}

export async function marketMoodGroq(headlines: string[]) {
  const prompt = `Given these market headlines, return JSON only: { "mood": "Bullish"|"Bearish"|"Cautious", "line": "one sentence explanation" }
Headlines:
${headlines.join('\n')}`
  const raw = await callGroq(prompt)
  return tryParseJson<{ mood: string; line: string }>(raw)
}

export async function worldZoneChat(article: NewsArticle, question: string, zoneName: string) {
  const prompt = `You help a reader understand a news story from zone "${zoneName}".
Article title: ${article.title}
Summary: ${article.description || ''}
Question: ${question}
Answer in 2-5 sentences, grounded in the article.`
  return callGroq(prompt)
}

export function personaLabel(p: Persona): string {
  if (p === 'trader') return 'trader'
  if (p === 'learner') return 'learner'
  return 'founder'
}

export function languageName(lang: UiLanguage): string {
  const map: Record<UiLanguage, string> = {
    en: 'English',
    hi: 'Hindi',
    ta: 'Tamil',
    te: 'Telugu',
    bn: 'Bengali',
  }
  return map[lang]
}
