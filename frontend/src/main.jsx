import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Guard: if the key is missing or is still the placeholder, show a readable
// message instead of a blank screen.
if (
  !publishableKey ||
  publishableKey === 'pk_test_REPLACE_WITH_YOUR_REAL_CLERK_PUBLISHABLE_KEY' ||
  publishableKey.includes('REPLACE')
) {
  document.getElementById('root').innerHTML = `
    <div style="font-family:sans-serif;padding:2rem;max-width:540px;margin:4rem auto;
      background:#fff;border:1px solid #E2EEED;border-radius:1rem;box-shadow:0 4px 24px #0001">
      <div style="font-size:2rem;margin-bottom:1rem">🔑</div>
      <h2 style="color:#1E3448;margin-bottom:0.5rem">Clerk key missing</h2>
      <p style="color:#7A96A0;font-size:0.9rem;line-height:1.6">
        Open <code style="background:#F0F7F7;padding:2px 6px;border-radius:4px">frontend/.env</code>
        and replace <code style="background:#F0F7F7;padding:2px 6px;border-radius:4px">VITE_CLERK_PUBLISHABLE_KEY</code>
        with your real key from
        <a href="https://dashboard.clerk.com" style="color:#0ABAB5">dashboard.clerk.com</a>.
        Then restart Vite.
      </p>
      <p style="color:#7A96A0;font-size:0.85rem;margin-top:1rem">
        Dashboard → Your App → API Keys → Publishable key (starts with <strong>pk_test_</strong>)
      </p>
    </div>`
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — see the message in the browser.')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
