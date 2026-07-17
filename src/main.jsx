import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/cavero.css'
import './styles/additions.css'
import { initPixel } from './lib/pixel'
import { initTikTok } from './lib/tiktok'

initPixel()
initTikTok()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)