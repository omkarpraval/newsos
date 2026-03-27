/**
 * Mock article data for demo/fallback when NewsAPI rate limit is hit.
 * These are realistic Indian business news articles for the PS demo.
 */

import type { NewsArticle } from '../types'

export const MOCK_BUDGET_ARTICLES: NewsArticle[] = [
  {
    title: "Union Budget 2025: FM Nirmala Sitharaman raises income tax exemption limit to ₹12 lakh",
    description: "Finance Minister Nirmala Sitharaman announced a significant revision in the income tax slabs under the new tax regime, raising the exemption threshold to ₹12 lakh from ₹7 lakh, providing relief to the middle class.",
    content: "In the Union Budget 2025-26, Finance Minister Nirmala Sitharaman raised the income tax exemption limit under the new tax regime to ₹12 lakh from ₹7 lakh. The new tax slabs are: 0-4 lakh: Nil, 4-8 lakh: 5%, 8-12 lakh: 10%, 12-16 lakh: 15%, 16-20 lakh: 20%, 20-24 lakh: 25%, above 24 lakh: 30%. This is expected to benefit approximately 1 crore taxpayers and result in revenue foregone of ₹1 lakh crore.",
    url: "https://economictimes.indiatimes.com/budget-2025-tax",
    urlToImage: "https://picsum.photos/800/400?random=1",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Economic Times" },
  },
  {
    title: "Budget 2025: IT sector gets boost with ₹15,000 crore AI Mission allocation",
    description: "The government announced the India AI Mission with ₹15,000 crore allocation over 5 years, focusing on compute infrastructure, AI research centres, and skilling programs to make India a global AI hub.",
    content: "The Union Budget 2025-26 announced the India AI Mission with a corpus of ₹15,000 crore over five years. The mission will set up AI centres of excellence in IITs, build GPU compute capacity of 10,000 GPUs through public-private partnership, and train 5 lakh AI professionals. IT stocks rallied 3-5% on the announcement, with Infosys up 4.2%, TCS up 3.1%, and Wipro up 5.8%.",
    url: "https://economictimes.indiatimes.com/budget-2025-ai",
    urlToImage: "https://picsum.photos/800/400?random=2",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Mint" },
  },
  {
    title: "Sensex surges 1,200 points after Budget 2025 tax relief announcement",
    description: "Indian stock markets rallied sharply with Sensex closing 1,200 points higher at 78,500 and Nifty gaining 380 points, driven by the massive income tax relief and capital expenditure push.",
    content: "BSE Sensex surged 1,200 points to close at 78,500 while Nifty50 gained 380 points to settle at 23,750 on Budget day. FIIs turned net buyers with ₹4,500 crore inflows. Banking stocks led the rally with Bank Nifty up 2.8%. Market experts noted the consumption boost from tax cuts would benefit FMCG and auto sectors significantly.",
    url: "https://economictimes.indiatimes.com/budget-2025-markets",
    urlToImage: "https://picsum.photos/800/400?random=3",
    publishedAt: new Date(Date.now() - 5400000).toISOString(),
    source: { name: "NDTV Profit" },
  },
  {
    title: "Budget 2025: Experts divided on fiscal deficit target of 4.4% for FY26",
    description: "Economists have mixed views on the government's fiscal deficit target of 4.4% of GDP for FY26, with some calling it ambitious given the revenue foregone from tax cuts, while others praise the capex push.",
    content: "The government set a fiscal deficit target of 4.4% for FY26, down from 4.8% in FY25. Raghuram Rajan cautioned that the tax cuts could strain fiscal math, while Arvind Subramanian praised the balanced approach. Goldman Sachs maintained India's GDP growth forecast at 6.5%, noting the consumption stimulus from tax cuts would offset fiscal concerns. HSBC called it a 'growth-oriented budget' that balances populism with fiscal prudence.",
    url: "https://economictimes.indiatimes.com/budget-2025-experts",
    urlToImage: "https://picsum.photos/800/400?random=4",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Business Standard" },
  },
  {
    title: "Budget Impact: Defence sector allocated record ₹6.81 lakh crore, HAL and BEL stocks jump",
    description: "The defence budget saw a 9.5% increase to ₹6.81 lakh crore with focus on indigenisation and 'Make in India' defence production, sending HAL up 7% and BEL up 5.2%.",
    content: "Defence allocation in Budget 2025-26 rose 9.5% to ₹6.81 lakh crore, with capital expenditure for new weapons and platforms at ₹1.80 lakh crore. The FM emphasized 'Atmanirbhar Defence' with 75% domestic procurement target. HAL shares surged 7% to ₹4,200, BEL jumped 5.2%, and defence ETFs saw record inflows of ₹800 crore in a single session.",
    url: "https://economictimes.indiatimes.com/budget-2025-defence",
    urlToImage: "https://picsum.photos/800/400?random=5",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: "India Today Business" },
  },
  {
    title: "Union Budget 2025: Agriculture gets ₹1.52 lakh crore, PM Kisan raised to ₹8,000",
    description: "Agriculture allocation rose 12% to ₹1.52 lakh crore with PM Kisan annual payment increased from ₹6,000 to ₹8,000 per farmer family, benefiting 9.5 crore farmers.",
    content: "The agriculture sector received ₹1.52 lakh crore in Budget 2025-26, a 12% increase. PM Kisan payment was raised from ₹6,000 to ₹8,000 annually. MSP for paddy was increased by ₹150 to ₹2,450 per quintal. A new ₹5,000 crore fund was announced for millets, organic farming, and farm-to-fork supply chains. Rural consumption stocks like ITC and Dabur rose 3-4%.",
    url: "https://economictimes.indiatimes.com/budget-2025-agri",
    urlToImage: "https://picsum.photos/800/400?random=6",
    publishedAt: new Date(Date.now() - 16200000).toISOString(),
    source: { name: "Financial Express" },
  },
  {
    title: "Budget 2025 vs Budget 2024: A historical comparison of tax reforms and capex push",
    description: "Comparing Budget 2025 with previous budgets shows a clear shift from corporate tax cuts to personal income tax relief, with capex allocation rising from ₹7.5 lakh crore to ₹11.2 lakh crore in two years.",
    content: "Budget 2025 marks a significant pivot. While Budget 2023 focused on infrastructure, and Budget 2024 on fiscal consolidation, Budget 2025 prioritizes consumption via tax cuts. Capex allocation rose to ₹11.2 lakh crore (3.4% of GDP), up from ₹7.5 lakh crore in FY24. Personal tax revenue foregone of ₹1 lakh crore is the largest ever. Historically, no Indian budget has cut personal tax rates so aggressively since 2005.",
    url: "https://economictimes.indiatimes.com/budget-2025-comparison",
    urlToImage: "https://picsum.photos/800/400?random=7",
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    source: { name: "Outlook Business" },
  },
  {
    title: "Auto sector cheers Budget 2025 as EV policy gets ₹10,000 crore push",
    description: "The EV sector received a comprehensive policy package with ₹10,000 crore allocation, GST reduction on EVs to 5%, and charging infrastructure expansion target of 50,000 stations by 2027.",
    content: "The Union Budget 2025-26 gave a massive boost to the EV sector. GST on EVs reduced from 12% to 5%. FAME-III scheme launched with ₹10,000 crore corpus. Target of 50,000 public charging stations by 2027. Tata Motors surged 6.5%, M&M gained 4.8%, and Ola Electric rose 12% intraday. Industry body SIAM called it a transformative budget for auto sector.",
    url: "https://economictimes.indiatimes.com/budget-2025-ev",
    urlToImage: "https://picsum.photos/800/400?random=8",
    publishedAt: new Date(Date.now() - 19800000).toISOString(),
    source: { name: "ET Auto" },
  },
  {
    title: "Real estate sector gets infrastructure status in Budget 2025, Realty index up 4%",
    description: "FM declared housing and real estate as infrastructure sector, enabling cheaper loans, tax benefits, and REITs expansion. Nifty Realty Index jumped 4.2% led by DLF and Godrej Properties.",
    content: "In a landmark move, the Union Budget 2025-26 granted infrastructure status to the housing and real estate sector. This enables developers to access cheaper institutional loans, longer-tenure bonds, and ECB funding. REITs regulation was simplified. DLF surged 5.5%, Godrej Properties gained 4.8%, Prestige Estates up 6.2%. A ₹25,000 crore urban housing fund was announced for metro cities.",
    url: "https://economictimes.indiatimes.com/budget-2025-realty",
    urlToImage: "https://picsum.photos/800/400?random=9",
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    source: { name: "Moneycontrol" },
  },
  {
    title: "RBI Governor lauds Budget 2025, signals rate cut on improved growth outlook",
    description: "RBI Governor Sanjay Malhotra praised the budget's growth orientation and hinted at a potential 25 bps rate cut in April policy, citing improved consumption outlook from tax relief measures.",
    content: "RBI Governor Sanjay Malhotra called the Union Budget 2025-26 'growth supportive' and indicated the monetary policy committee would consider the budget's consumption stimulus in its April 2025 review. Bond yields fell 8 bps to 6.62% on the signal. Markets are now pricing in a 75% probability of a 25 bps rate cut in April. The 10-year benchmark bond rallied for the third session.",
    url: "https://economictimes.indiatimes.com/budget-2025-rbi",
    urlToImage: "https://picsum.photos/800/400?random=10",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: "Reuters India" },
  },
  {
    title: "FPIs pump ₹8,500 crore into Indian markets post-Budget, biggest single-day inflow in 6 months",
    description: "Foreign portfolio investors turned aggressive buyers post-Budget, pumping in ₹8,500 crore into Indian equities and debt combined, the highest single-day inflow since August 2024.",
    content: "FPIs turned net buyers with ₹4,500 crore in equities and ₹4,000 crore in debt markets on Budget day. Morgan Stanley upgraded India to 'Overweight' from 'Equal-weight', citing consumption boost from tax cuts. Goldman Sachs raised Nifty target to 26,000 for December 2025. DII buying also remained strong at ₹3,200 crore. Total market turnover crossed ₹4 lakh crore.",
    url: "https://economictimes.indiatimes.com/budget-2025-fpi",
    urlToImage: "https://picsum.photos/800/400?random=11",
    publishedAt: new Date(Date.now() - 12600000).toISOString(),
    source: { name: "Bloomberg Quint" },
  },
  {
    title: "Pharma sector wins big in Budget 2025 with ₹7,500 crore for healthcare and bulk drug parks",
    description: "Healthcare allocation rose 20% with focus on bulk drug manufacturing parks, medical device PLI scheme expansion, and ₹2,000 crore for digital health infrastructure under Ayushman Bharat.",
    content: "The pharma and healthcare sector received a major boost with ₹7,500 crore allocation in Budget 2025-26. Three new bulk drug manufacturing parks announced in Gujarat, Himachal Pradesh, and Andhra Pradesh. PLI scheme for medical devices extended with ₹3,000 crore additional corpus. Sun Pharma gained 3.5%, Dr Reddy's up 4.1%, Divi's Labs surged 6%. Nifty Pharma index hit an all-time high.",
    url: "https://economictimes.indiatimes.com/budget-2025-pharma",
    urlToImage: "https://picsum.photos/800/400?random=12",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Livemint" },
  },
]

