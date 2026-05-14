import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NavLink = ({ to, children, icon }) => {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        active ? 'bg-[#0ABAB5]/10 text-[#0ABAB5]' : 'text-[#7A96A0] hover:text-[#1E3448] hover:bg-white/60'
      }`}>
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </Link>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-40 border-b border-[#E2EEED] glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0ABAB5] flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="3" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="3.5" r="1" fill="white"/>
                <circle cx="14.5" cy="11.5" r="1" fill="white"/>
                <circle cx="3.5" cy="11.5" r="1" fill="white"/>
              </svg>
            </div>
            <span className="font-display font-700 text-lg text-[#1E3448]">
              Wash<span className="text-[#0ABAB5]">ly</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            <SignedIn>
              <NavLink to="/dashboard" icon="📊">Dashboard</NavLink>
              <NavLink to="/machines"  icon="🫧">Machines</NavLink>
              <NavLink to="/bookings"  icon="📅">My Bookings</NavLink>
            </SignedIn>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <SignedIn>
              {/* Mobile menu */}
              <button className="sm:hidden p-2 rounded-lg text-[#7A96A0] hover:bg-[#F0F7F7]" onClick={() => setMobileOpen(o => !o)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-[#7A96A0] hover:text-[#0ABAB5] transition-colors">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm font-medium bg-[#0ABAB5] text-white px-4 py-2 rounded-xl hover:bg-[#09A8A3] transition-colors shadow-sm">Get Started</button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-[#E2EEED] bg-white px-4 py-3 space-y-1">
          {[
            { to: '/dashboard', icon: '📊', label: 'Dashboard' },
            { to: '/machines',  icon: '🫧', label: 'Machines'  },
            { to: '/bookings',  icon: '📅', label: 'My Bookings' },
          ].map(({ to, icon, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === to ? 'bg-[#0ABAB5]/10 text-[#0ABAB5]' : 'text-[#7A96A0] hover:bg-[#F0F7F7] hover:text-[#1E3448]'
              }`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
