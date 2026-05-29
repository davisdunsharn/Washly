import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import Navbar from './components/Navbar.jsx'
import Chatbot from './components/Chatbot.jsx'
import ProtectedAdminRoute from './components/ProtectedAdminRoute.jsx'
import LandingPage from './pages/Landing.jsx'
import DashboardPage from './pages/Dashboard.jsx'
import MachinesPage from './pages/Machines.jsx'
import BookingsPage from './pages/Bookings.jsx'
import AdminDashboardPage from './pages/AdminDashboard.jsx'
import { isAdmin } from './utils/isAdmin.js'

function ProtectedLayout({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return <div className="min-h-screen bg-[#F0F7F7] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0ABAB5]"></div></div>
  if (!isSignedIn) return <Navigate to="/" replace />
  return (
    <>
      <Navbar />
      {children}
      <Chatbot />
    </>
  )
}

function AdminRedirector({ children }) {
  const { user } = useUser()
  if (!user) return children
  if (isAdmin(user)) return <Navigate to="/admin" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<ProtectedLayout><AdminRedirector><DashboardPage /></AdminRedirector></ProtectedLayout>} />
        <Route path="/machines" element={<ProtectedLayout><MachinesPage /></ProtectedLayout>} />
        <Route path="/bookings" element={<ProtectedLayout><BookingsPage /></ProtectedLayout>} />
        <Route
          path="/admin/*"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}