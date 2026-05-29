import { SignInButton, SignUpButton, SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()

  // FIX: navigate() must be called inside useEffect, never during render.
  // Calling it directly during render causes the React Router warning and
  // can produce a blank page in strict mode.
  useEffect(() => {
    // If Clerk has already signed the user in and they land on "/",
    // send them straight to the dashboard.
    // (ClerkProvider's afterSignInUrl also handles post-sign-in redirect,
    //  but this covers page refreshes while already signed in.)
  }, [])

  return (
    <>
      <SignedIn>
        {/* Redirect signed-in users away from landing — safe inside SignedIn wrapper */}
        <RedirectToDashboard navigate={navigate} />
      </SignedIn>

      <SignedOut>
        <div className="min-h-screen bg-[#0D1B2A] flex flex-col overflow-hidden relative">

          {/* Background decorative circles */}
          <div className="absolute top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full bg-[#0ABAB5]/10 blur-3xl pointer-events-none"/>
          <div className="absolute bottom-[-80px] left-[-60px] w-[320px] h-[320px] rounded-full bg-[#0ABAB5]/8 blur-3xl pointer-events-none"/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1E3448]/60 blur-3xl pointer-events-none"/>

          {/* Top nav */}
          <nav className="relative z-10 flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0ABAB5] flex items-center justify-center shadow-lg">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="1.6"/>
                  <circle cx="10" cy="10" r="3.2" stroke="white" strokeWidth="1.6"/>
                  <circle cx="10" cy="3.5" r="1.1" fill="white"/>
                  <circle cx="16" cy="13" r="1.1" fill="white"/>
                  <circle cx="4" cy="13" r="1.1" fill="white"/>
                </svg>
              </div>
              <span className="font-display text-xl font-bold text-white tracking-tight">
                Wash<span className="text-[#0ABAB5]">ly</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-white/60 hover:text-white transition-colors px-4 py-2">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm font-medium bg-[#0ABAB5] hover:bg-[#09A8A3] text-white px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#0ABAB5]/20">
                  Get Started
                </button>
              </SignUpButton>
            </div>
          </nav>

          {/* Hero */}
          <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#0ABAB5]/10 border border-[#0ABAB5]/20 text-[#5CD8D4] text-xs font-medium px-4 py-2 rounded-full mb-8 animate-slide-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0ABAB5] animate-pulse"/>
              Smart Campus · University Residences
            </div>

            {/* Headline */}
            <h1
              className="font-display text-5xl sm:text-6xl font-bold text-white leading-tight max-w-2xl mb-6 animate-slide-in delay-100"
            >
              Laundry, <span className="text-[#0ABAB5]">simplified</span><br/>for students
            </h1>

            <p className="text-white/50 text-lg max-w-lg leading-relaxed mb-10 animate-slide-in delay-200">
              Book washing machines online, track your cycle in real time, and get notified the moment your laundry is done — no more waiting around.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center animate-slide-in delay-300">
              <SignUpButton mode="modal">
                <button className="flex items-center gap-2 bg-[#0ABAB5] hover:bg-[#09A8A3] text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-[#0ABAB5]/25 text-sm">
                  Create Free Account
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 text-white/70 hover:text-white font-medium px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/25 transition-all text-sm">
                  Sign in to your account
                </button>
              </SignInButton>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-14 animate-slide-in delay-400">
              {[
                { icon: '📅', text: 'Online Booking' },
                { icon: '📡', text: 'Real-time Status' },
                { icon: '🔔', text: 'Cycle Notifications' },
                { icon: '📊', text: 'Usage Analytics' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 text-xs font-medium px-4 py-2 rounded-full">
                  <span>{icon}</span>{text}
                </div>
              ))}
            </div>

            {/* Dashboard preview mockup */}
            <div className="mt-16 w-full max-w-3xl animate-slide-in delay-500">
              <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 bg-[#1E3448] px-4 py-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]/60"/>
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60"/>
                    <div className="w-3 h-3 rounded-full bg-[#22C55E]/60"/>
                  </div>
                  <div className="flex-1 mx-4 bg-[#0D1B2A] rounded-md px-3 py-1 text-xs text-white/30 text-left">
                    washly.app/dashboard
                  </div>
                </div>
                {/* Mini dashboard preview */}
                <div className="bg-[#F0F7F7] p-4">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { l: 'Available', v: '3', c: 'text-[#22C55E]' },
                      { l: 'Running',   v: '2', c: 'text-[#0ABAB5]' },
                      { l: 'Bookings',  v: '3', c: 'text-[#1E3448]' },
                      { l: 'Usage',     v: '33%', c: 'text-[#F59E0B]' },
                    ].map(({ l, v, c }) => (
                      <div key={l} className="bg-white rounded-xl p-3 border border-[#E2EEED]">
                        <p className="text-[9px] text-[#7A96A0] uppercase tracking-wide">{l}</p>
                        <p className={`font-display text-lg font-bold ${c}`}>{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Washer A1', status: 'available', prog: 0 },
                      { name: 'Washer A2', status: 'running',   prog: 62 },
                      { name: 'Washer B1', status: 'running',   prog: 88 },
                    ].map(({ name, status, prog }) => (
                      <div key={name} className="bg-white rounded-xl p-3 border border-[#E2EEED]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-semibold text-[#1E3448]">{name}</span>
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                            status === 'available' ? 'bg-green-50 text-green-700' : 'bg-teal-50 text-teal-700'
                          }`}>{status === 'available' ? 'Free' : 'Running'}</span>
                        </div>
                        {prog > 0 && (
                          <div className="h-1.5 bg-[#E2EEED] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0ABAB5] rounded-full" style={{width:`${prog}%`}}/>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white/20 text-xs mt-3">Your dashboard after signing in</p>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 text-center py-6 text-white/20 text-xs border-t border-white/5">
            Washly · Smart Laundry Booking & Tracking System · University Residences
          </footer>
        </div>
      </SignedOut>
    </>
  )
}

// Separate component so navigate() is called from a component that only mounts
// when the user IS signed in — satisfies React Router's rule.
function RedirectToDashboard({ navigate }) {
  const { user } = useUser()

  useEffect(() => {
    if (!user) return
    const destination = user?.publicMetadata?.role === 'admin' ? '/admin' : '/dashboard'
    navigate(destination, { replace: true })
  }, [navigate, user])

  return null
}
