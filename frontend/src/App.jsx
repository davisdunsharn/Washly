import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

import DashboardPage       from './pages/Dashboard.jsx'
import MachinesPage        from './pages/Machines.jsx'
import BookingsPage        from './pages/Bookings.jsx'
import LandingPage         from './pages/Landing.jsx'
import AdminDashboard      from './pages/AdminDashboard.jsx'
import Navbar              from './components/Navbar.jsx'
import Chatbot             from './components/Chatbot.jsx'
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx'

// ─── Error boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Render error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: 'sans-serif', padding: '2rem', color: '#EF4444' }}>
          <h2>Something went wrong</h2>
          <pre style={{ marginTop: '1rem', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {this.state.error.toString()}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Student layout ───────────────────────────────────────────────────────────
// Only used for non-admin routes. Renders student Navbar + Chatbot.
function ProtectedLayout({ children }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F0F7F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="animate-spin">
            <circle cx="16" cy="16" r="12" stroke="#0ABAB5" strokeWidth="2" opacity="0.2"/>
            <path d="M16 4a12 12 0 0 1 12 12" stroke="#0ABAB5" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-[#7A96A0]">Loading Washly…</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) return <Navigate to="/" replace />

  return (
    <>
      <Navbar />
      {children}
      <Chatbot />
    </>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />

          {/* Student-facing pages — Navbar + Chatbot */}
          <Route path="/dashboard" element={
            <ProtectedLayout><DashboardPage /></ProtectedLayout>
          }/>
          <Route path="/machines" element={
            <ProtectedLayout><MachinesPage /></ProtectedLayout>
          }/>
          <Route path="/bookings" element={
            <ProtectedLayout><BookingsPage /></ProtectedLayout>
          }/>

          {/* Admin — completely separate layout (AdminNavbar, no Chatbot, dark nav).
              ProtectedAdminRoute handles auth + role check + renders AdminNavbar. */}
          <Route path="/admin" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          }/>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
