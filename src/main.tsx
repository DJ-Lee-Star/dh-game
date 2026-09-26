import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppV2 from './v2/AppV2.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppV2 />
  </StrictMode>,
)
