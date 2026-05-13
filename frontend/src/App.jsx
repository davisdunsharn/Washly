import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn } from '@clerk/clerk-react'
import DashboardPage from './pages/Dashboard.jsx'
import Navbar from './components/Navbar.jsx'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
