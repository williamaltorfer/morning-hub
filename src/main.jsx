import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/glass.css'
import './styles/typography.css'
import './index.css'
import { HubProvider } from './context/HubContext'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HubProvider>
      <App />
    </HubProvider>
  </StrictMode>,
)
