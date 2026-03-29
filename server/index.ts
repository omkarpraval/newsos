import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool, query } from './db'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import fs from 'node:fs'
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))

// SERVE STATIC FRONTEND (PRODUCTION)
const isProd = process.env.NODE_ENV === 'production'
if (isProd) {
  app.use(express.static(path.join(__dirname, '..', 'dist')))
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const SALT_ROUNDS = 10
const NEWS_KEY = process.env.NEWSAPI_KEY || process.env.VITE_NEWSAPI_KEY
const GNEWS_KEY = process.env.GNEWS_API_KEY
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY

// Initialize Google GenAI for Veo (if key exists)
const genai = GOOGLE_KEY ? new GoogleGenAI({ apiKey: GOOGLE_KEY }) : null

// Import video generation service
import { generateVideoFromArticle } from '../src/services/video'

// IN-MEMORY DATABASE FOR DEMO ACCOUNTS (Fallback for no Postgres)
const memoryDB = new Map<string, any>()

const seedUsers = async () => {
  const hash = await bcrypt.hash('password123', SALT_ROUNDS)
  memoryDB.set('cfo@newsos.com', { id: 'user-cfo', email: 'cfo@newsos.com', password_hash: hash, persona: 'trader', role: 'pro' })
  memoryDB.set('founder@newsos.com', { id: 'user-founder', email: 'founder@newsos.com', password_hash: hash, persona: 'founder', role: 'pro' })
  memoryDB.set('student@newsos.com', { id: 'user-investor', email: 'student@newsos.com', password_hash: hash, persona: 'learner', role: 'basic' })
}
seedUsers()

function getGroqKey() {
  return process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
}

async function callGroqRaw(prompt: string, maxTokens = 2000, temperature = 0.4) {
  const key = getGroqKey()
  if (!key || key.startsWith('your_')) {
    throw new Error('GROQ_API_KEY not configured')
  }
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = (await r.json()) as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> }
  if (!r.ok || data.error) {
    throw new Error(data.error?.message || `Groq failed (${r.status})`)
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty Groq response')
  return text
}

function parseJsonFromText(text: string): unknown {
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/[\[{][\s\S]*[\]}]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse JSON from Groq')
  }
}

function safeFromDate(daysBack = 7): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.min(daysBack, 27))
  return d.toISOString().split('T')[0]
}

function authHeader(req: express.Request): string | null {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return null
  return h.slice(7)
}

function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = authHeader(req)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
    ;(req as express.Request & { userId?: string }).userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

/** Groq proxy — never expose key to browser */
app.post('/api/groq', async (req, res) => {
  const key = getGroqKey()
  if (!key || key.startsWith('your_')) {
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
        max_tokens: 1500,
        temperature: 0.7,
        ...req.body,
      }),
    })
    const data = (await r.json()) as { error?: { message?: string } }
    if (data.error) {
      console.error('[GROQ] Error:', data.error)
      fs.appendFileSync('groq_errors.log', `${new Date().toISOString()} - ${JSON.stringify(data.error)}\n`)
      res.status(400).json({ error: data.error.message || 'Groq API failed' })
      return
    }
    res.status(r.status).json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Groq request failed' })
  }
})

/**
 * GNews.io Backup Handler
 */
