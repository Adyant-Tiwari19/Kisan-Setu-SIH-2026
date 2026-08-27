import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { Benefits } from './components/Benefits'
import { CustomerTypes } from './components/CustomerTypes'
import { AISection } from './components/AISection'
import { ImpactSection } from './components/ImpactSection'
import { Header } from './components/Header'

function App() {
  return (
    <div className="min-h-screen bg-[#f7f5ef] text-slate-900">
      <Header />

      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <CustomerTypes />
        <AISection />
        <ImpactSection />
      </main>

      <Footer />
    </div>
  )
}

export default App
