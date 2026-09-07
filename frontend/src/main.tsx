import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n'
import { AppRoutes } from './routes'
import { AuthProvider } from './context/AuthContext'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
} else {
  console.error('Kisan Setu root element was not found')
}

// Scroll-reveal: add .revealed class when elements enter viewport
function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return

  const root = document.getElementById('root')
  if (!root) return

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
  mo.observe(root, { childList: true, subtree: true })
}

// Run after first paint
if (typeof requestAnimationFrame !== 'undefined') {
  requestAnimationFrame(() => requestAnimationFrame(initScrollReveal))
}