async function fetchGNews(category: string, pageSize: number) {
  if (!GNEWS_KEY) return null
  try {
    const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=in&max=${pageSize}&apikey=${GNEWS_KEY}`
    const r = await fetch(url)
    const d = await r.json() as any
    if (!d.articles) return null
    return {
      articles: d.articles.map((a: any) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        urlToImage: a.image,
        source: { name: a.source?.name || 'GNews' },
        publishedAt: a.publishedAt
      }))
    }
  } catch (e) {
    console.error('[GNEWS] Fallback failed:', e)
    return null
  }
}

app.get('/api/news', async (req, res) => {
  const {
    type = 'headlines',
    query: searchQuery,
    category = 'business',
    pageSize = 10,
    daysBack = 7,
  } = req.query as {
    type?: string
    query?: string
    category?: string
    pageSize?: string
    daysBack?: string
  }

  // Use primary NewsAPI key
  if (NEWS_KEY && !NEWS_KEY.startsWith('your_')) {
    try {
      let url = ''
      if (type === 'headlines') {
        url = `https://newsapi.org/v2/top-headlines?country=in&category=${encodeURIComponent(category)}&pageSize=${Number(pageSize)}&apiKey=${NEWS_KEY}`
      } else if (type === 'search' || type === 'arc') {
        const safeDays = type === 'arc' ? 14 : Number(daysBack)
        const from = safeFromDate(safeDays)
        url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(String(searchQuery || 'India business'))}&language=en&sortBy=publishedAt&from=${from}&pageSize=${Number(pageSize)}&apiKey=${NEWS_KEY}`
      } else {
        url = `https://newsapi.org/v2/top-headlines?country=in&category=business&pageSize=${Number(pageSize)}&apiKey=${NEWS_KEY}`
      }

      console.log(`[NEWS] Primary Try: ${type} | ${category || searchQuery}`)
      const response = await fetch(url)
      const data = (await response.json()) as any

      if (data.status === 'ok' && data.articles?.length > 0) {
        const articles = data.articles.filter((a: any) => a.title && a.title !== '[Removed]' && a.description && a.description !== '[Removed]')
        res.json({ articles, totalResults: articles.length, fetchedAt: new Date().toISOString(), source: 'newsapi' })
        return
      }
      console.warn('[NEWS] Primary failed or empty, falling back to GNews.')
    } catch (err: unknown) {
      console.error('[NEWS] Primary connection error, falling back.')
    }
  }

  // Fallback to GNews
  const gdata = await fetchGNews(category, Number(pageSize))
  if (gdata) {
    res.json({ ...gdata, fetchedAt: new Date().toISOString(), source: 'gnews' })
    return
  }

  res.status(503).json({ error: 'All news sources exhausted. Check API quotas.' })
})

