import type { NewsArticle, Persona, PersonaProfile, UiLanguage, SynthesisAngle, AngleBriefingData, HindiVideoScript } from '../types'
import { MOCK_SYNTHESIS_ANGLES, MOCK_ANGLE_BRIEFINGS, MOCK_HINDI_SCRIPT, MOCK_IPL_ANGLES, MOCK_STOCK_ANGLES, MOCK_WAR_ANGLES, MOCK_PERSONALIZED_CARD } from './mockData'

// Use a faster, lighter model to avoid 70B rate limits during the demo
const GROQ_MODEL = 'llama-3.1-8b-instant'

/**
 * Robustly parse JSON even if it includes markdown blocks or extra text.
 */
export function robustParseJson<T>(raw: string): T | null {
  if (!raw) return null
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch (e) {
    // Fallback: search for the first [ or { and last ] or }
    const startObj = cleaned.indexOf('{')
    const startArr = cleaned.indexOf('[')
    const start = (startObj !== -1 && (startArr === -1 || startObj < startArr)) ? startObj : startArr
    
    const endObj = cleaned.lastIndexOf('}')
    const endArr = cleaned.lastIndexOf(']')
    const end = (endObj !== -1 && (endArr === -1 || endObj > endArr)) ? endObj : endArr

    if (start !== -1 && end !== -1 && end > start) {
      try {
        const sliced = cleaned.slice(start, end + 1)
        return JSON.parse(sliced) as T
      } catch (err) {
        console.error('[Groq] robustParseJson: sliced parse failed', err)
      }
    }
    console.error('[Groq] robustParseJson: all parse attempts failed', e)
    return null
  }
}

// Keep these for backward compatibility but map them to the robust one
export const tryParseJson = robustParseJson
export const parseGroqJSON = (text: string) => robustParseJson(text)

export async function callGroq(
  promptOrMessages: string | Array<{ role: string; content: string }>,
  systemPrompt?: string,
  jsonMode: boolean = false
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
      max_tokens: 2500,
      temperature: jsonMode ? 0.1 : 0.7,
      messages: allMessages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
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
  const raw = await callGroq(prompt, undefined, true)
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
  const raw = await callGroq(prompt, undefined, true)
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
  const raw = await callGroq(prompt, undefined, true)
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
  const prompt = `Context topic: ${topic}. Section:
${sectionText}

User (${persona}) asks: ${question}
Answer concisely in 2-4 sentences.`
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
  const raw = await callGroq(prompt, undefined, true)
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
  const raw = await callGroq(prompt, undefined, true)
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
  const raw = await callGroq(prompt, undefined, true)
  return tryParseJson<import('../types').VideoScript>(raw)
}