export const MOCK_IPL_ARTICLES: NewsArticle[] = [
  {
    title: "IPL 2026: Mega Auction rules revealed, RTM cards back to 3 per team",
    description: "The IPL Governing Council has announced the retention rules for the 2026 mega auction, bringing back the Right To Match (RTM) cards to 3 per franchise, with a total purse increase to ₹140 crore.",
    content: "The BCCI has finalized the retention policy for the IPL 2026 mega auction. Teams can retain up to 4 players and use 3 RTM cards. The salary cap has been hiked to ₹140 crore per team. Matches will be played across 12 venues, including New York and London for select weekend games to boost global viewership. Franchise owners expressed satisfaction with the increased flexibility.",
    url: "https://espncricinfo.com/ipl-2026-auction",
    urlToImage: "https://picsum.photos/800/400?random=40",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "ESPN Cricinfo" },
  },
  {
    title: "MS Dhoni confirms 'last dance' for CSK in IPL 2026",
    description: "In a surprise announcement, MS Dhoni has confirmed he will lead Chennai Super Kings for one final season in 2026 before transitioning to a mentorship role within the franchise.",
    content: "Legendary captain MS Dhoni announced that IPL 2026 will be his final season as an active player. 'I want to leave when the fans are still asking why, not when they ask why not,' Dhoni said at a promotional event in Chennai. CSK management is already scouting for a long-term successor, with Ruturaj Gaikwad and Rishabh Pant being discussed as potential leaders.",
    url: "https://cricbuzz.com/dhoni-2026",
    urlToImage: "https://picsum.photos/800/400?random=41",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Cricbuzz" },
  },
  {
    title: "IPL Media Rights: Digital valuation overtakes TV for 2026-2030 cycle",
    description: "The first bids for the new IPL media rights cycle show digital streaming rights commanding a 40% premium over traditional television broadcasting, reflecting India's massive 5G adoption.",
    content: "Bidding for the IPL 2026-2030 media rights has reached record highs. Digital rights are currently priced at ₹28,000 crore, significantly higher than TV rights at ₹20,000 crore. Reliance-Disney and Amazon are reportedly in a bidding war for digital dominance. This shift highlights the changing content consumption patterns in urban and rural India alike.",
    url: "https://moneycontrol.com/ipl-media-rights",
    urlToImage: "https://picsum.photos/800/400?random=42",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Moneycontrol" },
  }
]