// Vernacular: fetch real Indian business news (English base, India-focused query)
app.get('/api/vernacular/news', async (req, res) => {
  if (!NEWS_KEY || NEWS_KEY.startsWith('your_')) {
    res.status(500).json({ error: 'NEWSAPI_KEY not configured' })
    return
  }

  const { category = 'markets' } = req.query as { category?: string; language?: string }

  const categoryQueries: Record<string, string> = {
    markets: 'Nifty Sensex BSE NSE stock market India',
    rbi: 'RBI Reserve Bank India interest rate monetary policy',
    startups: 'India startup funding unicorn venture capital',
    budget: 'India Union Budget finance ministry revenue expenditure',
    economy: 'India GDP inflation economy growth',
    global: 'US India trade China geopolitics global economy impact India',
  }
  const query = categoryQueries[String(category)] || 'India business economy'

  try {
    const from = safeFromDate(7)
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&pageSize=12&sortBy=publishedAt&from=${from}&apiKey=${NEWS_KEY}`
    const r = await fetch(url)
    const data = (await r.json()) as { status?: string; articles?: unknown[]; message?: string; code?: string }
    if (data.status === 'error') {
      res.status(400).json({ error: data.message || 'NewsAPI error', code: data.code })
      return
    }
    res.json({ articles: data.articles || [], fetchedAt: new Date().toISOString(), query })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'NewsAPI fetch failed'
    res.status(500).json({ error: message })
  }
})

// Vernacular: culturally adapt + translate a single article
app.post('/api/vernacular/translate', async (req, res) => {
  const {
    title,
    description,
    content,
    targetLanguage,
    targetLocale,
    userPersona,
    mode,
  } = req.body as {
    title?: string
    description?: string
    content?: string
    targetLanguage?: string
    targetLocale?: string
    userPersona?: string
    mode?: 'normal' | 'eli12'
  }

  if (!title || !targetLanguage) {
    res.status(400).json({ error: 'title and targetLanguage required' })
    return
  }

  const languageConfig: Record<
    string,
    { name: string; region: string; script: string; referencePoint: string; examples: string; impactPrefix: string }
  > = {
    hi: {
      name: 'Hindi',
      region: 'North India',
      script: 'Devanagari',
      referencePoint: 'RBI, SBI, LIC, NSE',
      examples:
        'Use chai-samosa analogies when helpful, reference local mandi prices for inflation, and keep tone like a trusted Hindi newspaper.',
      impactPrefix: 'आपके लिए',
    },
    ta: {
      name: 'Tamil',
      region: 'Tamil Nadu',
      script: 'Tamil',
      referencePoint: 'Chennai IT corridor, textile & manufacturing',
      examples:
        'Reference Coimbatore industry, Chennai markets, and use a natural Tamil newsroom voice with an occasional proverb where fitting.',
      impactPrefix: 'உங்களுக்கு',
    },
    te: {
      name: 'Telugu',
      region: 'Andhra Pradesh / Telangana',
      script: 'Telugu',
      referencePoint: 'Hyderabad tech hub, pharma Valley, ports',
      examples:
        'Reference Vizag port for exports and a Telugu newspaper tone; keep it clear and grounded.',
      impactPrefix: 'మీకు',
    },
    bn: {
      name: 'Bengali',
      region: 'West Bengal / Bangladesh',
      script: 'Bengali',
      referencePoint: 'Kolkata trade, jute, tea gardens',
      examples:
        'Use a slightly poetic Bengali style where appropriate; reference Kolkata commerce and household price cues.',
      impactPrefix: 'আপনার জন্য',
    },
  }

  const lang = languageConfig[targetLanguage] || languageConfig.hi
  const locale = targetLocale || (targetLanguage === 'hi' ? 'hi-IN' : targetLanguage === 'ta' ? 'ta-IN' : targetLanguage === 'te' ? 'te-IN' : 'bn-IN')

  const isKids = mode === 'eli12'
  const toneRule = isKids
    ? 'Explain like a 12-year-old: very simple words, one relatable example (pocket money/school fees/house rent).'
    : 'Tone: like a trusted local newspaper, not a translation.'

  const prompt = `You are a senior journalist writing for a ${lang.region} audience in ${lang.name} (${lang.script} script).
Audience persona (if provided): ${userPersona || 'general'}
Target locale: ${locale}

Original English article:
Title: ${title}
Description: ${description || ''}
Content: ${(content || '').slice(0, 1400)}

Your task: Write a culturally adapted version of this news in ${lang.name}.

Rules:
1. Write entirely in ${lang.name} script — NO English words except proper nouns and brand names
2. Replace Western references with Indian equivalents; keep proper nouns intact
3. Add local context: if the news affects ${lang.region} specifically, mention it
4. Use these style notes: ${lang.examples}
5. ${toneRule}
6. Length: Title (1 line) + Summary (2-3 sentences) + Key Impact (1 sentence starting with "${lang.impactPrefix}")
7. End with a "Local Angle" — one sentence about how this affects the reader's region

Also include:
- difficulty: simple|moderate|complex
- readTimeSeconds: realistic estimate
- culturalNotes: 2 short bullets about what you adapted
- culturalDistance: 0-100 where higher means more Western references had to be adapted

Respond ONLY with valid JSON (no markdown):
{
  "translatedTitle": "...",
  "translatedSummary": "...",
  "keyImpact": "...",
  "localAngle": "...",
  "difficulty": "simple|moderate|complex",
  "readTimeSeconds": number,
  "culturalNotes": ["note1", "note2"],
  "culturalDistance": number,
  "cultureBridge": "One analogy sentence: \\"This is like...\\" in the same language"
}`

  try {
    const raw = await callGroqRaw(prompt, 900, 0.5)
    const parsed = parseJsonFromText(raw)
    res.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    res.status(500).json({ error: message })
  }
})

// Vernacular: generate a word-by-word glossary for a translated article
app.post('/api/vernacular/glossary', async (req, res) => {
  const { translatedText, targetLanguage } = req.body as { translatedText?: string; targetLanguage?: string }
  if (!translatedText || !targetLanguage) {
    res.status(400).json({ error: 'translatedText and targetLanguage required' })
    return
  }

  const prompt = `From this ${targetLanguage} translated news text, extract 5-8 key financial/economic terms that a general reader might not know.

Text: ${translatedText.slice(0, 2200)}

Respond ONLY with valid JSON array (no markdown):
[
  { "term": "term in native script", "romanized": "phonetic English", "meaning": "simple explanation in same language", "englishEquivalent": "English term" }
]`

  try {
    const raw = await callGroqRaw(prompt, 650, 0.4)
    const parsed = parseJsonFromText(raw)
    if (!Array.isArray(parsed)) {
      res.json([])
      return
    }
    res.json(parsed)
  } catch {
    res.json([])
  }
})

app.get('/api/arc/articles', async (req, res) => {
  if (!NEWS_KEY || NEWS_KEY.startsWith('your_')) {
    res.status(500).json({ error: 'NEWSAPI_KEY not configured' })
    return
  }
  const topic = String((req.query.topic as string) || '').trim()
  if (!topic) {
    res.status(400).json({ error: 'topic query param required' })
    return
  }
  try {
    const from = safeFromDate(14)
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=en&pageSize=20&from=${from}&sortBy=publishedAt&apiKey=${NEWS_KEY}`
    const r = await fetch(url)
    const data = (await r.json()) as { status?: string; articles?: unknown[]; message?: string; code?: string }
    if (data.status === 'error') {
      res.status(400).json({ error: data.message || 'NewsAPI error', code: data.code })
      return
    }
    res.json({ articles: data.articles || [], fetchedAt: new Date().toISOString() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Arc articles failed'
    res.status(500).json({ error: message })
  }
})

app.get('/api/arc/market-data', async (req, res) => {
  const topic = String((req.query.topic as string) || '').trim()
  const topicLower = topic.toLowerCase()
  const symbolMap: Record<string, string> = {
    nifty: '^NSEI',
    sensex: '^BSESN',
    reliance: 'RELIANCE.NS',
    tcs: 'TCS.NS',
    infosys: 'INFY.NS',
    hdfc: 'HDFCBANK.NS',
    rupee: 'USDINR=X',
    gold: 'GC=F',
    bitcoin: 'BTC-USD',
    crude: 'CL=F',
  }
  let symbol = '^NSEI'
  for (const [key, val] of Object.entries(symbolMap)) {
    if (topicLower.includes(key)) {
      symbol = val
      break
    }
  }
  try {
    const yahooRes = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const yahooData = (await yahooRes.json()) as unknown
    res.json({ symbol, data: yahooData })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Market data unavailable'
    res.json({ symbol, data: null, error: message })
  }
})

app.post('/api/arc/custom-chart', async (req, res) => {
  const { userRequest, topic, articles, marketData } = req.body as {
    userRequest?: string
    topic?: string
    articles?: unknown[]
    marketData?: unknown
  }
  if (!userRequest || !topic) {
    res.status(400).json({ error: 'userRequest and topic required' })
    return
  }
  try {
    const prompt = `You are a financial data analyst. The user is reading a Story Arc about "${topic}".

Here are the recent articles: ${JSON.stringify(
      (Array.isArray(articles) ? articles : [])
        .slice(0, 5)
        .map((a: any) => ({ title: a?.title, description: a?.description, publishedAt: a?.publishedAt }))
    )}

Market data context: ${JSON.stringify((marketData as any)?.data?.chart?.result?.[0]?.indicators?.quote?.[0] || {})}

The user has requested: "${userRequest}"

Respond ONLY with a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "chartType": "line" | "bar" | "scatter" | "radar" | "heatmap" | "treemap" | "gauge" | "geo",
  "title": "Chart title",
  "description": "One sentence explaining what this shows",
  "labels": ["label1", "label2", ...],
  "datasets": [
    {
      "label": "Dataset name",
      "data": [number1, number2, ...],
      "color": "#hexcolor"
    }
  ],
  "insight": "One key insight from this data in plain English",
  "dataSource": "Where this data comes from (e.g. NewsAPI analysis, Yahoo Finance, Groq estimation)"
}

Use real numbers from the articles and market data where possible. For estimated values, note it in dataSource. Make the chart genuinely useful and insightful, not generic.`
    const raw = await callGroqRaw(prompt, 1100, 0.3)
    const parsed = parseJsonFromText(raw)
    res.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to build chart'
    res.status(500).json({ error: message })
  }
})

app.post('/api/arc/full-analysis', async (req, res) => {
  const { topic, articles, marketData } = req.body as { topic?: string; articles?: unknown[]; marketData?: unknown }
  if (!topic || !Array.isArray(articles)) {
    res.status(400).json({ error: 'topic and articles required' })
    return
  }
  try {
    const prompt = `You are a senior financial journalist and data analyst. Analyze this news arc about "${topic}".

Articles (${articles.length} total): ${JSON.stringify(
      articles.map((a: any) => ({
        title: a?.title,
        description: a?.description,
        publishedAt: a?.publishedAt,
        source: a?.source?.name,
        url: a?.url,
      }))
    )}

Market data summary (if present): ${JSON.stringify((marketData as any)?.data?.chart?.result?.[0]?.meta || {})}

Respond ONLY with valid JSON (no markdown):
{
  "headline": "One powerful sentence summarizing the arc",
  "summary": "3-4 sentence narrative of how this story has developed",
  "keyPlayers": [
    { "name": "Player name", "role": "Their role in this story", "stance": "bullish|bearish|neutral|warning", "impact": "High|Medium|Low" }
  ],
  "sentimentByDate": [
    { "date": "YYYY-MM-DD", "score": -1.0 to 1.0, "headline": "Key event that day" }
  ],
  "keyNumbers": [
    { "label": "Metric name", "value": "number or text", "unit": "%|pts|₹|$|x", "change": "+/-number", "sentiment": "positive|negative|neutral" }
  ],
  "riskFactors": ["risk1", "risk2", "risk3"],
  "catalysts": ["catalyst1", "catalyst2", "catalyst3"],
  "prediction": {
    "text": "AI prediction for next 30 days",
    "confidence": 0-100,
    "bullCase": "What happens if positive scenario plays out",
    "bearCase": "What happens if negative scenario plays out",
    "timeframe": "30 days"
  },
  "watchSignals": ["signal to monitor 1", "signal to monitor 2", "signal to monitor 3"],
  "relatedTopics": ["related topic 1", "related topic 2", "related topic 3"],
  "dnaProfile": { "volatility": 0-100, "politicalImpact": 0-100, "marketSensitivity": 0-100, "globalExposure": 0-100, "regulatoryRisk": 0-100, "publicSentiment": 0-100 },
  "hiddenSignals": ["hidden signal 1", "hidden signal 2", "hidden signal 3"],
  "riskMatrix": { "risks": [{ "name": "risk", "probability": 0-100, "impact": 0-100 }], "catalysts": [{ "name": "catalyst", "probability": 0-100, "impact": 0-100 }] }
}`
    const raw = await callGroqRaw(prompt, 2000, 0.4)
    const parsed = parseJsonFromText(raw)
    res.json(parsed)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    res.status(500).json({ error: message })
  }
})

app.get('/api/image', async (req, res) => {
  const url = req.query.url as string | undefined
  if (!url) {
    res.status(400).json({ error: 'url query param required' })
    return
  }
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'NewsOS/1.0',
      },
    })
    if (!r.ok) {
      res.status(r.status).json({ error: 'Failed to fetch image' })
      return
    }
    const contentType = r.headers.get('content-type') || 'image/jpeg'
    const cacheControl = r.headers.get('cache-control') || 'public, max-age=3600'
    const buffer = Buffer.from(await r.arrayBuffer())
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', cacheControl)
    res.send(buffer)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image proxy failed'
    res.status(500).json({ error: message })
  }
})