export async function marketMoodGroq(headlines: string[]) {
  const prompt = `Given these market headlines, return JSON only: { "mood": "Bullish"|"Bearish"|"Cautious", "line": "one sentence explanation" }
Headlines:
${headlines.join('\n')}`
  const raw = await callGroq(prompt, undefined, true)
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

// ─── Challenge 1: Angle-Based Multi-Article Synthesis ───────────────────

export async function generateAngleSynthesis(
  topic: string,
  articles: NewsArticle[]
): Promise<SynthesisAngle[]> {
  const articlesJson = JSON.stringify(
    articles.map((a, i) => ({
      index: i,
      title: a.title,
      description: a.description,
      source: a.source?.name,
      publishedAt: a.publishedAt,
    }))
  )
  const prompt = `You are a senior editor at a top Indian financial newspaper. You have ${articles.length} articles about: "${topic}".

Cluster them into 4-6 distinct ANGLES of coverage. Each angle should represent a unique perspective/dimension — NOT a duplicate.

Suggested angle types (adapt to topic):
- Macro Impact / GDP & Growth
- Sector Winners & Losers
- Market Reaction / Investor Sentiment
- Expert Commentary & Analysis
- Historical Comparison / Context
- Policy & Regulatory Impact
- Common Person Impact

Articles:
${articlesJson}

Return ONLY valid JSON array (no markdown):
[
  {
    "id": "macro-impact",
    "name": "Macro Impact",
    "icon": "📊",
    "color": "#3a86ff",
    "description": "One sentence explaining this angle",
    "articleIndices": [0, 3, 7],
    "articleCount": 3
  }
]

Rules:
- Each article can appear in 1-2 angles max
- Every article must appear in at least one angle
- Order angles from most urgent to most analytical`

  try {
    const raw = await callGroq(prompt, 'Return only valid JSON array. No markdown.')
    const parsed = parseGroqJSON(raw) as SynthesisAngle[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    throw new Error('Empty or invalid angle synthesis')
  } catch (err) {
    const q = topic.toLowerCase()
    if (q.includes('budget') || q.includes('union')) {
      console.warn('[Groq] Angle synthesis failed, using mock budget fallback:', err)
      return MOCK_SYNTHESIS_ANGLES
    }
    if (q.includes('ipl')) {
      console.warn('[Groq] Angle synthesis failed, using mock IPL fallback')
      return MOCK_IPL_ANGLES
    }
    if (q.includes('stock') || q.includes('market') || q.includes('nifty')) {
      console.warn('[Groq] Angle synthesis failed, using mock stock fallback')
      return MOCK_STOCK_ANGLES
    }
    if (q.includes('war') || q.includes('conflict') || q.includes('iran')) {
      console.warn('[Groq] Angle synthesis failed, using mock war fallback')
      return MOCK_WAR_ANGLES
    }

    // Ultimate Fallback: Single generic angle if we have articles
    if (articles.length > 0) {
      console.warn('[Groq] Angle synthesis failed, using generic AI fallback for:', topic)
      return [
        {
          id: 'ai-analysis',
          name: 'AI Analysis',
          icon: '✨',
          color: '#f0a500',
          description: `Consolidated AI briefing for "${topic}".`,
          articleCount: articles.length,
          articleIndices: articles.map((_, i) => i)
        }
      ]
    }
    return []
  }
}

export async function generateAngleBriefing(
  angle: SynthesisAngle,
  articles: NewsArticle[],
  topic: string
): Promise<AngleBriefingData> {
  const angleArticles = angle.articleIndices
    .map((i) => articles[i])
    .filter(Boolean)
  const articlesContext = angleArticles
    .map(
      (a) =>
        `SOURCE: ${a.source?.name}\nTITLE: ${a.title}\nDETAILS: ${a.description || 'N/A'}\nCONTENT: ${(a.content || '').slice(0, 800)}`
    )
    .join('\n---\n')

  const prompt = `You are an expert analyst writing the "${angle.name}" section of a deep briefing on "${topic}".

You are covering ONLY the "${angle.name}" angle. Do NOT repeat information that belongs in other angles.

Sources for this angle:
${articlesContext}

Return ONLY valid JSON (no markdown):
{
  "summary": "3-4 sentences covering ONLY this angle. Be specific with numbers and facts.",
  "keyPoints": [
    "Specific point 1 with data",
    "Specific point 2 with data",
    "Specific point 3 with data",
    "Specific point 4 with data"
  ],
  "expertQuotes": [
    { "speaker": "Name", "role": "Title/Organization", "quote": "What they said (paraphrase if needed)" }
  ],
  "dataPoints": [
    { "label": "Metric name", "value": "₹1,234 Cr", "change": "+5.2%", "sentiment": "positive" }
  ],
  "implications": "2 sentences on what this angle means going forward"
}`

  try {
    const raw = await callGroq(prompt, 'Return only valid JSON. No markdown.')
    const parsed = parseGroqJSON(raw) as AngleBriefingData
    if (parsed && parsed.summary) return parsed
    throw new Error('Invalid angle briefing')
  } catch (err) {
    const isBudget = topic.toLowerCase().includes('budget') || topic.toLowerCase().includes('union')
    if (isBudget) {
      console.warn('[Groq] Angle briefing failed, using mock budget fallback:', err)
      return (MOCK_ANGLE_BRIEFINGS[angle.id] || MOCK_ANGLE_BRIEFINGS['macro-impact']) as AngleBriefingData
    }
    throw err // Let the UI handle real failures for non-mock topics
  }
}

export async function answerWithAngleContext(
  question: string,
  angleData: AngleBriefingData,
  angleName: string,
  topic: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  const contextStr = `Topic: ${topic}
Active Angle: ${angleName}
Angle Summary: ${angleData.summary}
Key Points: ${angleData.keyPoints.join('; ')}
Data Points: ${angleData.dataPoints.map((d) => `${d.label}: ${d.value}`).join('; ')}
Implications: ${angleData.implications}`

  const messages = [
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ]

  return callGroq(
    messages,
    `You are a senior news analyst answering questions about the "${angleName}" angle of "${topic}".

Context:
${contextStr}

CRITICAL RULES:
- Answer ONLY from the context of the "${angleName}" angle
- Do NOT provide information from other angles — this ensures non-overlapping answers
- Be specific: use numbers, names, dates
- Keep answers to 2-4 sentences
- Plain text only, no markdown`
  )
}

// ─── Challenge 2: Deep Persona Reframing ────────────────────────────────

export async function personalizeForProfile(
  article: NewsArticle,
  profile: PersonaProfile
): Promise<{
  headline: string
  summary: string
  relevanceScore: number
  depthLabel: string
  format: string
  whyItMatters: string
  keyMetric?: { label: string; value: string }
} | null> {
  const prompt = `You are a news editor personalizing content for a specific reader.

Reader Profile:
- ${profile.description}
- Reading depth: ${profile.depth}
- Preferred format: ${profile.preferredFormat}
- Focus areas: ${profile.focusAreas.join(', ')}

Article:
Title: ${article.title}
Description: ${article.description || ''}
Content: ${(article.content || '').slice(0, 800)}

Rewrite this article's presentation for THIS specific reader. The output must be DRAMATICALLY different based on the reader:

For "executive" depth: Use financial jargon, focus on macro implications, include metrics
For "intermediate" depth: Balance context with data, highlight business impact
For "beginner" depth: Use simple analogies (chai/school fees/pocket money), explain jargon, keep it relatable

Return ONLY valid JSON:
{
  "headline": "Rewritten headline tailored to this reader (max 15 words)",
  "summary": "2-3 sentences tailored to reader's depth level and interests",
  "relevanceScore": 1-10,
  "depthLabel": "Quick Read|Deep Dive|Explainer",
  "format": "metrics-card|story-card|explainer-card",
  "whyItMatters": "One sentence: why this matters to THIS specific reader",
  "keyMetric": { "label": "Key number label", "value": "The number" }
}`

  try {
    const raw = await callGroq(prompt, 'Return only valid JSON. No markdown.')
    const parsed = tryParseJson(raw) as any
    if (parsed && parsed.headline) return parsed
    throw new Error('Invalid personalization')
  } catch (err) {
    console.warn('[Groq] Personalization failed, using mock fallback:', err)
    return MOCK_PERSONALIZED_CARD
  }
}

// ─── Challenge 3: Hindi Video Script Generation ─────────────────────────

export async function generateSyntheticArticles(
  query: string,
  count: number = 5
): Promise<NewsArticle[]> {
  const prompt = `You are a real-time news crawler simulator. The primary news API is down.
Generate exactly ${count} highly realistic, detailed news articles about "${query}" as if they were published in the last 24-48 hours.

Rules:
1. Use diverse reputable news sources (Economic Times, Reuters, Bloomberg, Mint, Financial Times, NDTV Profit).
2. Realistic headlines, descriptions, and 3-4 sentences of content per article.
3. Realistic ISO timestamps within the last 48 hours.
4. Include specific data points (numbers, percentages, quotes) to make them look authentic.
5. Content MUST be strictly about "${query}".
6. ABSOLUTELY NO markdown, no backticks, no text before or after JSON.

Respond ONLY with a valid JSON array of objects:
[
  {
    "title": "Headline",
    "description": "Short summary",
    "content": "Full detail...",
    "url": "https://simulated-news.os/${encodeURIComponent(query)}/article-1",
    "urlToImage": "https://picsum.photos/800/400?random=101",
    "publishedAt": "${new Date().toISOString()}",
    "source": { "name": "Source Name" }
  }
]`

  try {
    const raw = await callGroq(prompt, undefined, true)
    const parsed = robustParseJson(raw) as NewsArticle[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return []
  } catch (err) {
    console.error('[Groq] Synthetic news failed:', err)
    return []
  }
}

export async function generateHindiVideoScript(
  article: NewsArticle
): Promise<HindiVideoScript | null> {
  const prompt = `You are a senior Hindi broadcast journalist creating a 60-90 second video explainer for a SEMI-URBAN RETAIL INVESTOR in India who has NO financial background.

Source Article:
Title: ${article.title}
Description: ${article.description || ''}
Content: ${(article.content || '').slice(0, 1500)}

CRITICAL RULES:
1. Write ENTIRELY in Hindi (Devanagari script) — NO English words except brand names
2. Replace ALL English financial jargon with Hindi equivalents:
   - "Bankruptcy" → "दिवालिया" 
   - "Stock market" → "शेयर बाजार"
   - "Revenue" → "आमदनी/राजस्व"
   - "Investment" → "निवेश"
   - "Profit/Loss" → "मुनाफा/नुकसान"
   - "Market crash" → "बाजार में गिरावट"
   - "Inflation" → "महंगाई"
3. Use culturally appropriate analogies (ration shop, chai, bus fare, school fees, family savings, FD, post office savings)
4. Total duration MUST be between 60-90 seconds
5. Facts MUST be accurate to the source article — do NOT invent numbers

Create exactly 5 scenes:

Return ONLY valid JSON:
{
  "title": "English title for reference",
  "hindiTitle": "Hindi title in Devanagari",
  "totalDuration": 75,
  "scenes": [
    {
      "id": "hook",
      "duration": 10,
      "hindiText": "Hindi text in Devanagari for this scene",
      "romanized": "Hindi text in Roman script for pronunciation",
      "englishReference": "English meaning for fact-checking",
      "visualCue": "What visual/animation to show (e.g. 'Breaking news banner', 'Chart going down')",
      "background_color": "#e63946",
      "animation_type": "text_reveal"
    },
    {
      "id": "context",
      "duration": 20,
      "hindiText": "...",
      "romanized": "...",
      "englishReference": "...",
      "visualCue": "...",
      "background_color": "#1d3557",
      "animation_type": "fade_in"
    },
    {
      "id": "impact",
      "duration": 20,
      "hindiText": "...",
      "romanized": "...",
      "englishReference": "...",
      "visualCue": "...",
      "background_color": "#2a9d8f",
      "animation_type": "counter_up"
    },
    {
      "id": "analogy",
      "duration": 15,
      "hindiText": "A relatable analogy using chai/ration/school fees/family savings",
      "romanized": "...",
      "englishReference": "...",
      "visualCue": "...",
      "background_color": "#e9c46a",
      "animation_type": "fade_quote"
    },
    {
      "id": "takeaway",
      "duration": 10,
      "hindiText": "...",
      "romanized": "...",
      "englishReference": "...",
      "visualCue": "...",
      "background_color": "#264653",
      "animation_type": "text_reveal"
    }
  ],
  "factCheckSummary": "List the key facts from the source article that were preserved in the Hindi script"
}`

  try {
    const raw = await callGroq(prompt, 'Return only valid JSON. No markdown. All Hindi text must be in Devanagari script.', true)
    const parsed = tryParseJson<HindiVideoScript>(raw)
    if (parsed && parsed.scenes && parsed.scenes.length > 0) return parsed
    throw new Error('Invalid Hindi script')
  } catch (err) {
    console.warn('[Groq] Hindi script generation failed, using mock fallback:', err)
    return MOCK_HINDI_SCRIPT as HindiVideoScript
  }
}