export const MOCK_STOCK_MARKET_ARTICLES: NewsArticle[] = [
  {
    title: "Global Markets: US Fed signals 'higher for longer' as inflation remains sticky",
    description: "Wall Street stocks fell as Federal Reserve Chair Jerome Powell suggested that interest rate cuts might be delayed until late 2026, citing persistent core inflation in the services sector.",
    content: "The S&P 500 dropped 1.5% and Nasdaq fell 2.1% following cautious comments from the Fed. Inflation data for the last quarter came in at 3.4%, above the 2% target. Treasury yields spiked to 4.5%, putting pressure on tech valuations. Analysts now expect the first rate cut only in Q4 2026. Asian markets opened deep in the red this morning.",
    url: "https://bloomberg.com/fed-inflation",
    urlToImage: "https://picsum.photos/800/400?random=50",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Bloomberg" },
  },
  {
    title: "Nifty hits all-time high of 25,000 led by Banking and Energy stocks",
    description: "The Indian benchmark Nifty 50 index crossed the historic 25,000 mark today, driven by strong earnings from Reliance and HDFC Bank, coupled with record domestic investor inflows.",
    content: "History was made on Dalal Street as Nifty 50 touched 25,000 points. The rally was broad-based, with the Midcap 100 index also rising 1.2%. SIP inflows hit a monthly record of ₹22,000 crore, shielding the Indian market from global volatility. ICICI Bank and NTPC were the top gainers, while IT stocks saw some profit booking.",
    url: "https://economictimes.com/nifty-25k",
    urlToImage: "https://picsum.photos/800/400?random=51",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Economic Times" },
  },
  {
    title: "Nvidia valuation crosses $4 Trillion as AI chip demand shows no signs of slowing",
    description: "AI powerhouse Nvidia became the first company to hit a $4 trillion market cap as quarterly revenue tripled on the back of Blackwell chip shipments to major cloud providers.",
    content: "Nvidia's meteoric rise continues as its stock price surged another 8% to $185 per share. The company reported $45 billion in data center revenue alone. Microsoft, Google, and Meta remain the biggest buyers as the race for AGI intensifies. Jensen Huang stated that 'the next industrial revolution is powered by silicon, and we are the foundry.'",
    url: "https://reuters.com/nvidia-4tn",
    urlToImage: "https://picsum.photos/800/400?random=52",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Reuters" },
  }
]

