import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Layout } from './components/layout/Layout'
import { ArticleDrawer } from './components/news/ArticleDrawer'
import { OwlNotification } from './components/world/OwlNotification'
import { FloatingChat } from './components/ai/Chatbot'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { NewsWorld } from './pages/NewsWorld'
import Briefing from './pages/Briefing'
import { VideoStudio } from './pages/VideoStudio'
import { ArcTracker } from './pages/ArcTracker'
import { Vernacular } from './pages/Vernacular'
import CharchaPage from './pages/Charcha'
import { PersonaDemo } from './pages/PersonaDemo'
import { Settings } from './pages/Settings'
import { ShadowBoard } from './pages/ShadowBoard'
import { FiscalMachine } from './pages/FiscalMachine'
import { ButterflyEffect } from './pages/ButterflyEffect'
import { DevilsAdvocate } from './pages/DevilsAdvocate'
import { Chatbot } from './components/ai/Chatbot'
import { useNewsStore } from './store/useNewsStore'
import { fetchTopHeadlines } from './services/newsapi'

function BreakingWatcher() {
  const setBreaking = useNewsStore((s) => s.setBreaking)
  const headline = useNewsStore((s) => s.breakingHeadline)
  const prev = useRef<string | null>(null)

  const { data } = useQuery({
    queryKey: ['breaking'],
    queryFn: async () => {
      const res = await fetchTopHeadlines('business', 1)
      return res.articles?.[0]?.title ?? null
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  })

  const first = useRef(true)
  useEffect(() => {
    if (!data) return
    if (first.current) {
      first.current = false
      prev.current = data
      return
    }
    if (data !== prev.current) {
      prev.current = data
      setBreaking(data)
    }
  }, [data, setBreaking])

  return (
    <OwlNotification headline={headline} onDismiss={() => setBreaking(null)} />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <BreakingWatcher />
      <ArticleDrawer />
      <FloatingChat />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="world" element={<NewsWorld />} />
          <Route path="briefing" element={<Briefing />} />
          <Route path="video" element={<VideoStudio />} />
          <Route path="arc" element={<ArcTracker />} />
          <Route path="vernacular" element={<Vernacular />} />
          <Route path="charcha" element={<CharchaPage />} />
          <Route path="persona-demo" element={<PersonaDemo />} />
          <Route path="settings" element={<Settings />} />
          <Route path="shadow-board" element={<ShadowBoard />} />
          <Route path="fiscal-machine" element={<FiscalMachine />} />
          <Route path="butterfly" element={<ButterflyEffect />} />
          <Route path="devils-advocate" element={<DevilsAdvocate />} />
          <Route path="chat" element={<Chatbot />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
