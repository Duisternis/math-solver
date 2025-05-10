import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'katex/dist/katex.min.css';
import App from './App.jsx'
import { Toaster } from "@/components/ui/sonner"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster richColors />
  </StrictMode>,
)
