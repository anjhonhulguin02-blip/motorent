import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// The boot splash is static markup in index.html so it paints instantly,
// before this bundle even finishes loading. Fade it out once React has taken
// over: rAF twice normally waits for the app's first paint, but rAF never
// fires in a background or non-compositing tab, so a timeout backs it up —
// otherwise the splash could sit there indefinitely.
const bootSplash = document.getElementById('boot-splash')
if (bootSplash) {
  let splashHidden = false
  const hideSplash = () => {
    if (splashHidden) return
    splashHidden = true
    bootSplash.classList.add('boot-splash-hide')
    setTimeout(() => bootSplash.remove(), 550)
  }
  requestAnimationFrame(() => requestAnimationFrame(hideSplash))
  setTimeout(hideSplash, 800)
}