export const MOCK_WAR_ARTICLES: NewsArticle[] = [
  {
    title: "Middle East Tension: Iran warns of 'massive response' following drone strike on consulate",
    description: "Tehran has threatened significant retaliation against Israel for a coordinated drone attack that destroyed a senior command facility, sparking fears of a full-scale regional conflict.",
    content: "Tensions in the Middle East reached a boiling point as Iran's Supreme Leader vowed an 'unimaginable' response to the latest strike. Oil prices surged to $95 a barrel on supply disruption fears. The UN Security Council has called for an emergency meeting. Global airlines have suspended flights over Iranian and Israeli airspace as a precaution.",
    url: "https://aljazeera.com/middle-east-war",
    urlToImage: "https://picsum.photos/800/400?random=60",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Al Jazeera" },
  },
  {
    title: "Global Supply Chain Alert: Hormuz Strait tensions threaten 20% of world oil supply",
    description: "Insurance premiums for oil tankers have quadrupled in 24 hours as military drills in the Strait of Hormuz raise the risk of a naval blockade amid the Iran-Israel standoff.",
    content: "The critical choke point for global oil is under threat. If the Strait of Hormuz is closed, energy prices could hit $150 per barrel within weeks. Shipping giants Maersk and MSC are re-routing vessels around the Cape of Good Hope, adding 12 days to transit times. Economists warn this could reignite global inflation just as central banks were planning rate cuts.",
    url: "https://ft.com/hormuz-tensions",
    urlToImage: "https://picsum.photos/800/400?random=61",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Financial Times" },
  }
]

