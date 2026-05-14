import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect, useRef } from 'react'

/* ─── Cycle phases for All-in-One Commercial Drum Unit ─── */
// Progress ranges: Washing 0-40%, Rinsing 41-65%, Spinning 66-85%, Drying 86-100%
const CYCLE_PHASES = [
  { label: 'Washing',  from: 0,  to: 40, color: '#0ABAB5', icon: '🫧', desc: 'Drum rotating with detergent' },
  { label: 'Rinsing',  from: 41, to: 65, color: '#378ADD', icon: '💧', desc: 'Flushing out soap & residue'  },
  { label: 'Spinning', from: 66, to: 85, color: '#8B5CF6', icon: '🌀', desc: 'High-speed water extraction'  },
  { label: 'Drying',   from: 86, to: 100, color: '#F59E0B', icon: '♨️', desc: 'Warm air drying cycle'       },
]

function getPhase(progress) {
  return CYCLE_PHASES.find(p => progress >= p.from && progress <= p.to) || CYCLE_PHASES[0]
}

function getPhaseBarColor(progress) {
  const phase = getPhase(progress)
  return phase.color
}

/* ─── Mock data ─── */
const INITIAL_MACHINES = [
  { id: 1, name: 'Washer A1', room: 'Block A – Ground',   status: 'available',   progress: 0,  timeLeft: null, cycles: 34 },
  { id: 2, name: 'Washer A2', room: 'Block A – Ground',   status: 'running',     progress: 28, timeLeft: 22,   cycles: 51 },
  { id: 3, name: 'Washer B1', room: 'Block B – Level 1',  status: 'running',     progress: 55, timeLeft: 12,   cycles: 29 },
  { id: 4, name: 'Washer B2', room: 'Block B – Level 1',  status: 'running',     progress: 78, timeLeft: 5,    cycles: 18 },
  { id: 5, name: 'Washer C1', room: 'Block C – Ground',   status: 'maintenance', progress: 0,  timeLeft: null, cycles: 72 },
  { id: 6, name: 'Washer C2', room: 'Block C – Ground',   status: 'available',   progress: 0,  timeLeft: null, cycles: 9  },
]

const BOOKINGS = [
  { id: 'WL-2841', machine: 'Washer A2', date: 'Today, 11:00 AM', status: 'active',   duration: '45 min' },
  { id: 'WL-2799', machine: 'Washer B1', date: 'Today, 09:30 AM', status: 'complete', duration: '45 min' },
  { id: 'WL-2760', machine: 'Washer C2', date: 'Tomorrow, 08:00 AM', status: 'upcoming', duration: '45 min' },
]

const ACTIVITY = [
  { time: '11:02 AM', msg: 'Washer A2 started — Washing cycle', type: 'info' },
  { time: '10:48 AM', msg: 'Washer B1 entered Rinsing phase', type: 'info' },
  { time: '10:31 AM', msg: 'Washer B2 entered Spinning phase', type: 'info' },
  { time: '08:15 AM', msg: 'Washer C1 flagged for maintenance', type: 'warn' },
]

/* ─── Status config ─── */
const statusStyles = {
  available:   { dot: 'bg-[#22C55E]', badge: 'bg-green-50 text-green-700',   label: 'Available'   },
  running:     { dot: 'bg-[#0ABAB5]', badge: 'bg-teal-50 text-teal-700',     label: 'Running'     },
  maintenance: { dot: 'bg-[#F59E0B]', badge: 'bg-amber-50 text-amber-700',   label: 'Maintenance' },
}

const bookingStyles = {
  active:   'bg-teal-50 text-teal-700',
  complete: 'bg-green-50 text-green-700',
  upcoming: 'bg-blue-50 text-blue-700',
}

/* ─── Drum SVG ─── */
function DrumIcon({ phase, isRunning, size = 40 }) {
  const color = phase?.color || 'currentColor'
  const spinClass = isRunning
    ? phase?.label === 'Spinning' ? 'animate-spin' : 'animate-spin-slow'
    : ''
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={spinClass}
      style={isRunning && phase?.label === 'Spinning' ? { animationDuration: '0.6s' } : {}}>
      <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="2" opacity="0.25"/>
      <circle cx="20" cy="20" r="9"  stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <circle cx="20" cy="20" r="4"  stroke={color} strokeWidth="2"/>
      <circle cx="20" cy="7"  r="2"  fill={color}/>
      <circle cx="31.1" cy="25.5" r="2" fill={color}/>
      <circle cx="8.9"  cy="25.5" r="2" fill={color}/>
    </svg>
  )
}

