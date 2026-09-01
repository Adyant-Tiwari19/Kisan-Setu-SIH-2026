import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoutes } from './routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
)

// Scroll-reveal: add .revealed class when elements enter viewport
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  )

  const observe = () => {
    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el))
  }

  // Initial pass
  observe()

  // Re-observe on route changes (SPA navigation)
  const mo = new MutationObserver(observe)
  mo.observe(document.getElementById('root')!, { childList: true, subtree: true })
}

// Run after first paint
requestAnimationFrame(() => requestAnimationFrame(initScrollReveal))
