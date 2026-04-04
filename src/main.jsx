import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

console.log("=== MAIN.JSX EKSEKUSI MULAI ===");
console.log("Root element ditemukan:", document.getElementById('root'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
console.log("=== RENDER CALLED ===");
