import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { wakeUpBackend } from './services/api.js'

// Wake up the Render backend on app load (prevents cold start delays)
wakeUpBackend()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