export const MOCK_BREAKING_ARTICLE: NewsArticle = {
  title: "Byju's parent Think & Learn faces NCLT insolvency proceedings as creditors demand ₹2,800 crore",
  description: "The National Company Law Tribunal admitted insolvency proceedings against Byju's parent entity Think & Learn Pvt Ltd after BCCI and other creditors claimed ₹2,800 crore in unpaid dues, marking the biggest edtech bankruptcy in India.",
  content: "NCLT Bengaluru bench admitted insolvency proceedings against Think & Learn Pvt Ltd, the parent company of edtech giant Byju's, after the Board of Control for Cricket in India (BCCI) filed a petition claiming ₹158 crore in unpaid sponsorship dues. Total claims from creditors exceed ₹2,800 crore. Once valued at $22 billion, Byju's is now facing its biggest crisis since founder Byju Raveendran stepped down as CEO. The resolution professional will take over management. 15,000 employees face uncertainty. Investors including Prosus, General Atlantic, and Sequoia Capital have already written down their investments to zero.",
  url: "https://economictimes.indiatimes.com/byjus-insolvency",
  urlToImage: "https://picsum.photos/800/400?random=20",
  publishedAt: new Date(Date.now() - 1800000).toISOString(),
  source: { name: "Economic Times" },
}

export const MOCK_HEADLINES: NewsArticle[] = [
  {
    title: "Sensex rallies 500 points on strong FII buying, Nifty above 23,500",
    description: "Indian stock markets gained sharply with Sensex up 500 points led by banking and IT stocks. FIIs pumped ₹3,200 crore into equities, reversing their recent selling trend.",
    content: "The BSE Sensex surged 500 points to 77,800 while Nifty50 climbed above 23,500 on strong foreign buying. HDFC Bank, ICICI Bank, and Infosys were top contributors. The rally was supported by positive global cues and expectations of RBI rate cut.",
    url: "https://economictimes.indiatimes.com/markets-rally",
    urlToImage: "https://picsum.photos/800/400?random=30",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    source: { name: "Economic Times" },
  },
  {
    title: "RBI holds repo rate at 6.25%, cuts CRR by 50 bps to boost liquidity",
    description: "Reserve Bank of India maintained the benchmark repo rate at 6.25% but cut CRR by 50 basis points to release ₹1.16 lakh crore into the banking system to support credit growth.",
    content: "The RBI monetary policy committee voted 4-2 to keep the repo rate unchanged at 6.25% while cutting the cash reserve ratio by 50 basis points to 4%. Governor Sanjay Malhotra signaled an accommodative stance going forward. GDP growth for FY26 projected at 6.5%. Inflation forecast revised downward to 4.2%.",
    url: "https://economictimes.indiatimes.com/rbi-policy",
    urlToImage: "https://picsum.photos/800/400?random=31",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    source: { name: "Mint" },
  },
  {
    title: "Zomato reports first ₹1,000 crore quarterly profit, Blinkit turns profitable",
    description: "Zomato crossed the ₹1,000 crore quarterly profit milestone driven by food delivery growth and Blinkit achieving operating profitability for the first time. Stock hits all-time high of ₹285.",
    content: "Zomato Ltd reported Q3 FY26 net profit of ₹1,050 crore, up 280% YoY, beating analyst estimates. Revenue grew 58% to ₹5,400 crore. Blinkit quick commerce arm reported its first operating profit of ₹75 crore. GOV (Gross Order Value) crossed ₹10,000 crore for the first time. Stock surged 12% to hit ₹285.",
    url: "https://economictimes.indiatimes.com/zomato-profit",
    urlToImage: "https://picsum.photos/800/400?random=32",
    publishedAt: new Date(Date.now() - 5400000).toISOString(),
    source: { name: "NDTV Profit" },
  },
  {
    title: "India's GDP growth accelerates to 7.2% in Q3, beating all estimates",
    description: "India's economy grew 7.2% in the October-December quarter, surpassing the RBI's estimate of 6.7% and cementing India's position as the fastest-growing major economy globally.",
    content: "India's GDP grew 7.2% year-on-year in Q3 FY26, beating the consensus estimate of 6.5% and RBI's projection of 6.7%. Manufacturing grew 12.3%, services 7.8%, and agriculture 4.1%. Private consumption grew 7.5%, indicating strong domestic demand. Government capital expenditure was up 28% YoY. IMF praised India's growth momentum.",
    url: "https://economictimes.indiatimes.com/india-gdp",
    urlToImage: "https://picsum.photos/800/400?random=33",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    source: { name: "Business Standard" },
  },
  {
    title: "Tata Motors launches ₹10 lakh EV Curvv, targets 50,000 units in first year",
    description: "Tata Motors unveiled the Curvv EV at ₹10 lakh, the most affordable electric SUV in India, targeting a 50,000-unit production in year one with 500km range and 30-minute fast charging.",
    content: "Tata Motors launched the Curvv EV with a starting price of ₹9.99 lakh (ex-showroom), making it the most affordable electric SUV in India. Features include a 500km range on single charge, 30-minute fast-charging capability, and Level 2 ADAS. Production will begin at the Sanand plant with 50,000 units targeted in the first year. Tata Motors stock rose 4.5% on the announcement.",
    url: "https://economictimes.indiatimes.com/tata-ev",
    urlToImage: "https://picsum.photos/800/400?random=34",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    source: { name: "Autocar India" },
  },
  {
    title: "Reliance Jio launches AI-powered JioAI platform, competes with ChatGPT in Indian languages",
    description: "Reliance Jio unveiled JioAI, an AI platform supporting 11 Indian languages, with free access for all Jio users. The platform includes translation, content generation, and financial advisory features.",
    content: "Reliance Jio launched JioAI, a multi-lingual AI platform supporting 11 Indian languages including Hindi, Tamil, Telugu, Bengali, and Marathi. The platform offers free access to all 450 million Jio users. JioAI includes a financial advisory bot, a farming assistant for rural India, and an education tool integrated with NCERT curriculum. Mukesh Ambani called it 'AI for every Indian'. Morgan Stanley estimated the platform could add $5-8 billion to Jio's valuation.",
    url: "https://economictimes.indiatimes.com/jio-ai",
    urlToImage: "https://picsum.photos/800/400?random=35",
    publishedAt: new Date(Date.now() - 16200000).toISOString(),
    source: { name: "India Today" },
  },
]

