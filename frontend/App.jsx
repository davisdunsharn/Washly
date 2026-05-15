import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import DashboardPage from './pages/Dashboard.jsx'
import MachinesPage from './pages/Machines.jsx'
import BookingsPage from './pages/Bookings.jsx'
import LandingPage from './pages/Landing.jsx'
import Navbar from './components/Navbar.jsx'
import Chatbot from './components/Chatbot.jsx'

// Simple error boundary to catch and display errors
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Render error:', error, info) }
  render() {
    if (this.state.error) {
      return <pre style={{ color: 'red', padding: '2rem' }}>{this.state.error.toString()}</pre>
    }
    return this.props.children
  }
}

function ProtectedLayout({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return <div>Loading...</div>
  if (!isSignedIn) return <Navigate to="/" replace />
  return (
    <>
      <Navbar />
      {children}
      <Chatbot />
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          } />
          <Route path="/machines" element={
            <ProtectedLayout>
              <MachinesPage />
            </ProtectedLayout>
          } />
          <Route path="/bookings" element={
            <ProtectedLayout>
              <BookingsPage />
            </ProtectedLayout>
          } />
          {/* Add /admin route later when AdminDashboard is ready */}
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
