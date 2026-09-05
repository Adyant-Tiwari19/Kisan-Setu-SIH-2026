import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Benefits } from './components/Benefits'
import { Header } from './components/Header'
import { ImpactBand } from './components/ImpactBand'
import { MarketplacePreview } from './components/MarketplacePreview'
import { TestimonialsSection } from './components/TestimonialsSection'

function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--ff-cream)', color: 'var(--ff-navy)' }}>
      <Header />

      <main>
        <Hero />
        <ImpactBand />
        <HowItWorks />
        <MarketplacePreview />
        <Benefits />
        <TestimonialsSection />
      </main>

      <Footer />
    </div>
  )
}

export default App