// --- Mock LLM Responses for Demo Stability ---

export const MOCK_SYNTHESIS_ANGLES: any[] = [
  {
    "id": "macro-impact",
    "name": "Macro Impact",
    "icon": "📊",
    "color": "#3a86ff",
    "description": "Analysis of GDP growth, fiscal deficit, and overall economic trajectory.",
    "articleIndices": [0, 3, 9],
    "articleCount": 3
  },
  {
    "id": "sector-winners",
    "name": "Sector Winners",
    "icon": "🚀",
    "color": "#06d6a0",
    "description": "Specific impacts on IT, Defence, Agriculture, and Real Estate sectors.",
    "articleIndices": [1, 4, 5, 8, 11],
    "articleCount": 5
  },
  {
    "id": "market-reaction",
    "name": "Market Reaction",
    "icon": "📈",
    "color": "#ffbe0b",
    "description": "Stock market performance, Nifty/Sensex movements, and FPI flows.",
    "articleIndices": [2, 10],
    "articleCount": 2
  },
  {
    "id": "expert-commentary",
    "name": "Expert Analysis",
    "icon": "👨‍🏫",
    "color": "#ef476f",
    "description": "Opinions from top economists, RBI Governor, and global rating agencies.",
    "articleIndices": [3, 9],
    "articleCount": 2
  },
  {
    "id": "historical-comparison",
    "name": "Historical Context",
    "icon": "📅",
    "color": "#8338ec",
    "description": "How this budget compares to 2024 and previous landmark reforms.",
    "articleIndices": [6],
    "articleCount": 1
  }
]

