import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/variables.css'
import './styles/global.css'
import './styles/browse.css'
import './styles/details.css'
import './styles/editorial.css'
import './styles/customer.css'
import './styles/admin.css'
import './styles/coastal.css'
import './styles/polish.css'
import './styles/ai-planner.css'
import './styles/destination-story.css'
import App from './App'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