/* ─── Phase stepper dots ─── */
function PhaseSteps({ progress }) {
  return (
    <div className="flex items-center justify-between gap-1 mb-3">
      {CYCLE_PHASES.map((p, i) => {
        const done    = progress > p.to
        const active  = progress >= p.from && progress <= p.to
        const pending = progress < p.from
        return (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1 rounded-full transition-all duration-500 ${
              done   ? 'opacity-100' :
              active ? 'opacity-100' : 'opacity-20'
            }`} style={{ background: done || active ? p.color : '#E2EEED' }}/>
            <span className={`text-[9px] font-medium transition-all ${
              active  ? 'opacity-100' :
              done    ? 'opacity-60'  : 'opacity-30'
            }`} style={{ color: active || done ? p.color : '#7A96A0' }}>
              {p.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Machine Card ─── */
function MachineCard({ machine, onBook, delay }) {
  const s     = statusStyles[machine.status]
  const isRun = machine.status === 'running'
  const phase = isRun ? getPhase(machine.progress) : null

  return (
    <div className={`machine-card bg-white rounded-2xl border border-[#E2EEED] p-5 animate-slide-in ${delay}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-600 text-[#1E3448] text-sm">{machine.name}</p>
          <p className="text-xs text-[#7A96A0] mt-0.5">{machine.room}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${isRun ? 'animate-pulse' : ''}`}/>
          {s.label}
        </span>
      </div>

      {/* Drum + phase label */}
      <div className="flex items-center justify-center py-3 relative">
        <div className={`relative flex items-center justify-center w-16 h-16 rounded-full`}
          style={{ background: isRun ? `${phase.color}18` : machine.status === 'available' ? '#F0FDF4' : '#FEF3C7' }}>
          <DrumIcon
            phase={phase}
            isRunning={isRun}
            size={40}
          />
          {isRun && (
            <div className="absolute inset-0 rounded-full border-2 animate-pulse-ring"
              style={{ borderColor: `${phase.color}40` }}/>
          )}
        </div>

        {/* Phase badge — floating */}
        {isRun && (
          <div className="absolute bottom-1 flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm"
            style={{ background: `${phase.color}15`, color: phase.color, border: `1px solid ${phase.color}30` }}>
            <span>{phase.icon}</span>
            {phase.label}
          </div>
        )}
      </div>

      {/* Phase stepper — running only */}
      {isRun && (
        <div className="mt-1 mb-2">
          <PhaseSteps progress={machine.progress} />

          {/* Progress bar coloured by phase */}
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: '#7A96A0' }}>
            <span style={{ color: phase.color }} className="font-medium">{phase.desc}</span>
            <span className="font-medium" style={{ color: phase.color }}>{machine.timeLeft} min left</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E2EEED] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${machine.progress}%`, background: phase.color }}/>
          </div>
          <div className="text-right text-[10px] mt-1" style={{ color: '#7A96A0' }}>{machine.progress}%</div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-[#7A96A0]">{machine.cycles} cycles</span>
        {machine.status === 'available' && (
          <button onClick={() => onBook(machine)}
            className="text-xs font-medium bg-[#0ABAB5] text-white px-3 py-1.5 rounded-lg hover:bg-[#09A8A3] transition-colors">
            Book Now
          </button>
        )}
        {machine.status === 'running' && (
          <span className="text-xs font-medium" style={{ color: phase.color }}>● {phase.label}</span>
        )}
        {machine.status === 'maintenance' && (
          <span className="text-xs font-medium text-[#F59E0B]">Unavailable</span>
        )}
      </div>
    </div>
  )
}

/* ─── Booking Modal ─── */
function BookingModal({ machine, onClose, onConfirm }) {
  const [time, setTime] = useState('08:00')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0D1B2A]/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-slide-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#E0FAF9] text-[#0ABAB5] flex items-center justify-center">
            <DrumIcon size={24} phase={CYCLE_PHASES[0]}/>
          </div>
          <div>
            <h3 className="font-display font-700 text-[#1E3448]">Book Machine</h3>
            <p className="text-xs text-[#7A96A0]">{machine.name} · {machine.room}</p>
          </div>
        </div>

        {/* Cycle phases info */}
        <div className="mb-5 p-3 bg-[#F0F7F7] rounded-xl">
          <p className="text-xs font-medium text-[#7A96A0] mb-2">45-min cycle includes:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {CYCLE_PHASES.map(p => (
              <div key={p.label} className="flex items-center gap-1.5 text-xs" style={{ color: p.color }}>
                <span>{p.icon}</span>
                <span className="font-medium">{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#7A96A0] mb-1.5">Preferred Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full border border-[#E2EEED] rounded-xl px-4 py-2.5 text-sm text-[#1E3448] focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7A96A0] mb-1.5">Duration</label>
            <div className="w-full border border-[#E2EEED] rounded-xl px-4 py-2.5 text-sm text-[#7A96A0] bg-[#F0F7F7]">
              45 minutes — Wash · Rinse · Spin · Dry
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 text-sm font-medium border border-[#E2EEED] text-[#7A96A0] py-2.5 rounded-xl hover:bg-[#F0F7F7] transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(machine, time)}
            className="flex-1 text-sm font-medium bg-[#0ABAB5] text-white py-2.5 rounded-xl hover:bg-[#09A8A3] transition-colors shadow-sm">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, color, delay }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-[#E2EEED] animate-slide-in ${delay}`}>
      <p className="text-xs font-medium text-[#7A96A0] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-display font-700 ${color}`}>{value}</p>
      <p className="text-xs text-[#7A96A0] mt-1">{sub}</p>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const rawName = user?.username || user?.firstName || user?.fullName || 'there'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const [machines, setMachines] = useState(INITIAL_MACHINES)
  const [filter, setFilter]     = useState('all')
  const [booking, setBooking]   = useState(null)
  const [toast, setToast]       = useState(null)

  // ---------- USER SYNC WITH BACKEND (added) ----------
  useEffect(() => {
    const syncUserToDatabase = async () => {
      try {
        const token = await getToken()
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await fetch(`${apiUrl}/api/users/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()
        console.log('User synced:', data)
      } catch (error) {
        console.error('Failed to sync user:', error)
      }
    }

    if (user) {
      syncUserToDatabase()
    }
  }, [user, getToken])

  // Simulate live IoT progress ticking every 5s
  useEffect(() => {
    const t = setInterval(() => {
      setMachines(prev => prev.map(m => {
        if (m.status !== 'running') return m
        const newProgress = Math.min(100, m.progress + 1)
        const newTimeLeft = Math.max(0, m.timeLeft - 1)
        if (newProgress >= 100) return { ...m, status: 'available', progress: 0, timeLeft: null, cycles: m.cycles + 1 }
        return { ...m, progress: newProgress, timeLeft: newTimeLeft }
      }))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  const available = machines.filter(m => m.status === 'available').length
  const running   = machines.filter(m => m.status === 'running').length
  const maint     = machines.filter(m => m.status === 'maintenance').length
  const filtered  = filter === 'all' ? machines : machines.filter(m => m.status === filter)

  const handleConfirm = (machine, time) => {
    setBooking(null)
    setToast(`Booking confirmed for ${machine.name} at ${time}`)
    setTimeout(() => setToast(null), 4000)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="min-h-screen bg-[#F0F7F7]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0D1B2A] via-[#1E3448] to-[#0D1B2A] text-white">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#0ABAB5]/10 blur-3xl"/>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-[#0ABAB5]/8 blur-2xl"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[#5CD8D4] text-sm font-medium mb-1">{greeting} 👋</p>
              <h1 className="font-display text-3xl font-700 leading-tight">
                {user ? displayName : 'Welcome to Washly'}
              </h1>
              <p className="text-white/50 text-sm mt-1">All-in-One Commercial Drum Units · University Residences</p>
            </div>
            <div className="flex gap-6">
              {[
                { v: available, l: 'Available', c: 'text-[#22C55E]' },
                { v: running,   l: 'Running',   c: 'text-[#0ABAB5]' },
                { v: maint,     l: 'Maintenance', c: 'text-[#F59E0B]' },
              ].map(({ v, l, c }) => (
                <div key={l} className="text-center">
                  <p className={`text-2xl font-display font-700 ${c}`}>{v}</p>
                  <p className="text-white/50 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cycle phase legend */}
          <div className="mt-6 flex flex-wrap gap-3">
            {CYCLE_PHASES.map(p => (
              <div key={p.label} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
                style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}>
                <span>{p.icon}</span>
                <span className="font-medium">{p.label}</span>
                <span className="opacity-60">{p.from}–{p.to}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Machines" value={machines.length}  sub="All blocks"       color="text-[#1E3448]" delay="delay-100"/>
          <StatCard label="My Bookings"    value={BOOKINGS.length}  sub="Active & upcoming" color="text-[#0ABAB5]" delay="delay-200"/>
          <StatCard label="Available Now"  value={available}        sub="Ready to book"    color="text-[#22C55E]" delay="delay-300"/>
          <StatCard label="Utilisation"    value={`${Math.round((running/machines.length)*100)}%`} sub="In use" color="text-[#F59E0B]" delay="delay-400"/>
        </div>

        {/* Machine Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-700 text-[#1E3448] text-lg">Machine Status</h2>
            <div className="flex gap-2">
              {['all', 'available', 'running', 'maintenance'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                    filter === f
                      ? 'bg-[#0ABAB5] text-white shadow-sm'
                      : 'bg-white text-[#7A96A0] border border-[#E2EEED] hover:border-[#0ABAB5]/40'
                  }`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m, i) => (
              <MachineCard key={m.id} machine={m} onBook={setBooking} delay={`delay-${(i+1)*100}`}/>
            ))}
          </div>
        </section>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings */}
          <section className="bg-white rounded-2xl border border-[#E2EEED] p-6 animate-slide-in delay-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-700 text-[#1E3448]">My Bookings</h2>
              <button className="text-xs font-medium text-[#0ABAB5] hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {BOOKINGS.map(b => (
                <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#F0F7F7] hover:bg-[#E0FAF9] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E2EEED] flex items-center justify-center text-[#0ABAB5]">
                    <DrumIcon size={20} phase={CYCLE_PHASES[0]} isRunning={b.status === 'active'}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E3448] truncate">{b.machine}</p>
                    <p className="text-xs text-[#7A96A0]">{b.date} · {b.duration}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bookingStyles[b.status]}`}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                    <span className="text-xs text-[#7A96A0]">{b.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity */}
          <section className="bg-white rounded-2xl border border-[#E2EEED] p-6 animate-slide-in delay-400">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-700 text-[#1E3448]">Recent Activity</h2>
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#22C55E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"/>Live
              </span>
            </div>
            <div className="space-y-4">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                      a.type === 'success' ? 'bg-[#22C55E]' : a.type === 'warn' ? 'bg-[#F59E0B]' : 'bg-[#0ABAB5]'
                    }`}/>
                    {i < ACTIVITY.length - 1 && <div className="w-px flex-1 bg-[#E2EEED] mt-1"/>}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-[#1E3448]">{a.msg}</p>
                    <p className="text-xs text-[#7A96A0] mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Weekly bar chart */}
        <section className="bg-white rounded-2xl border border-[#E2EEED] p-6 animate-slide-in delay-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-700 text-[#1E3448]">Weekly Machine Usage</h2>
              <p className="text-xs text-[#7A96A0] mt-0.5">Simulated IoT cycle data</p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-32">
            {[
              { day: 'Mon', v: 68 }, { day: 'Tue', v: 82 }, { day: 'Wed', v: 45 },
              { day: 'Thu', v: 91 }, { day: 'Fri', v: 76 }, { day: 'Sat', v: 55 }, { day: 'Sun', v: 38 },
            ].map(({ day, v }, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-[#7A96A0]">{v}%</span>
                <div className="w-full rounded-t-lg overflow-hidden" style={{ height: `${v}%` }}>
                  <div className="w-full h-full rounded-t-lg"
                    style={{ background: v > 80 ? 'linear-gradient(to top,#0ABAB5,#22C55E)' : 'linear-gradient(to top,#0ABAB5,#5CD8D4)', animationDelay: `${i*0.08}s` }}/>
                </div>
                <span className="text-xs font-medium text-[#7A96A0]">{day}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-[#7A96A0] pb-4">
          Washly · All-in-One Commercial Drum Units · University Residences
        </p>
      </div>

      {booking && <BookingModal machine={booking} onClose={() => setBooking(null)} onConfirm={handleConfirm}/>}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
          <div className="flex items-center gap-3 bg-[#0D1B2A] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"/>
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}