export const MOCK_IPL_ANGLES: any[] = [
  { id: 'auction-rules', name: 'Auction & Retentions', icon: '🔨', color: '#f0a500', description: 'Rules for IPL 2026 mega auction and RTM cards.', articleCount: 1, articleIndices: [0] },
  { id: 'dhoni-future', name: 'The Dhoni Factor', icon: '🦁', color: '#ffbe0b', description: 'Impact of MS Dhoni\'s final season announcement.', articleCount: 1, articleIndices: [1] },
  { id: 'media-rights', name: 'Digital Dominance', icon: '📱', color: '#3a86ff', description: 'Valuation shift from TV to Digital streaming.', articleCount: 1, articleIndices: [2] },
]

export const MOCK_STOCK_ANGLES: any[] = [
  { id: 'global-fed', name: 'Fed & Global Macro', icon: '🇺🇸', color: '#ef476f', description: 'Impact of US interest rates on global liquidity.', articleCount: 1, articleIndices: [0] },
  { id: 'nifty-milestone', name: 'India\'s Bull Run', icon: '🇮🇳', color: '#06d6a0', description: 'Nifty crossing 25,000 and domestic inflows.', articleCount: 1, articleIndices: [1] },
  { id: 'ai-valuation', name: 'Tech & AI Sector', icon: '🤖', color: '#8338ec', description: 'Nvidia and the $4 Trillion AI rally.', articleCount: 1, articleIndices: [2] },
]

export const MOCK_WAR_ANGLES: any[] = [
  { id: 'geopolitics', name: 'Conflict Analysis', icon: '⚔️', color: '#e63946', description: 'Iran-Israel tensions and regional escalation risks.', articleCount: 1, articleIndices: [0] },
  { id: 'oil-supply', name: 'Energy & Supply Chain', icon: '🛢️', color: '#f0a500', description: 'Oil price surge and Hormuz Strait monitoring.', articleCount: 1, articleIndices: [1] },
]

export const MOCK_ANGLE_BRIEFINGS: Record<string, any> = {
  "macro-impact": {
    "summary": "The Union Budget 2025 focuses on aggressive consumption stimulus while maintaining a glide path for fiscal consolidation. The key highlight is the massive personal income tax relief, which is expected to put ₹1 lakh crore back into the hands of consumers. Despite the revenue foregone, the government has set a fiscal deficit target of 4.4% for FY26.",
    "keyPoints": [
      "Income tax exemption limit raised from ₹7 lakh to ₹12 lakh under the new regime.",
      "Fiscal deficit target set at 4.4% of GDP for FY26, down from 4.8%.",
      "Capital expenditure (Capex) allocation increased to a record ₹11.2 lakh crore.",
      "Consumption boost is expected to drive GDP growth towards the 7% mark."
    ],
    "expertQuotes": [
      { "speaker": "Sanjay Malhotra", "role": "RBI Governor", "quote": "The budget balances growth aspirations with fiscal prudence in a challenging global environment." }
    ],
    "dataPoints": [
      { "label": "Fiscal Deficit", "value": "4.4%", "change": "-0.4%", "sentiment": "positive" },
      { "label": "Capex Push", "value": "₹11.2 L Cr", "change": "+12%", "sentiment": "positive" }
    ],
    "implications": "The shift from infrastructure-led growth to consumption-led growth marks a major policy pivot. Markets will watch how the RBI coordinates monetary policy with this fiscal expansion."
  },
  "sector-winners": {
    "summary": "The IT and Defence sectors emerged as the biggest winners of Budget 2025. The new India AI Mission with a ₹15,000 crore corpus provides a long-term roadmap for tech companies, while the 9.5% hike in defence allocation strengthens 'Atmanirbhar Bharat' initiatives.",
    "keyPoints": [
      "₹15,000 crore allocated for India AI Mission to build compute and R&D capacity.",
      "Defence budget hiked to ₹6.81 lakh crore with a focus on domestic procurement.",
      "Agriculture sector received ₹1.52 lakh crore with PM-Kisan payments raised to ₹8,000.",
      "EV sector GST reduced to 5% with ₹10,000 crore FAME-III support."
    ],
    "expertQuotes": [
      { "speaker": "N. Chandrasekaran", "role": "Chairman, Tata Sons", "quote": "The focus on AI and deep-tech will ensure India remains competitive in the global digital economy." }
    ],
    "dataPoints": [
      { "label": "AI Mission", "value": "₹15,000 Cr", "change": "New", "sentiment": "positive" },
      { "label": "Defence Hike", "value": "9.5%", "change": "+₹60k Cr", "sentiment": "positive" }
    ],
    "implications": "Domestic manufacturing (Defence/EV) and high-end services (AI) are the twin pillars of this budget's sectoral strategy."
  }
}

