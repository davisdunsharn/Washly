import { useUser, useAuth } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { CYCLE_TYPES } from '../mock/data.js'

// ─── Cycle phases ──────────────────────────────────────────────────────────────
const CYCLE_PHASES = [
  { label: 'Washing',  from: 0,  to: 40,  color: '#0ABAB5', icon: '🫧', desc: 'Drum rotating with detergent' },
  { label: 'Rinsing',  from: 41, to: 65,  color: '#378ADD', icon: '💧', desc: 'Flushing out soap & residue'  },
  { label: 'Spinning', from: 66, to: 85,  color: '#8B5CF6', icon: '🌀', desc: 'High-speed water extraction'  },
  { label: 'Drying',   from: 86, to: 100, color: '#F59E0B', icon: '♨️', desc: 'Warm air drying cycle'       },
]

function getPhase(progress) {
  return CYCLE_PHASES.find(p => progress >= p.from && progress <= p.to) || CYCLE_PHASES[0]
}

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

// ─── Drum SVG ────────────────────────────────────────────────────────────────
function DrumIcon({ phase, isRunning, size = 40 }) {
  const color = phase?.color || '#0ABAB5'
  const spinClass = isRunning ? (phase?.label === 'Spinning' ? 'animate-spin' : 'animate-spin-slow') : ''
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

// ─── Phase stepper ───────────────────────────────────────────────────────────
function PhaseSteps({ progress }) {
  return (
    <div className="flex items-center justify-between gap-1 mb-3">
      {CYCLE_PHASES.map(p => {
        const done = progress > p.to
        const active = progress >= p.from && progress <= p.to
        return (
          <div key={p.label} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1 rounded-full transition-all duration-500 ${done || active ? 'opacity-100' : 'opacity-20'}`}
              style={{ background: done || active ? p.color : '#E2EEED' }}/>
            <span className={`text-[9px] font-medium transition-all ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-30'}`}
              style={{ color: active || done ? p.color : '#7A96A0' }}>{p.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Machine Card ────────────────────────────────────────────────────────────
function MachineCard({ machine, onBook, delay }) {
  const displayStatus = machine.status === 'in_use' ? 'running' : machine.status
  const s = statusStyles[displayStatus] || statusStyles.maintenance
  const isRun = displayStatus === 'running'
  const phase = isRun ? getPhase(machine.progress) : null

  return (
    <div className={`machine-card bg-white rounded-2xl border border-[#E2EEED] p-5 animate-slide-in ${delay}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-600 text-[#1E3448] text-sm">{machine.name}</p>
          <p className="text-xs text-[#7A96A0] mt-0.5">{machine.room || machine.location}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${isRun ? 'animate-pulse' : ''}`}/>
          {s.label}
        </span>
      </div>

      <div className="flex items-center justify-center py-3 relative">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full"
          style={{ background: isRun ? `${phase.color}18` : machine.status === 'available' ? '#F0FDF4' : '#FEF3C7' }}>
          <DrumIcon phase={phase} isRunning={isRun} size={40}/>
          {isRun && <div className="absolute inset-0 rounded-full border-2 animate-pulse-ring" style={{ borderColor: `${phase.color}40` }}/>}
        </div>
        {isRun && (
          <div className="absolute bottom-1 flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm"
            style={{ background: `${phase.color}15`, color: phase.color, border: `1px solid ${phase.color}30` }}>
            <span>{phase.icon}</span>{phase.label}
          </div>
        )}
      </div>

      {isRun && (
        <div className="mt-1 mb-2">
          <PhaseSteps progress={machine.progress} />
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: '#7A96A0' }}>
            <span style={{ color: phase.color }} className="font-medium">{phase.desc}</span>
            <span className="font-medium" style={{ color: phase.color }}>{machine.timeLeft} min left</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#E2EEED] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${machine.progress}%`, background: phase.color }}/>
          </div>
          <div className="text-right text-[10px] mt-1" style={{ color: '#7A96A0' }}>{machine.progress}%</div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-[#7A96A0]">{machine.cycles} cycles</span>
        {machine.status === 'available' && (
          <button onClick={() => onBook(machine)} className="text-xs font-medium bg-[#0ABAB5] text-white px-3 py-1.5 rounded-lg hover:bg-[#09A8A3] transition-colors">Book Now</button>
        )}
        {isRun && <span className="text-xs font-medium" style={{ color: phase.color }}>● {phase.label}</span>}
        {machine.status === 'maintenance' && <span className="text-xs font-medium text-[#F59E0B]">Unavailable</span>}
      </div>
    </div>
  )
}

// ─── Booking Modal ───────────────────────────────────────────────────────────
function BookingModal({ machine, onClose, onConfirm }) {
  const [time, setTime] = useState('08:00')
  const [cycleType, setCycleType] = useState('normal')
  const selectedCycle = CYCLE_TYPES.find(c => c.value === cycleType) || CYCLE_TYPES[0]

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
            <p className="text-xs text-[#7A96A0]">{machine.name} · {machine.room || machine.location}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#7A96A0] mb-2.5">Cycle Type</label>
            <div className="space-y-2">
              {CYCLE_TYPES.map(c => (
                <label key={c.value}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    cycleType === c.value
                      ? 'border-[#0ABAB5] bg-[#E0FAF9]'
                      : 'border-[#E2EEED] hover:border-[#0ABAB5]/40'
                  }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="cycleType"
                      value={c.value}
                      checked={cycleType === c.value}
                      onChange={() => setCycleType(c.value)}
                      className="w-4 h-4 accent-[#0ABAB5]"
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1E3448]">{c.label}</p>
                      <p className="text-xs text-[#7A96A0]">{c.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#0ABAB5] bg-[#E0FAF9] px-2 py-0.5 rounded-full border border-[#0ABAB5]/20">
                    {c.duration}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#7A96A0] mb-1.5">Preferred Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border border-[#E2EEED] rounded-xl px-4 py-2.5 text-sm text-[#1E3448] focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
            />
          </div>

          <div className="p-3 bg-[#F0F7F7] rounded-xl">
            <p className="text-xs font-medium text-[#7A96A0] mb-1.5">Cycle summary</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1E3448] font-medium">{selectedCycle.label} wash</span>
              <span className="text-xs text-[#0ABAB5] font-medium">{selectedCycle.duration}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 text-sm font-medium border border-[#E2EEED] text-[#7A96A0] py-2.5 rounded-xl hover:bg-[#F0F7F7] transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ machine, cycleType, time })}
            className="flex-1 text-sm font-medium bg-[#0ABAB5] text-white py-2.5 rounded-xl hover:bg-[#09A8A3] transition-colors shadow-sm">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, delay }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-[#E2EEED] animate-slide-in ${delay}`}>
      <p className="text-xs font-medium text-[#7A96A0] uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-display font-700 ${color}`}>{value}</p>
      <p className="text-xs text-[#7A96A0] mt-1">{sub}</p>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const rawName = user?.username || user?.firstName || user?.fullName || 'there'
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const [machines, setMachines] = useState([])
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [bookingModal, setBookingModal] = useState(null)
  const [toast, setToast] = useState(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  // Supabase client (optional)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

  // Load real machines (once, no random cycles)
  useEffect(() => {
    const loadMachines = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/machines`)
        if (res.ok) {
          const data = await res.json()
          const formatted = (data.machines || []).map(m => ({
            id: m.machine_id,
            name: m.machine_name,
            room: m.location,
            location: m.location,
            status: m.status,
            progress: m.status === 'in_use' ? 28 : 0,
            timeLeft: m.status === 'in_use' ? 22 : null,
            cycles: m.capacity_cycles || 0,
          }))
          setMachines(formatted)
        }
      } catch (err) {
        // fallback to empty array
      }
    }
    loadMachines()
  }, [apiUrl])  // runs only once on mount

  // Refresh machine data every 5 seconds with real sensor data
  useEffect(() => {
    const refreshMachines = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/machines`)
        if (res.ok) {
          const data = await res.json()
          const machines_list = data.machines || []
          
          // For each running machine, fetch latest sensor data
          const updated = await Promise.all(machines_list.map(async m => {
            const machine = {
              id: m.machine_id,
              name: m.machine_name,
              room: m.location,
              location: m.location,
              status: m.status,
              progress: 0,
              timeLeft: null,
              cycles: m.capacity_cycles || 0,
            }
            
            if (m.status === 'in_use') {
              try {
                const sensorRes = await fetch(`${apiUrl}/api/sensors/${m.machine_id}/latest`)
                if (sensorRes.ok) {
                  const sensorData = await sensorRes.json()
                  const sensor = sensorData.latest_reading
                  if (sensor?.cycle_progress_pct !== undefined) {
                    const progress = Math.round(sensor.cycle_progress_pct)
                    const remainingPercent = 100 - progress
                    const timeLeft = Math.max(0, Math.round((remainingPercent / 100) * 45))
                    machine.progress = progress
                    machine.timeLeft = timeLeft
                  }
                }
              } catch (err) {
                // Keep default values
              }
            }
            return machine
          }))
          
          setMachines(updated)
        }
      } catch (err) {
        // Silent fail
      }
    }
    
    refreshMachines()
    const interval = setInterval(refreshMachines, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [apiUrl])

  // Real-time subscription (only if Supabase is configured)
  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('machines')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, (payload) => {
        setMachines(prev => prev.map(m =>
          m.id === payload.new.machine_id
            ? { ...m, status: payload.new.status }
            : m
        ))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [supabase])

  const fetchBookings = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const formatted = (data.bookings || []).map(b => ({
        id: b.booking_id?.slice(0, 7) || b.id,
        machine: b.machines?.machine_name || 'Unknown',
        date: new Date(b.scheduled_start).toLocaleString(),
        status: b.status === 'pending' ? 'upcoming' : b.status === 'active' ? 'active' : 'complete',
        duration: `${b.duration_minutes} min`,
        booking_id: b.booking_id,
      }))
      setBookings(formatted)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!user) return
    const syncAndFetch = async () => {
      try {
        const token = await getToken()
        await fetch(`${apiUrl}/api/users/sync`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        })
        await fetchBookings()
      } catch {
        // ignore
      }
    }
    syncAndFetch()
  }, [user])

  const startMachine = async (bookingId) => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/machines/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId })
      })
      if (res.ok) {
        setToast('Machine started! Watch progress live.')
        setTimeout(() => setToast(null), 4000)
        await fetchBookings()
      } else {
        const err = await res.json()
        setToast(`Start failed: ${err.error}`)
        setTimeout(() => setToast(null), 4000)
      }
    } catch {
      setToast('Start failed. Network error.')
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleConfirmBooking = async ({ machine, cycleType, time }) => {
    try {
      const token = await getToken()
      const cycleDurations = { normal: 45, delicate: 60, heavy: 30 }
      const duration = cycleDurations[cycleType] || 45
      const [hours, minutes] = time.split(':')
      const scheduledStart = new Date()
      scheduledStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      if (scheduledStart < new Date()) scheduledStart.setDate(scheduledStart.getDate() + 1)

      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machine.id,
          scheduled_start: scheduledStart.toISOString(),
          duration_minutes: duration,
          cycle_type: cycleType,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setToast(`Booking confirmed for ${machine.name} at ${time} — ${cycleType} wash`)
        setTimeout(() => setToast(null), 4000)
        setBookingModal(null)
        await fetchBookings()
      } else if (res.status === 409) {
        setToast(`Booking failed: ${data.error || 'You already have 3 active bookings.'}`)
        setTimeout(() => setToast(null), 4000)
      } else {
        setToast(`Booking failed: ${data.error || 'Unknown error'}`)
        setTimeout(() => setToast(null), 4000)
      }
    } catch {
      setToast(`Booking confirmed (mock) for ${machine.name} at ${time}`)
      setTimeout(() => setToast(null), 4000)
      setBookingModal(null)
    }
  }

  const availableCount   = machines.filter(m => m.status === 'available').length
  const runningCount     = machines.filter(m => m.status === 'in_use' || m.status === 'running').length
  const maintenanceCount = machines.filter(m => m.status === 'maintenance').length
  const total            = machines.length || 1
  const filteredMachines = filter === 'all' ? machines : machines.filter(m => m.status === filter)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const ACTIVITY = [
    { time: '11:02 AM', msg: 'Washer A2 started — Washing cycle', type: 'info' },
    { time: '10:48 AM', msg: 'Washer B1 entered Rinsing phase',   type: 'info' },
    { time: '10:31 AM', msg: 'Washer B2 entered Spinning phase',  type: 'info' },
    { time: '08:15 AM', msg: 'Washer C1 flagged for maintenance', type: 'warn' },
  ]

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
              <h1 className="font-display text-3xl font-700 leading-tight">{user ? displayName : 'Welcome to Washly'}</h1>
              <p className="text-white/50 text-sm mt-1">All-in-One Commercial Drum Units · University Residences</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center"><p className="text-2xl font-display font-700 text-[#22C55E]">{availableCount}</p><p className="text-white/50 text-xs">Available</p></div>
              <div className="text-center"><p className="text-2xl font-display font-700 text-[#0ABAB5]">{runningCount}</p><p className="text-white/50 text-xs">Running</p></div>
              <div className="text-center"><p className="text-2xl font-display font-700 text-[#F59E0B]">{maintenanceCount}</p><p className="text-white/50 text-xs">Maintenance</p></div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {CYCLE_PHASES.map(p => (
              <div key={p.label} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
                style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}30` }}>
                <span>{p.icon}</span><span className="font-medium">{p.label}</span>
                <span className="opacity-60">{p.from}–{p.to}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Machines" value={machines.length}       sub="All blocks"        color="text-[#1E3448]" delay="delay-100"/>
          <StatCard label="My Bookings"    value={bookings.length}       sub="Active & upcoming" color="text-[#0ABAB5]" delay="delay-200"/>
          <StatCard label="Available Now"  value={availableCount}        sub="Ready to book"     color="text-[#22C55E]" delay="delay-300"/>
          <StatCard label="Utilisation"    value={`${Math.round((runningCount / total) * 100)}%`} sub="In use" color="text-[#F59E0B]" delay="delay-400"/>
        </div>

        {/* Machine Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-700 text-[#1E3448] text-lg">Machine Status</h2>
            <div className="flex gap-2">
              {['all', 'available', 'in_use', 'maintenance'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${filter === f ? 'bg-[#0ABAB5] text-white shadow-sm' : 'bg-white text-[#7A96A0] border border-[#E2EEED] hover:border-[#0ABAB5]/40'}`}>
                  {f === 'in_use' ? 'Running' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMachines.map((m, i) => (
              <MachineCard key={m.id} machine={m} onBook={setBookingModal} delay={`delay-${(i + 1) * 100}`}/>
            ))}
          </div>
        </section>

        {/* Bookings + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-[#E2EEED] p-6 animate-slide-in delay-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-700 text-[#1E3448]">My Bookings</h2>
              <button className="text-xs font-medium text-[#0ABAB5] hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {bookings.length === 0 ? (
                <p className="text-sm text-[#7A96A0] text-center py-4">No bookings yet. Book a machine!</p>
              ) : bookings.map(b => (
                <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#F0F7F7] hover:bg-[#E0FAF9] transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E2EEED] flex items-center justify-center text-[#0ABAB5]">
                    <DrumIcon size={20} phase={CYCLE_PHASES[0]} isRunning={b.status === 'active'}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E3448] truncate">{b.machine}</p>
                    <p className="text-xs text-[#7A96A0]">{b.date} · {b.duration}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bookingStyles[b.status] || 'bg-gray-50 text-gray-700'}`}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </span>
                    <span className="text-xs text-[#7A96A0]">{b.id}</span>
                    {b.status === 'upcoming' && (
                      <button
                        onClick={() => startMachine(b.booking_id)}
                        className="mt-1 text-xs bg-[#0ABAB5] text-white px-2 py-0.5 rounded"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

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
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${a.type === 'warn' ? 'bg-[#F59E0B]' : 'bg-[#0ABAB5]'}`}/>
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

        {/* Weekly chart (mock) */}
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
                    style={{ background: v > 80 ? 'linear-gradient(to top,#0ABAB5,#22C55E)' : 'linear-gradient(to top,#0ABAB5,#5CD8D4)' }}/>
                </div>
                <span className="text-xs font-medium text-[#7A96A0]">{day}</span>
              </div>
            ))}
          </div>
        </section>
        <p className="text-center text-xs text-[#7A96A0] pb-4">Washly · All-in-One Commercial Drum Units · University Residences</p>
      </div>

      {bookingModal && (
        <BookingModal
          machine={bookingModal}
          onClose={() => setBookingModal(null)}
          onConfirm={handleConfirmBooking}
        />
      )}

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