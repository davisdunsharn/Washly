import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import DashboardPage from './pages/Dashboard.jsx'
import MachinesPage  from './pages/Machines.jsx'
import BookingsPage  from './pages/Bookings.jsx'
import LandingPage   from './pages/Landing.jsx'
import Navbar        from './components/Navbar.jsx'
import Chatbot       from './components/Chatbot.jsx'

function ProtectedLayout({ children }) {
  return (
    <>
      <SignedIn>
        <Navbar />
        {children}
        <Chatbot />   {/* ← chatbot floats on every protected page */}
      </SignedIn>
      <SignedOut>
        <Navigate to="/" replace />
      </SignedOut>
    </>
  )
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/dashboard" element={
          <ProtectedLayout><DashboardPage /></ProtectedLayout>
        }/>
        <Route path="/machines" element={
          <ProtectedLayout><MachinesPage /></ProtectedLayout>
        }/>
        <Route path="/bookings" element={
          <ProtectedLayout><BookingsPage /></ProtectedLayout>
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