export const MOCK_HINDI_SCRIPT: any = {
  "title": "Byju's Insolvency Crisis",
  "hindiTitle": "बायज़ू (Byju's) का संकट: अब क्या होगा?",
  "totalDuration": 75,
  "scenes": [
    {
      "id": "hook",
      "duration": 10,
      "hindiText": "नमस्कार, भारत की सबसे बड़ी एडटेक कंपनी बायज़ू अब दिवालिया होने की कगार पर है।",
      "romanized": "Namaste, Bharat ki sabse badi edtech company Byju's ab diwaliya hone ki kagar par hai.",
      "englishReference": "India's biggest edtech company Byju's is now on the verge of bankruptcy.",
      "visualCue": "Breaking News Banner with Byju's logo",
      "background_color": "#e63946",
      "animation_type": "text_reveal"
    },
    {
      "id": "context",
      "duration": 20,
      "hindiText": "अदालत ने कंपनी के खिलाफ दिवालिया प्रक्रिया शुरू करने का आदेश दिया है क्योंकि बीसीसीआई का 158 करोड़ रुपये का बकाया नहीं चुकाया गया।",
      "romanized": "Adalat ne company ke khilaf diwaliya prakriya shuru karne ka aadesh diya hai kyunki BCCI ka 158 crore rupaye ka bakaya nahi chukaya gaya.",
      "englishReference": "NCLT ordered insolvency proceedings as 158 crore dues to BCCI were not paid.",
      "visualCue": "Court gavel and BCCI Logo",
      "background_color": "#1d3557",
      "animation_type": "fade_in"
    },
    {
      "id": "impact",
      "duration": 20,
      "hindiText": "कुल कर्ज 2,800 करोड़ रुपये से ज्यादा है। कंपनी में काम करने वाले 15,000 कर्मचारियों की नौकरी पर अब संकट मंडरा रहा है।",
      "romanized": "Kul karz 2,800 crore rupaye se zyada hai. Company mein kaam karne wale 15,000 karmchariyon ki naukri par ab sankat mandra raha hai.",
      "englishReference": "Debt exceeds 2,800 crore. Jobs of 15,000 employees are now at risk.",
      "visualCue": "Counter showing 2,800 Cr and silhouettes of employees",
      "background_color": "#2a9d8f",
      "animation_type": "counter_up"
    },
    {
      "id": "analogy",
      "duration": 15,
      "hindiText": "इसे ऐसे समझिए, जैसे किसी ने बहुत बड़ा घर तो बना लिया लेकिन अब बिजली का बिल भरने के पैसे भी नहीं बचे हैं।",
      "romanized": "Ise aise samjhiye, jaise kisi ne bahut bada ghar toh bana liya lekin ab bijli ka bill bharne ke paise bhi nahi bache hain.",
      "englishReference": "Understand it like this: someone built a huge house but now has no money even for the electricity bill.",
      "visualCue": "Illustrated house with flickering lights",
      "background_color": "#e9c46a",
      "animation_type": "fade_quote"
    },
    {
      "id": "takeaway",
      "duration": 10,
      "hindiText": "निवेशकों ने अपना पैसा डूबता देख हाथ खींच लिए हैं। आगे क्या होगा, जानने के लिए हमारे साथ बने रहें।",
      "romanized": "Niveshakon ne apna paisa dubta dekh hath khinch liye hain. Aage kya hoga, janne ke liye hamare saath bane rahe.",
      "englishReference": "Investors have pulled back. Stay tuned to know what happens next.",
      "visualCue": "Market chart going down followed by 'Stay Tuned'",
      "background_color": "#264653",
      "animation_type": "text_reveal"
    }
  ],
  "factCheckSummary": "Preserved: NCLT order, BCCI 158cr debt, 2800cr total debt, 15k employees, and investor write-downs."
}

export const MOCK_PERSONALIZED_CARD: any = {
  "headline": "Personalized Headline",
  "summary": "This is a personalized summary for your selected persona.",
  "relevanceScore": 9,
  "depthLabel": "Deep Dive",
  "format": "metrics-card",
  "whyItMatters": "This matters because of your interest in finance.",
  "keyMetric": { "label": "Impact", "value": "Significant" }
}
