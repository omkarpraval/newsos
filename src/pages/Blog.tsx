import { motion } from 'framer-motion'

interface Post {
  id: string
  title: string
  summary: string
  date: string
  tag: string
  readTime: string
  author: string
}

const POSTS: Post[] = [
  {
    id: '1',
    title: 'The Causal Link between Semi-conductor Fab plants and Regional Geopolitics',
    summary: 'A deep dive into how Karnatakas newest fab plant deal is shifting the strategic importance of the Deccan plateau.',
    date: 'MAR 29, 2026',
    tag: 'STRATEGY',
    readTime: '8 MIN READ',
    author: 'AI Neutral'
  },
  {
    id: '2',
    title: 'Post-Dollarization: Why Central Banks are pivoting to Digital Ledger Assets',
    summary: 'Analyzing the recent policy shift in Western financial corridors and its impact on the Global South.',
    date: 'MAR 25, 2026',
    tag: 'FINANCE',
    readTime: '12 MIN READ',
    author: 'CFO Desk'
  },
  {
    id: '3',
    title: 'The Butterfly Effect of the 2026 Lithium Discovery in Rajasthan',
    summary: 'How a local mineral discovery could potentially reset the global EV supply chain by 2030.',
    date: 'MAR 20, 2026',
    tag: 'ECONOMY',
    readTime: '6 MIN READ',
    author: 'Eco-System Expert'
  }
]

export function Blog() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-24"
      >
        <div className="text-[10px] font-black tracking-[0.4em] text-purple-500 uppercase mb-6">Internal Intelligence Feed</div>
        <h1 className="text-7xl font-black tracking-tighter text-white leading-none mb-8">
          The Studio <span className="text-white/20">Log.</span>
        </h1>
        <p className="text-xl font-medium text-white/40 max-w-xl leading-relaxed">
          Curated deep-dives and causal analysis from our autonomous intelligence nodes.
        </p>
      </motion.div>

      <div className="space-y-32">
        {POSTS.map((post, i) => (
          <motion.article 
            key={post.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="flex items-center gap-6 mb-8">
               <span className="text-[10px] font-black tracking-widest text-white/20 uppercase">{post.date}</span>
               <div className="h-px w-12 bg-white/5" />
               <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase">{post.tag}</span>
            </div>
            
            <h2 className="text-5xl font-black text-white/70 group-hover:text-white transition-colors leading-[1.1] tracking-tight mb-8">
              {post.title}
            </h2>
            
            <p className="text-xl font-bold text-white/30 leading-relaxed mb-10 max-w-2xl group-hover:text-white/40 transition-colors">
              {post.summary}
            </p>
            
            <div className="flex items-center justify-between pt-8 border-t border-white/5">
               <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-white/20 uppercase">
                  <span>{post.author}</span>
                  <span className="h-1 w-1 rounded-full bg-white/10" />
                  <span>{post.readTime}</span>
               </div>
               <span className="text-white/20 group-hover:text-white group-hover:translate-x-2 transition-all text-xl">→</span>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-40 pt-40 border-t border-white/5 text-center">
         <div className="text-[10px] font-black tracking-[0.3em] text-white/10 uppercase mb-8">End of Transmission</div>
         <button className="text-sm font-black text-white/40 hover:text-white transition-colors underline underline-offset-8">Load Archived Intelligence</button>
      </div>
    </div>
  )
}
