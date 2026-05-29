// components/ProtectedAdminRoute.jsx
// Wraps any admin page. Handles:
//   - Loading state while Clerk initialises
//   - Redirect to / if not signed in
//   - Redirect to /dashboard if signed in but not an admin
//   - Renders the admin nav + content (NO student Navbar, NO Chatbot)
import { useAuth, useUser, SignOutButton } from '@clerk/clerk-react'
import { Navigate, Link, useLocation } from 'react-router-dom'
import { isAdmin } from '../utils/isAdmin'

function AdminNavLink({ to, children, icon }) {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-[#0ABAB5]/20 text-[#0ABAB5]'
          : 'text-white/50 hover:text-white hover:bg-white/10'
      }`}>
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </Link>
  )
}

function AdminNavbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-[#1E3448] bg-[#0D1B2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-14">

          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#0ABAB5] flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="3"   stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="3.5"  r="1" fill="white"/>
                <circle cx="14.5" cy="11.5" r="1" fill="white"/>
                <circle cx="3.5"  cy="11.5" r="1" fill="white"/>
              </svg>
            </div>
            <span className="font-display font-700 text-white text-sm">
              Wash<span className="text-[#0ABAB5]">ly</span>
              <span className="ml-2 text-[10px] font-medium text-[#0ABAB5] bg-[#0ABAB5]/15 px-2 py-0.5 rounded-full border border-[#0ABAB5]/30">
                ADMIN
              </span>
            </span>
          </Link>

          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#0ABAB5]/15 text-[#0ABAB5]">📊</span>
              Admin Console
            </div>
          </div>

          <div className="ml-auto">
            <SignOutButton>
              <button className="text-xs font-medium text-white bg-red-500/80 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-colors">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function ProtectedAdminRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="animate-spin">
            <circle cx="16" cy="16" r="12" stroke="#0ABAB5" strokeWidth="2" opacity="0.2"/>
            <path d="M16 4a12 12 0 0 1 12 12" stroke="#0ABAB5" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-white/40">Loading…</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) return <Navigate to="/" replace />

  if (!isAdmin(user)) {
    return (
      <div className="min-h-screen bg-[#F0F7F7] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[#E2EEED] p-10 max-w-sm text-center shadow-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="font-display font-700 text-[#1E3448] text-xl mb-2">Admin access only</h2>
          <p className="text-sm text-[#7A96A0] mb-6">
            Your account doesn't have admin privileges. Contact your system administrator.
          </p>
          <Link to="/dashboard"
            className="inline-block text-sm font-medium bg-[#0ABAB5] text-white px-6 py-2.5 rounded-xl hover:bg-[#09A8A3] transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F0F7F7]">
      <AdminNavbar />
      {children}
    </div>
  )
}
