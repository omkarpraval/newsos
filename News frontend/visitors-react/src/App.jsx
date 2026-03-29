import { Cta } from './components/Cta'
import { DashboardPreview } from './components/DashboardPreview'
import { Features } from './components/Features'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Nav } from './components/Nav'
import { Ticker } from './components/Ticker'
import { ValueProps } from './components/ValueProps'
import { useScrollReveal } from './hooks/useScrollReveal'

function App() {
  useScrollReveal()

  return (
    <>
      <Nav />
      <Hero />
      <DashboardPreview />
      <ValueProps />
      <Features />
      <HowItWorks />
      <Cta />
      <Footer />
      <Ticker />
    </>
  )
}

export default App
