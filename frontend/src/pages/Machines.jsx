import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'

// ─── Drum icon — green for available, teal/spinning for in_use ───────────────
function DrumIcon({ size = 36, spin = false, color = '#22C55E' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 36 36" fill="none"
      style={spin ? { animation: 'drum-spin 3s linear infinite' } : {}}
    >
      <style>{`@keyframes drum-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <circle cx="18" cy="18" r="13" stroke={color} strokeWidth="1.5" opacity=".2"/>
      <circle cx="18" cy="18" r="8"  stroke={color} strokeWidth="1.5" opacity=".45"/>
      <circle cx="18" cy="18" r="3.5" stroke={color} strokeWidth="2"/>
      <circle cx="18" cy="6"  r="1.8" fill={color}/>
      <circle cx="28" cy="23" r="1.8" fill={color}/>
      <circle cx="8"  cy="23" r="1.8" fill={color}/>
    </svg>
  )
}

// ─── Styled dropdown ──────────────────────────────────────────────────────────
function Select({ value, onChange, disabled = false, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="text-sm border border-[#E2EEED] bg-white rounded-xl px-3 py-2 pr-8 text-[#1E3448]
                   focus:outline-none focus:border-[#0ABAB5] cursor-pointer appearance-none
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {children}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A96A0]"
        width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// ─── Minimal date-picker input ────────────────────────────────────────────────
function DatePicker({ value, onChange }) {
  const today = new Date().toISOString().split('T')[0]
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        min={today}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-[#E2EEED] bg-white rounded-xl px-3 py-2 text-[#1E3448]
                   focus:outline-none focus:border-[#0ABAB5] cursor-pointer appearance-none
                   [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
      />
    </div>
  )
}

// ─── Skeleton loader card ─────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2EEED] p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-[#E2EEED] rounded"/>
          <div className="h-3 w-20 bg-[#F0F7F7] rounded"/>
        </div>
        <div className="h-6 w-20 bg-[#F0F7F7] rounded-full"/>
      </div>
      <div className="flex justify-center py-4">
        <div className="w-16 h-16 rounded-full bg-[#F0F7F7]"/>
      </div>
      <div className="h-8 w-full bg-[#F0F7F7] rounded-xl mt-4"/>
    </div>
  )
}

// ─── Machine card ─────────────────────────────────────────────────────────────
function MachineCard({ machine, onBook }) {
  const isRunning = machine.status === 'in_use'
  const color     = isRunning ? '#0ABAB5' : '#22C55E'
  const bgRing    = isRunning ? 'bg-[#E0FAF9] group-hover:bg-[#CCFBF1]' : 'bg-[#F0FDF4] group-hover:bg-[#DCFCE7]'

  return (
    <div
      onClick={() => onBook(machine)}
      className="bg-white rounded-2xl border border-[#E2EEED] p-5 cursor-pointer
                 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group
                 hover:border-[#0ABAB5]/30"
    >
      {/* Top row: name + location */}
      <div className="flex justify-between items-start mb-1 gap-2">
        <div className="min-w-0">
          <p className="font-display font-600 text-[#1E3448] truncate">{machine.name}</p>
          <p className="text-xs text-[#7A96A0] mt-0.5 truncate">{machine.location}</p>
        </div>
        {/* Running badge only — available machines show nothing extra */}
        {isRunning && (
          <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full
                           bg-teal-50 text-teal-700 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ABAB5] animate-pulse"/>
            Running
          </span>
        )}
      </div>

      {/* Floor pill */}
      {machine.floor && (
        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-md
                         bg-[#F0F7F7] text-[#7A96A0]">
          {machine.floor}
        </span>
      )}

      {/* Drum icon */}
      <div className="flex justify-center py-5">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${bgRing}`}>
          <DrumIcon size={38} spin={isRunning} color={color}/>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-1 pt-3 border-t border-[#F0F7F7]">
        <span className="block w-full text-center text-xs font-medium text-[#0ABAB5]
                         bg-[#E0FAF9] px-3 py-2 rounded-xl
                         group-hover:bg-[#0ABAB5] group-hover:text-white transition-colors">
          {isRunning ? 'Schedule for later →' : 'Book Now →'}
        </span>
      </div>
    </div>
  )
}

// ─── Booking modal ────────────────────────────────────────────────────────────
function BookingModal({ machine, onClose, onConfirm }) {
  const today   = new Date().toISOString().split('T')[0]
  const [date, setDate]   = useState(today)
  const [time, setTime]   = useState('08:00')
  const [error, setError] = useState('')

  const timeSlots = []
  for (let h = 6; h <= 22; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00`)
    timeSlots.push(`${String(h).padStart(2, '0')}:30`)
  }

  function handleConfirm() {
    if (!date) { setError('Please select a date'); return }
    if (!time) { setError('Please select a time'); return }
    onConfirm({ machineId: machine.id, machineName: machine.name, date, time })
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0D1B2A] to-[#1E3448] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0ABAB5]/20 flex items-center justify-center">
                <DrumIcon size={24} color="#0ABAB5"/>
              </div>
              <div>
                <p className="font-display font-700 text-base">{machine.name}</p>
                <p className="text-xs text-white/50 mt-0.5">{machine.location}{machine.floor ? ` · ${machine.floor}` : ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50
                         hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs font-700 uppercase tracking-widest text-[#7A96A0]">Choose your booking slot</p>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[#1E3448] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="#0ABAB5" strokeWidth="1.2"/>
                  <path d="M1 5h10M4 1v2M8 1v2" stroke="#0ABAB5" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Date
              </span>
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => { setDate(e.target.value); setError('') }}
              className="w-full text-sm border border-[#E2EEED] bg-[#F0F7F7] rounded-xl px-4 py-2.5
                         focus:outline-none focus:border-[#0ABAB5] focus:bg-white transition-all"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-medium text-[#1E3448] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#0ABAB5" strokeWidth="1.2"/>
                  <path d="M6 3v3l2 1.5" stroke="#0ABAB5" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Time slot
              </span>
            </label>
            <div className="relative">
              <select
                value={time}
                onChange={e => { setTime(e.target.value); setError('') }}
                className="w-full text-sm border border-[#E2EEED] bg-[#F0F7F7] rounded-xl px-4 py-2.5 pr-8
                           focus:outline-none focus:border-[#0ABAB5] focus:bg-white appearance-none cursor-pointer transition-all"
              >
                {timeSlots.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A96A0]"
                width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="5" stroke="#EF4444" strokeWidth="1"/>
                <path d="M5.5 3v3M5.5 7.5v.5" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {error}
            </p>
          )}

          {/* Summary */}
          {date && time && (
            <div className="bg-[#F0F7F7] rounded-xl px-4 py-3 text-xs text-[#1E3448] space-y-1">
              <div className="flex justify-between">
                <span className="text-[#7A96A0]">Machine</span>
                <span className="font-medium">{machine.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A96A0]">Location</span>
                <span className="font-medium">{machine.location}{machine.floor ? ` · ${machine.floor}` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A96A0]">Date</span>
                <span className="font-medium">{new Date(date + 'T00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A96A0]">Time</span>
                <span className="font-medium">{time}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2EEED] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 text-sm font-medium text-[#7A96A0] border border-[#E2EEED]
                       py-2.5 rounded-xl hover:bg-[#F0F7F7] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 text-sm font-medium bg-[#0ABAB5] text-white py-2.5 rounded-xl
                       hover:bg-[#09A8A3] transition-colors active:scale-95"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MachinesPage() {
  const { getToken } = useAuth()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const [machines,    setMachines]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  // Derived filter options (from DB data — never hardcoded)
  const [locations,   setLocations]   = useState([])   // ['Block A', 'Block B', ...]
  const [floorsByLoc, setFloorsByLoc] = useState({})   // { 'Block A': ['Ground', 'Level 1'], ... }

  // Active filters
  const [locFilter,   setLocFilter]   = useState('All')
  const [floorFilter, setFloorFilter] = useState('All')
  const [sort,        setSort]        = useState('name-asc')

  // Booking flow
  const [booking,     setBooking]     = useState(null)  // machine being booked
  const [toast,       setToast]       = useState(null)

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch machines (available + in_use only) ──────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        const res   = await fetch(`${apiUrl}/api/machines`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        const data = await res.json()

        // Keep only available + in_use machines
        const list = (data.machines || [])
          .filter(m => m.status === 'available' || m.status === 'in_use')
          .map(m => {
            // Normalise field names — backend may use different casing
            const rawLoc   = m.location  || m.residence || ''
            const rawFloor = m.floor_label || m.floor || ''
            return {
              id:       m.machine_id   || m.id,
              name:     m.machine_name || m.name,
              location: rawLoc,
              floor:    rawFloor,
              status:   m.status,
            }
          })

        setMachines(list)

        // ── Derive unique locations + floors from live data ──
        const locSet = new Set()
        const fbL    = {}
        list.forEach(m => {
          const loc = m.location || 'Unknown'
          const fl  = m.floor    || ''
          locSet.add(loc)
          if (!fbL[loc]) fbL[loc] = new Set()
          if (fl) fbL[loc].add(fl)
        })
        setLocations([...locSet].sort())
        const floorMap = {}
        Object.entries(fbL).forEach(([loc, s]) => {
          floorMap[loc] = [...s].sort()
        })
        setFloorsByLoc(floorMap)
      } catch (err) {
        console.error(err)
        setError('Could not load machines. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [apiUrl, getToken])

  // ── Floor options depend on selected location ─────────────────────────────
  // All → union of every floor across all locations (sorted)
  const availableFloors = locFilter === 'All'
    ? [...new Set(Object.values(floorsByLoc).flat())].sort()
    : (floorsByLoc[locFilter] || []).slice().sort()

  function handleLocChange(val) {
    setLocFilter(val)
    setFloorFilter('All')
  }

  // ── Apply filters + sort ──────────────────────────────────────────────────
  const filtered = machines
    .filter(m => {
      const locOk   = locFilter   === 'All' || m.location === locFilter
      const floorOk = floorFilter === 'All' || m.floor    === floorFilter
      return locOk && floorOk
    })
    .sort((a, b) => {
      switch (sort) {
        case 'name-desc': return b.name.localeCompare(a.name)
        case 'location':  return (a.location || '').localeCompare(b.location || '') || a.name.localeCompare(b.name)
        default:          return a.name.localeCompare(b.name) // name-asc
      }
    })

  const availableCount = machines.filter(m => m.status === 'available').length
  const runningCount   = machines.filter(m => m.status === 'in_use').length

  // ── Handle booking confirmation ───────────────────────────────────────────
  async function handleConfirmBooking({ machineId, machineName, date, time }) {
    try {
      const token = await getToken()
      const scheduledStart = new Date(`${date}T${time}:00`).toISOString()
      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          machine_id:      machineId,
          scheduled_start: scheduledStart,
          duration_minutes: 60,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server error ${res.status}`)
      }
      setBooking(null)
      showToast(`${machineName} booked for ${date} at ${time}`)
    } catch (err) {
      console.error(err)
      showToast(err.message || 'Booking failed. Please try again.', false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F7F7]">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0D1B2A] to-[#1E3448] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl font-700">Machines</h1>
          <p className="text-white/50 text-sm mt-1">Available and currently running machines</p>

          <div className="flex flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#22C55E18', border: '1px solid #22C55E30' }}>
              <span className="w-2 h-2 rounded-full bg-[#22C55E]"/>
              <span className="text-sm font-medium text-green-300">{availableCount} Available</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: '#0ABAB518', border: '1px solid #0ABAB530' }}>
              <span className="w-2 h-2 rounded-full bg-[#0ABAB5] animate-pulse"/>
              <span className="text-sm font-medium text-teal-300">{runningCount} Running</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Filter bar ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E2EEED] px-5 py-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Location dropdown */}
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-700 uppercase tracking-widest text-[#7A96A0] whitespace-nowrap">
                Location
              </span>
              {loading ? (
                <div className="h-9 w-36 bg-[#F0F7F7] rounded-xl animate-pulse"/>
              ) : (
                <Select value={locFilter} onChange={handleLocChange}>
                  <option value="All">All Locations</option>
                  {locations.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              )}
            </div>

            <div className="w-px h-5 bg-[#E2EEED] hidden sm:block"/>

            {/* Floor dropdown — options update per location */}
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-700 uppercase tracking-widest text-[#7A96A0] whitespace-nowrap">
                Floor
              </span>
              {loading ? (
                <div className="h-9 w-28 bg-[#F0F7F7] rounded-xl animate-pulse"/>
              ) : (
                <Select
                  value={floorFilter}
                  onChange={setFloorFilter}
                  disabled={availableFloors.length === 0}
                >
                  <option value="All">All Floors</option>
                  {availableFloors.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              )}
            </div>

            <div className="w-px h-5 bg-[#E2EEED] hidden sm:block"/>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-700 uppercase tracking-widest text-[#7A96A0] whitespace-nowrap">
                Sort
              </span>
              <Select value={sort} onChange={setSort}>
                <option value="name-asc">Name (A–Z)</option>
                <option value="name-desc">Name (Z–A)</option>
                <option value="location">Location</option>
              </Select>
            </div>

            {/* Active filter chips */}
            {(locFilter !== 'All' || floorFilter !== 'All') && (
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {locFilter !== 'All' && (
                  <span className="flex items-center gap-1.5 text-xs font-medium bg-[#E0FAF9] text-[#0ABAB5]
                                   px-2.5 py-1 rounded-full">
                    {locFilter}
                    <button onClick={() => handleLocChange('All')} className="hover:text-[#09A8A3]">×</button>
                  </span>
                )}
                {floorFilter !== 'All' && (
                  <span className="flex items-center gap-1.5 text-xs font-medium bg-[#E0FAF9] text-[#0ABAB5]
                                   px-2.5 py-1 rounded-full">
                    {floorFilter}
                    <button onClick={() => setFloorFilter('All')} className="hover:text-[#09A8A3]">×</button>
                  </span>
                )}
                <button
                  onClick={() => { setLocFilter('All'); setFloorFilter('All') }}
                  className="text-xs text-[#7A96A0] hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            <span className="text-xs text-[#7A96A0] ml-auto">
              {filtered.length} machine{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── Error state ───────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-center">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-red-400 hover:text-red-600 underline"
            >
              Reload page
            </button>
          </div>
        )}

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🫧</div>
            <p className="font-display font-600 text-[#1E3448]">No machines match your filters</p>
            <p className="text-sm text-[#7A96A0] mt-1">Try a different location or floor</p>
            <button
              onClick={() => { setLocFilter('All'); setFloorFilter('All') }}
              className="mt-4 text-xs font-medium text-[#0ABAB5] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Available section */}
            {filtered.some(m => m.status === 'available') && (
              <section className="mb-8">
                <h2 className="text-xs font-700 uppercase tracking-widest text-[#7A96A0] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]"/>
                  Available
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.filter(m => m.status === 'available').map(m => (
                    <MachineCard key={m.id} machine={m} onBook={setBooking}/>
                  ))}
                </div>
              </section>
            )}

            {/* Running section */}
            {filtered.some(m => m.status === 'in_use') && (
              <section>
                <h2 className="text-xs font-700 uppercase tracking-widest text-[#7A96A0] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0ABAB5] animate-pulse"/>
                  Currently Running — book for when they finish
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.filter(m => m.status === 'in_use').map(m => (
                    <MachineCard key={m.id} machine={m} onBook={setBooking}/>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* ── Booking modal ─────────────────────────────────────────────────── */}
      {booking && (
        <BookingModal
          machine={booking}
          onClose={() => setBooking(null)}
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 text-white text-sm font-medium
                          px-5 py-3 rounded-2xl shadow-2xl bg-[#0D1B2A]">
            <span className={`w-2 h-2 rounded-full ${toast.ok ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}/>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