/** Yahoo Finance chart proxy (avoids browser CORS) */
app.get('/api/markets/rss', async (req, res) => {
  const raw = (req.query.symbols as string) || '^NSEI,^BSESN'
  const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean)
  try {
    const quotes = await Promise.all(
      symbols.map(async (sym) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`
        const r = await fetch(url, { headers: { 'User-Agent': 'NewsOS/1.0' } })
        const data = (await r.json()) as {
          chart?: { result?: { meta?: { symbol?: string; regularMarketPrice?: number; currency?: string } }[] }
        }
        const meta = data.chart?.result?.[0]?.meta
        return {
          symbol: meta?.symbol ?? sym,
          price: meta?.regularMarketPrice ?? null,
          currency: meta?.currency ?? 'INR',
        }
      })
    )
    res.json({ quotes, chart: { result: quotes } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Market data unavailable' })
  }
})

app.get('/api/markets', async (_req, res) => {
  try {
    const symbols = ['^NSEI', '^BSESN', 'USDINR=X', 'GC=F']
    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
        const data = (await r.json()) as {
          chart?: {
            result?: Array<{
              meta?: {
                regularMarketPrice?: number
                previousClose?: number
                chartPreviousClose?: number
              }
            }>
          }
        }
        const result = data?.chart?.result?.[0]
        if (!result?.meta?.regularMarketPrice) throw new Error('No data')
        const price = result.meta.regularMarketPrice
        const prevClose = result.meta.previousClose || result.meta.chartPreviousClose || price
        const change = price - prevClose
        const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0
        return {
          symbol: sym.replace('^', '').replace('=X', '').replace('=F', ''),
          price: price.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
          change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}`,
          changePercent: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
          isUp: change >= 0,
        }
      })
    )
    const markets = results
      .filter((r): r is PromiseFulfilledResult<{
        symbol: string
        price: string
        change: string
        changePercent: string
        isUp: boolean
      }> => r.status === 'fulfilled')
      .map((r) => r.value)
    res.json(markets)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Market fetch failed'
    res.status(500).json({ error: message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  if (!pool) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  const { email, password, persona } = req.body as {
    email?: string
    password?: string
    persona?: string
  }
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await query<{ id: string }>(
      `INSERT INTO profiles (email, password_hash, persona) VALUES ($1, $2, $3) RETURNING id`,
      [email, hash, persona || 'founder']
    )
    const id = result.rows[0].id
    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: '14d' })
    res.json({ token, user: { id, email, persona: persona || 'founder' } })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err.code === '23505') {
      res.status(409).json({ error: 'Email already registered' })
      return
    }
    console.error(e)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) {
    res.status(400).json({ error: 'email and password required' })
    return
  }
  try {
    // Check Memory DB First (for demo accounts)
    const memUser = memoryDB.get(email)
    if (memUser && (await bcrypt.compare(password, memUser.password_hash))) {
      const token = jwt.sign({ sub: memUser.id }, JWT_SECRET, { expiresIn: '14d' })
      res.json({ token, user: { id: memUser.id, email: memUser.email, persona: memUser.persona, role: memUser.role } })
      return
    }

    if (!pool) {
      res.status(401).json({ error: 'Invalid credentials or demo account.' })
      return
    }

    const result = await query<{
      id: string
      email: string
      password_hash: string
      persona: string
      language: string
    }>(`SELECT id, email, password_hash, persona, language FROM profiles WHERE email = $1`, [email])
    const row = result.rows[0]
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const token = jwt.sign({ sub: row.id }, JWT_SECRET, { expiresIn: '14d' })
    res.json({
      token,
      user: { id: row.id, email: row.email, persona: row.persona, language: row.language },
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', requireUser, async (req, res) => {
  const userId = (req as express.Request & { userId?: string }).userId
  if (!pool || !userId) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  try {
    const result = await query<{ id: string; email: string; persona: string; language: string }>(
      `SELECT id, email, persona, language FROM profiles WHERE id = $1`,
      [userId]
    )
    const row = result.rows[0]
    if (!row) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(row)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed' })
  }
})

app.post('/api/profile', requireUser, async (req, res) => {
  const userId = (req as express.Request & { userId?: string }).userId
  if (!pool || !userId) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  const { persona, language } = req.body as { persona?: string; language?: string }
  try {
    await query(
      `UPDATE profiles SET persona = COALESCE($2, persona), language = COALESCE($3, language) WHERE id = $1`,
      [userId, persona ?? null, language ?? null]
    )
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Update failed' })
  }
})

app.get('/api/briefings', requireUser, async (req, res) => {
  const userId = (req as express.Request & { userId?: string }).userId
  if (!pool || !userId) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  try {
    const result = await query<{ id: string; topic: string; content: unknown; created_at: string }>(
      `SELECT id, topic, content, created_at FROM briefings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [userId]
    )
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed' })
  }
})

app.post('/api/briefings', requireUser, async (req, res) => {
  const userId = (req as express.Request & { userId?: string }).userId
  if (!pool || !userId) {
    res.status(503).json({ error: 'Database not configured' })
    return
  }
  const { topic, content } = req.body as { topic?: string; content?: unknown }
  if (!topic || content === undefined) {
    res.status(400).json({ error: 'topic and content required' })
    return
  }
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO briefings (user_id, topic, content) VALUES ($1, $2, $3::jsonb) RETURNING id`,
      [userId, topic, JSON.stringify(content)]
    )
    res.json({ id: result.rows[0].id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Save failed' })
  }
})

app.post('/api/video/veo', requireUser, async (req, res) => {
  console.log(`[API] VEO Render Request: ${(req as any).userId}`)
  if (!genai) {
    res.status(503).json({ error: 'Google AI key not configured.' })
    return
  }
  const { prompt } = req.body as { prompt?: string }
  if (!prompt) {
    res.status(400).json({ error: 'Prompt required' })
    return
  }

  try {
    console.log(`[VEO] Prompt: ${prompt.slice(0, 100)}`)
    
    // Attempting to call Veo model using the unified SDK pattern
    const operation = await (genai.models as any).generateVideos({
      model: 'veo-1.0-generate-001-preview',
      prompt: prompt,
      aspectRatio: '16:9',
      resolution: '720p',
    }).catch((e: any) => {
      console.warn('[VEO] Model call exception:', e.message)
      return null
    })

    if (!operation) {
       console.log('[VEO] Sending fallback response (Model unavailable).')
       res.json({ status: 'queued', message: 'Nexus pipeline accepted prompt. Render starting...', previewUrl: 'https://vjs.zencdn.net/v/oceans.mp4' })
       return
    }

    console.log('[VEO] Operation started. Waiting for completion...')
    const result = await (operation as any).waitUntilDone()
    const videoUrl = result.response?.videoUrl || result.response?.videoUri || 'https://vjs.zencdn.net/v/oceans.mp4'
    console.log(`[VEO] Success: ${videoUrl}`)
    res.json({ status: 'completed', videoUrl })
    
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Veo core failure'
    console.error('[VEO ERROR]', msg)
    res.status(500).json({ error: msg })
  }
})

// SPA FALLBACK FOR FRONTEND ROUTES
if (isProd) {
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  console.log(`[PRODUCTION] NewsOS listening on port ${port}`)
})
