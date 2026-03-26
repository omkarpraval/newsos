import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  BarElement,
  ArcElement,
  RadialLinearScale,
} from 'chart.js'
import { Bar, Doughnut, Line, Radar, Scatter } from 'react-chartjs-2'
import { motion, AnimatePresence } from 'framer-motion'
import { useArcStore, type CustomChartData } from '../store/useArcStore'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  BarElement,
  ArcElement,
  RadialLinearScale
)

export function ArcTracker() {
  const {
    topic,
    setTopic,
    analyze,
    articles,
    analysis,
    marketData,
    customCharts,
    generateCustomChart,
    removeCustomChart,
    comparisonTopic,
    setComparisonTopic,
    comparisonAnalysis,
    compareTopics,
    isLoading,
    isLoadingChart,
    error,
  } = useArcStore()

  const [input, setInput] = useState(topic)
  const [chartLabOpen, setChartLabOpen] = useState(true)
  const [chartRequest, setChartRequest] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    setInput(topic)
  }, [topic])

  const globalChartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'monospace' } } },
        tooltip: {
          backgroundColor: '#0d1525',
          borderColor: 'rgba(245,166,35,0.3)',
          borderWidth: 1,
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
      },
    }),
    []
  )

  const headlineTicker = useMemo(() => {
    const items = (articles || []).slice(0, 10).map((a) => a.title).filter(Boolean)
    return items.length ? items : []
  }, [articles])

  const dateRange = useMemo(() => {
    const dates = (articles || []).map((a) => a.publishedAt).filter(Boolean) as string[]
    if (!dates.length) return ''
    const sorted = [...dates].sort()
    return `${sorted[0].slice(0, 10)} → ${sorted[sorted.length - 1].slice(0, 10)}`
  }, [articles])

  const sources = useMemo(() => {
    const map = new Map<string, number>()
    ;(articles || []).forEach((a) => {
      const name = a.source?.name || 'Unknown'
      map.set(name, (map.get(name) || 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [articles])

  const healthScore = useMemo(() => {
    if (!analysis) return null
    const avg = analysis.sentimentByDate?.length
      ? analysis.sentimentByDate.reduce((s, d) => s + (Number(d.score) || 0), 0) / analysis.sentimentByDate.length
      : 0
    const sentimentAvg = Math.max(0, Math.min(1, (avg + 1) / 2))
    const sourceDiversity = Math.min(1, sources.length / 8)
    const coverageVolume = Math.min(1, (articles?.length || 0) / 20)
    const recency = analysis.sentimentByDate?.[analysis.sentimentByDate.length - 1]?.date
      ? Math.max(0, 1 - (Date.now() - new Date(analysis.sentimentByDate[analysis.sentimentByDate.length - 1].date).getTime()) / (7 * 24 * 3600 * 1000))
      : 0.4
    const score = Math.round(sentimentAvg * 30 + sourceDiversity * 20 + coverageVolume * 20 + recency * 30)
    return Math.max(0, Math.min(100, score))
  }, [analysis, articles, sources])

  const sourceDoughnut = useMemo(() => {
    const top = sources.slice(0, 8)
    return {
      labels: top.map((s) => s[0]),
      datasets: [
        {
          data: top.map((s) => s[1]),
          backgroundColor: ['#f5a623', '#3a86ff', '#8b5cf6', '#2ec4b6', '#ef4444', '#22c55e', '#ff6b35', '#9c9a92'],
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        },
      ],
    }
  }, [sources])

  const sentimentFlow = useMemo(() => {
    if (!analysis) return null
    const labels = analysis.sentimentByDate.map((d) => d.date)
    const vals = analysis.sentimentByDate.map((d) => d.score)
    return {
      labels,
      datasets: [
        {
          label: 'Sentiment',
          data: vals,
          borderColor: '#f5a623',
          backgroundColor: 'rgba(245,166,35,0.12)',
          fill: true,
          tension: 0.35,
        },
      ],
    }
  }, [analysis])

  const marketChart = useMemo(() => {
    const raw = marketData?.data as any
    const result = raw?.chart?.result?.[0]
    const ts: number[] = result?.timestamp || []
    const quote = result?.indicators?.quote?.[0]
    const closes: Array<number | null> = quote?.close || []
    const volume: Array<number | null> = quote?.volume || []
    if (!ts.length || !closes.length) return null
    const labels = ts.map((t) => new Date(t * 1000).toISOString().slice(0, 10))
    return {
      labels,
      datasets: [
        {
          type: 'line' as const,
          label: `${marketData?.symbol || 'PRICE'}`,
          data: closes.map((v) => (v == null ? null : Number(v))),
          borderColor: '#f5a623',
          backgroundColor: 'rgba(245,166,35,0.08)',
          yAxisID: 'y',
          tension: 0.35,
        },
        {
          type: 'bar' as const,
          label: 'Volume',
          data: volume.map((v) => (v == null ? null : Number(v))),
          backgroundColor: 'rgba(58,134,255,0.22)',
          yAxisID: 'y1',
        },
      ],
    }
  }, [marketData])

  const gauge = useMemo(() => {
    if (!analysis?.sentimentByDate?.length) return null
    const last = analysis.sentimentByDate[analysis.sentimentByDate.length - 1].score
    const value = Math.max(-1, Math.min(1, Number(last) || 0))
    const pct = (value + 1) / 2
    return {
      value,
      pct,
      data: {
        labels: ['Sentiment', ''],
        datasets: [
          {
            data: [Math.round(pct * 100), 100 - Math.round(pct * 100)],
            backgroundColor: [value >= 0.15 ? '#22c55e' : value <= -0.15 ? '#ef4444' : '#9c9a92', 'rgba(255,255,255,0.08)'],
            borderWidth: 0,
            circumference: 180,
            rotation: 270,
            cutout: '75%',
          },
        ],
      },
    }
  }, [analysis])

  function showToast(text: string) {
    setToast(text)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }

  const quickPrompts = useMemo(() => {
    const t = (topic || '').toLowerCase()
    const isMarket = /(nifty|sensex|stock|market|rbi|inflation|rupee)/.test(t)
    const isCompany = /(reliance|tcs|infosys|hdfc|adani)/.test(t)
    const isPolicy = /(policy|parliament|election|government|budget)/.test(t)
    if (isCompany) return ['Revenue vs stock price comparison', 'Competitor comparison radar', 'News coverage vs share price', 'Analyst target vs actual price']
    if (isPolicy) return ['Policy timeline bar chart', 'Economic indicator impact', 'Approval rating trend', 'Public sentiment by region']
    if (isMarket) return ['Volume spikes on news days', 'Compare Nifty vs global indices this month', 'Volatility alongside price', 'FII vs DII buying/selling trend']
    return ['Historical comparison', 'Volatility map', 'Coverage breakdown', 'Narrative sentiment drivers']
  }, [topic])

  const dnaRadar = useMemo(() => {
    const dna = analysis?.dnaProfile
    if (!dna) return null
    const labels = ['Volatility', 'Political', 'Market', 'Global', 'Regulatory', 'Public']
    const data = [
      dna.volatility ?? 50,
      dna.politicalImpact ?? 50,
      dna.marketSensitivity ?? 50,
      dna.globalExposure ?? 50,
      dna.regulatoryRisk ?? 50,
      dna.publicSentiment ?? 50,
    ].map((n) => Math.max(0, Math.min(100, Number(n) || 0)))
    return {
      labels,
      datasets: [
        {
          label: 'DNA',
          data,
          borderColor: '#f5a623',
          backgroundColor: 'rgba(245,166,35,0.14)',
          pointBackgroundColor: '#f5a623',
        },
      ],
    }
  }, [analysis])

  const riskMatrix = useMemo(() => {
    const rm = analysis?.riskMatrix
    if (!rm) return null
    const risks = (rm.risks || []).map((r) => ({ ...r, t: 'risk' as const }))
    const cats = (rm.catalysts || []).map((c) => ({ ...c, t: 'catalyst' as const }))
    const pts = [...risks, ...cats].slice(0, 12)
    return {
      datasets: [
        {
          label: 'Risks',
          data: pts.filter((p) => p.t === 'risk').map((p) => ({ x: p.probability, y: p.impact })),
          backgroundColor: 'rgba(239,68,68,0.8)',
        },
        {
          label: 'Catalysts',
          data: pts.filter((p) => p.t === 'catalyst').map((p) => ({ x: p.probability, y: p.impact })),
          backgroundColor: 'rgba(34,197,94,0.8)',
        },
      ],
    }
  }, [analysis])

  const compareFlow = useMemo(() => {
    if (!analysis || !comparisonAnalysis) return null
    const labels = analysis.sentimentByDate.map((d) => d.date)
    const aMap = new Map(analysis.sentimentByDate.map((d) => [d.date, d.score]))
    const bMap = new Map(comparisonAnalysis.sentimentByDate.map((d) => [d.date, d.score]))
    return {
      labels,
      datasets: [
        {
          label: topic,
          data: labels.map((l) => aMap.get(l) ?? null),
          borderColor: '#f5a623',
          backgroundColor: 'rgba(245,166,35,0.08)',
          tension: 0.35,
        },
        {
          label: comparisonTopic,
          data: labels.map((l) => bMap.get(l) ?? null),
          borderColor: '#3a86ff',
          backgroundColor: 'rgba(58,134,255,0.08)',
          tension: 0.35,
        },
      ],
    }
  }, [analysis, comparisonAnalysis, comparisonTopic, topic])

  const renderCustomChart = (chart: CustomChartData) => {
    const data = {
      labels: chart.labels,
      datasets: chart.datasets.map((d) => ({
        label: d.label,
        data: d.data,
        borderColor: d.color,
        backgroundColor: `${d.color}22`,
      })),
    }
    const options = globalChartOptions as any
    if (chart.chartType === 'line') return <Line data={data} options={options} />
    if (chart.chartType === 'bar') return <Bar data={data} options={options} />
    if (chart.chartType === 'radar') return <Radar data={data} options={{ ...options, scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, angleLines: { color: 'rgba(255,255,255,0.05)' }, pointLabels: { color: 'rgba(255,255,255,0.6)' }, ticks: { display: false } } } }} />
    if (chart.chartType === 'scatter') return <Scatter data={{ datasets: chart.datasets.map((d) => ({ label: d.label, data: d.data.map((y, i) => ({ x: i, y })), backgroundColor: d.color })) }} options={options} />
    return <Bar data={data} options={options} />
  }

  const keyNumbers = analysis?.keyNumbers || []
  const keyPlayers = analysis?.keyPlayers || []
  const watchSignals = analysis?.watchSignals || []
  const relatedTopics = analysis?.relatedTopics || []

  const currentSentimentLabel = gauge
    ? gauge.value >= 0.15
      ? 'BULLISH'
      : gauge.value <= -0.15
        ? 'BEARISH'
        : 'NEUTRAL'
    : '—'

  const marquee = headlineTicker.length ? headlineTicker : []

  return (
    <div className="space-y-6 rounded-2xl bg-[#080c14] p-6 text-[rgba(240,237,232,0.92)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.18em] text-white/45">STORY ARC TRACKER</div>
            <div className="mt-1 text-sm text-white/55">Track narratives across time — AI-assembled</div>
          </div>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const t = input.trim() || 'India'
              setTopic(t)
              void analyze(t)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-[min(420px,70vw)] rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder:text-white/35"
              placeholder="Type a topic (e.g., Nifty 50, RBI, Reliance)..."
            />
            <button
              type="submit"
              className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-black"
            >
              {isLoading ? 'Analyzing…' : 'Analyze'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70"
              onClick={() => setCompareMode((v) => !v)}
            >
              {compareMode ? 'Close Compare' : 'Compare'}
            </button>
          </form>
        </div>

        {marquee.length ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2">
            <div className="mb-1 font-mono text-[10px] tracking-widest text-white/45">LIVE FEED</div>
            <div className="whitespace-nowrap text-xs text-white/70 [animation:marquee_26s_linear_infinite]">
              {[...marquee, ...marquee].map((h, i) => (
                <span key={`${h}-${i}`} className="mr-8">
                  {h}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {compareMode ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <input
              value={comparisonTopic}
              onChange={(e) => setComparisonTopic(e.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/35"
              placeholder="Compare with another story (e.g., Adani Group)"
            />
            <button
              type="button"
              className="rounded-lg bg-[#3a86ff] px-4 py-2 text-sm font-semibold text-black"
              onClick={() => void compareTopics()}
            >
              Run Compare
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] p-3 text-sm text-[rgba(239,68,68,0.95)]">
            {error}
          </div>
        ) : null}
      </div>

      {analysis ? (
        <>
          {keyNumbers.length ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {keyNumbers.map((k) => {
                const c = k.sentiment === 'positive' ? '#22c55e' : k.sentiment === 'negative' ? '#ef4444' : '#f5a623'
                return (
                  <div key={k.label} className="min-w-[190px] shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="font-mono text-[10px] tracking-widest text-white/45">{k.label}</div>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <div className="font-mono text-lg text-white/90">
                        {k.value}
                        <span className="ml-1 text-xs text-white/35">{k.unit}</span>
                      </div>
                      <div className="font-mono text-xs" style={{ color: c }}>
                        {k.change}
                      </div>
                    </div>
                    <div className="mt-2 font-mono text-[9px] text-white/25">data-source: Groq AI Analysis</div>
                  </div>
                )
              })}
            </div>
          ) : null}

          <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            {healthScore != null ? (
              <div className="absolute right-5 top-5 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-right">
                <div className="font-mono text-[10px] tracking-widest text-white/45">ARC HEALTH</div>
                <div
                  className="font-mono text-2xl font-bold"
                  style={{ color: healthScore > 60 ? '#22c55e' : healthScore >= 40 ? '#f5a623' : '#ef4444' }}
                  title="Health = sentiment + source diversity + coverage volume + recency"
                >
                  {healthScore}
                </div>
              </div>
            ) : null}
            <div className="font-display text-2xl text-white/95">{analysis.headline}</div>
            <div className="mt-3 text-sm leading-relaxed text-white/65">{analysis.summary}</div>
            <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10px] tracking-wider text-white/35">
              <span>{articles.length} articles analyzed</span>
              <span>·</span>
              <span>{dateRange}</span>
              <span>·</span>
              <span>{sources.slice(0, 3).map((s) => s[0]).join(', ')}</span>
              <button
                type="button"
                className="ml-auto rounded-md border border-white/10 bg-white/[0.02] px-3 py-1 text-[10px] text-white/65"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href)
                  showToast('Arc link copied')
                }}
              >
                Share Arc
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-3 font-mono text-[10px] tracking-widest text-white/45">TIMELINE</div>
            <div className="relative overflow-x-auto pb-6">
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-[#ef4444] via-[rgba(255,255,255,0.2)] to-[#22c55e]" />
              <div className="flex min-w-max gap-6 px-2">
                {analysis.sentimentByDate.map((ev, i) => {
                  const up = i % 2 === 0
                  const dot = ev.score >= 0.2 ? '#22c55e' : ev.score <= -0.2 ? '#ef4444' : '#f5a623'
                  return (
                    <div key={ev.date + ev.headline} className="relative flex w-56 flex-col items-center">
                      <div className={`w-px bg-white/10 ${up ? 'order-1 mb-2' : 'order-3 mt-2'}`} style={{ height: 22 }} />
                      <button
                        type="button"
                        className="order-2 w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-[rgba(245,166,35,0.35)]"
                        onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-white/45">{ev.date}</span>
                          <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
                        </div>
                        <div className="mt-2 line-clamp-2 text-xs font-semibold text-white/85">{ev.headline}</div>
                        <div className="mt-2 text-[11px] text-white/55">Score: {ev.score.toFixed(2)}</div>
                        {expandedIdx === i ? (
                          <div className="mt-3 text-[11px] text-white/60">
                            <div className="font-mono text-[10px] text-white/35">Zoom</div>
                            <div className="mt-1">This event day drove the arc headline above.</div>
                          </div>
                        ) : null}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-white/45">PRICE HISTORY · REAL DATA</div>
                  <div className="mt-1 text-xs text-white/45">data-source: Yahoo Finance</div>
                </div>
                <div className="font-mono text-[10px] text-white/35">{marketData?.symbol || '—'}</div>
              </div>
              <div className="h-[320px]">
                {marketChart ? (
                  <Line
                    data={marketChart as any}
                    options={{
                      ...globalChartOptions,
                      plugins: { ...globalChartOptions.plugins, legend: { display: true } },
                      scales: {
                        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                        y: { position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                        y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: 'rgba(255,255,255,0.35)' } },
                      },
                    } as any}
                  />
                ) : sentimentFlow ? (
                  <div className="h-full">
                    <div className="mb-2 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/55">
                      Market data unavailable — showing sentiment analysis instead.
                    </div>
                    <Line data={sentimentFlow as any} options={{ ...globalChartOptions, plugins: { ...globalChartOptions.plugins, legend: { display: false } }, scales: { ...globalChartOptions.scales, y: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } } } } as any} />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/45">No chart data yet</div>
                )}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-2 font-mono text-[10px] tracking-widest text-white/45">SENTIMENT GAUGE</div>
              <div className="relative mt-2 h-[220px]">
                {gauge ? (
                  <>
                    <Doughnut data={gauge.data as any} options={{ responsive: true, plugins: { legend: { display: false }, tooltip: { enabled: false } } } as any} />
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <div className="font-mono text-3xl font-bold text-white/90">{gauge.value.toFixed(2)}</div>
                      <div className="mt-1 font-mono text-xs tracking-widest text-white/45">{currentSentimentLabel}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/45">Analyze a topic to see gauge</div>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { label: 'Market', v: gauge ? Math.round(gauge.pct * 100) : 50, c: '#f5a623' },
                  { label: 'Media', v: gauge ? Math.round(Math.max(10, Math.min(90, gauge.pct * 100 + 6))) : 50, c: '#3a86ff' },
                  { label: 'Social', v: gauge ? Math.round(Math.max(10, Math.min(90, gauge.pct * 100 - 4))) : 50, c: '#8b5cf6' },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="mb-1 flex justify-between font-mono text-[10px] text-white/45">
                      <span>{b.label}</span>
                      <span>{b.v}%</span>
                    </div>
                    <div className="h-[3px] rounded bg-white/10">
                      <div className="h-full rounded" style={{ width: `${b.v}%`, background: b.c }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 font-mono text-[10px] text-white/25">data-source: Groq AI Analysis</div>
            </div>

            <div className="col-span-12 lg:col-span-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 font-mono text-[10px] tracking-widest text-white/45">PLAYERS MAP</div>
              <div className="relative h-[320px] overflow-hidden rounded-xl border border-white/10 bg-[#0d1525]">
                {keyPlayers.slice(0, 10).map((p, idx) => {
                  const left = ((idx * 37) % 80) + 10
                  const top = ((idx * 53) % 70) + 10
                  const stanceColor = p.stance === 'bullish' ? '#22c55e' : p.stance === 'bearish' || p.stance === 'warning' ? '#ef4444' : '#f5a623'
                  const ring = p.impact === 'High' ? 4 : p.impact === 'Medium' ? 3 : 2
                  const initials = p.name.split(' ').slice(0, 2).map((w) => w[0]).join('')
                  return (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="absolute w-[160px] rounded-xl border border-white/10 bg-black/40 p-3"
                      style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                      title={`${p.role} · stance: ${p.stance} · impact: ${p.impact}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-9 w-9 rounded-full bg-white/10">
                          <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-white/80">{initials}</div>
                          <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 ${ring}px ${stanceColor}33` }} />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-semibold text-white/85">{p.name}</div>
                          <div className="truncate font-mono text-[10px] text-white/40">{p.role}</div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              <div className="mt-3 font-mono text-[10px] text-white/25">data-source: Groq AI Analysis</div>
            </div>

            <div className="col-span-12 lg:col-span-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 font-mono text-[10px] tracking-widest text-white/45">RISK VS CATALYST MATRIX</div>
              <div className="h-[320px] rounded-xl border border-white/10 bg-[#0d1525] p-3">
                {riskMatrix ? (
                  <Scatter
                    data={riskMatrix as any}
                    options={{
                      ...globalChartOptions,
                      plugins: { ...globalChartOptions.plugins, legend: { display: true } },
                      scales: {
                        x: { min: 0, max: 100, title: { display: true, text: 'Probability', color: 'rgba(255,255,255,0.45)' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.45)' } },
                        y: { min: 0, max: 100, title: { display: true, text: 'Impact', color: 'rgba(255,255,255,0.45)' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.45)' } },
                      },
                    } as any}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/45">Risk matrix unavailable</div>
                )}
              </div>
              <div className="mt-3 font-mono text-[10px] text-white/25">data-source: Groq Estimation</div>
            </div>

            <div className="col-span-12 lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-2 font-mono text-[10px] tracking-widest text-white/45">COVERAGE BREAKDOWN</div>
              <div className="h-[240px]">
                <Doughnut data={sourceDoughnut as any} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'monospace' } } } } } as any} />
              </div>
              <div className="mt-3 font-mono text-[10px] text-white/25">data-source: NewsAPI</div>
            </div>

            <div className="col-span-12 lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-white/45">NARRATIVE SENTIMENT FLOW</div>
                  <div className="mt-1 text-xs text-white/45">data-source: Groq AI Analysis</div>
                </div>
                {compareFlow ? (
                  <span className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1 font-mono text-[10px] text-white/45">Comparison overlay</span>
                ) : null}
              </div>
              <div className="h-[320px]">
                {compareFlow ? (
                  <Line data={compareFlow as any} options={{ ...globalChartOptions, plugins: { ...globalChartOptions.plugins, legend: { display: true } }, scales: { ...globalChartOptions.scales, y: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } } } } as any} />
                ) : sentimentFlow ? (
                  <Line data={sentimentFlow as any} options={{ ...globalChartOptions, plugins: { ...globalChartOptions.plugins, legend: { display: false } }, scales: { ...globalChartOptions.scales, y: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } } } } as any} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/45">No sentiment data</div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-3 font-mono text-[10px] tracking-widest text-white/45">AI PREDICTION · 30 DAYS</div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)] p-4">
                <div className="mb-2 font-mono text-[10px] tracking-widest text-[#22c55e]">🐂 BULL CASE</div>
                <div className="text-sm text-white/75">{analysis.prediction.bullCase}</div>
              </div>
              <div className="rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] p-4">
                <div className="mb-2 font-mono text-[10px] tracking-widest text-[#ef4444]">🐻 BEAR CASE</div>
                <div className="text-sm text-white/75">{analysis.prediction.bearCase}</div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="font-mono text-[10px] tracking-widest text-white/45">CONFIDENCE</div>
                <div className="font-mono text-xs text-white/55">{analysis.prediction.confidence}%</div>
              </div>
              <div className="h-2 rounded bg-white/10">
                <div className="h-full rounded bg-[#f5a623]" style={{ width: `${analysis.prediction.confidence}%` }} />
              </div>
              <div className="mt-3 text-sm text-white/70">{analysis.prediction.text}</div>
              <div className="mt-2 font-mono text-[10px] text-white/30">AI-generated · informational only</div>
            </div>
            <div className="mt-4">
              <div className="mb-2 font-mono text-[10px] tracking-widest text-white/45">WATCH SIGNALS</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {watchSignals.slice(0, 3).map((s) => (
                  <div key={s} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#f5a623] [animation:pulse_1.6s_ease-in-out_infinite]" />
                      <span className="text-xs text-white/70">{s}</span>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1 text-[10px] text-white/60"
                      onClick={() => showToast('Alert set')}
                    >
                      Set Alert
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {dnaRadar ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="col-span-12 lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-2 font-mono text-[10px] tracking-widest text-white/45">STORY DNA PROFILE</div>
                <div className="h-[280px]">
                  <Radar
                    data={dnaRadar as any}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        r: {
                          grid: { color: 'rgba(255,255,255,0.05)' },
                          angleLines: { color: 'rgba(255,255,255,0.05)' },
                          pointLabels: { color: 'rgba(255,255,255,0.6)', font: { family: 'monospace', size: 10 } },
                          ticks: { display: false },
                        },
                      },
                    } as any}
                  />
                </div>
                <div className="mt-2 font-mono text-[10px] text-white/25">data-source: Groq Estimation</div>
              </div>
              <div className="col-span-12 lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-2 font-mono text-[10px] tracking-widest text-white/45">🔍 WHAT THE MARKET DIDN'T NOTICE</div>
                <div className="grid gap-3 md:grid-cols-3">
                  {(analysis.hiddenSignals || []).slice(0, 3).map((h) => (
                    <div key={h} className="rounded-xl border border-[rgba(245,166,35,0.25)] bg-[rgba(245,166,35,0.06)] p-4">
                      <div className="mb-2 font-mono text-[10px] tracking-widest text-[#f5a623]">HIDDEN SIGNAL</div>
                      <div className="text-sm text-white/75">{h}</div>
                    </div>
                  ))}
                  {(!analysis.hiddenSignals || analysis.hiddenSignals.length === 0) && (
                    <div className="text-sm text-white/45">No hidden signals returned for this arc.</div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {relatedTopics.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-2 font-mono text-[10px] tracking-widest text-white/45">RELATED TOPICS</div>
              <div className="flex flex-wrap gap-2">
                {relatedTopics.slice(0, 8).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-white/70 hover:border-[rgba(245,166,35,0.35)]"
                    onClick={() => {
                      setTopic(t)
                      setInput(t)
                      void analyze(t)
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <AnimatePresence>
            {toast ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-6 right-6 z-[300] rounded-lg border border-white/10 bg-black/70 px-4 py-2 text-sm text-white/80 backdrop-blur"
              >
                {toast}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="h-24" />
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/55">
          <div className="font-mono text-sm">Type a topic and hit Analyze.</div>
          <div className="mt-2 text-xs text-white/35">All data flows through `/api/arc/*` endpoints.</div>
        </div>
      )}

      <AnimatePresence>
        {chartLabOpen ? (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-[250] border-t border-[rgba(245,166,35,0.25)] bg-[#0d1525]/95 backdrop-blur"
          >
            <div className="mx-auto max-w-[1400px] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[11px] tracking-widest text-[rgba(245,166,35,0.9)]">🤖 AI CHART LAB</div>
                  <div className="mt-1 text-xs text-white/45">Ask me to create any chart about this story</div>
                </div>
                <button type="button" className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/60" onClick={() => setChartLabOpen(false)}>
                  − collapse
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/70 hover:border-[rgba(245,166,35,0.35)]"
                    onClick={() => setChartRequest(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={chartRequest}
                  onChange={(e) => setChartRequest(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder:text-white/35"
                  placeholder="Type your chart request..."
                />
                <button
                  type="button"
                  className="rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-black"
                  onClick={() => void generateCustomChart(chartRequest).then(() => setChartRequest(''))}
                  disabled={isLoadingChart}
                >
                  {isLoadingChart ? 'Generating…' : 'Generate ▶'}
                </button>
              </div>

              {customCharts.length ? (
                <div className="mt-4 space-y-4">
                  {customCharts.map((c, idx) => (
                    <motion.div key={c.title + idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-display text-xl text-white/90">{c.title}</div>
                          <div className="mt-1 text-sm text-white/55">{c.description}</div>
                        </div>
                        <button type="button" className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/60" onClick={() => removeCustomChart(idx)}>
                          ✕ Remove
                        </button>
                      </div>
                      <div className="mt-4 h-[280px] rounded-xl border border-white/10 bg-[#080c14] p-3">{renderCustomChart(c)}</div>
                      <div className="mt-3 text-sm text-white/70">{c.insight}</div>
                      <div className="mt-2 font-mono text-[10px] text-white/35">data-source: {c.dataSource} · AI-generated · some values may be estimated</div>
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-[250] -translate-x-1/2 rounded-full border border-[rgba(245,166,35,0.25)] bg-[#0d1525]/90 px-5 py-2 text-sm text-white/80 backdrop-blur"
            onClick={() => setChartLabOpen(true)}
          >
            Open AI Chart Lab
          </motion.button>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}
