/** Yahoo chart proxy via NewsOS API */
export type MarketQuote = { symbol: string; price: number | null; currency: string }

export async function fetchIndianMarkets(): Promise<{ quotes: MarketQuote[] }> {
  const r = await fetch('/api/markets/rss?symbols=^NSEI,^BSESN')
  if (!r.ok) throw new Error('Market data failed')
  return r.json() as Promise<{ quotes: MarketQuote[] }>
}
