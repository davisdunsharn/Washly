import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const statusConfig = {
  active:    { label: 'Active',     bg: 'bg-teal-50',   text: 'text-teal-700',   dot: '#0ABAB5', border: 'border-teal-200' },
  complete:  { label: 'Complete',   bg: 'bg-green-50',  text: 'text-green-700',  dot: '#22C55E', border: 'border-green-200' },
  upcoming:  { label: 'Upcoming',   bg: 'bg-blue-50',   text: 'text-blue-700',   dot: '#3B82F6', border: 'border-blue-200' },
  cancelled: { label: 'Cancelled',  bg: 'bg-red-50',    text: 'text-red-600',    dot: '#EF4444', border: 'border-red-200' },
}

export default function BookingsPage() {
  const { getToken } = useAuth()
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [cancelId, setCancelId] = useState(null)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const formatted = (data.bookings || []).map(b => ({
        id: b.booking_id,
        user: b.users?.full_name || b.users?.email || 'User',
        userEmail: b.users?.email,
        machine: b.machines?.machine_name || 'Unknown',
        block: b.machines?.location || 'Unknown',
        rawStart: b.scheduled_start || null,
        date: b.scheduled_start ? new Date(b.scheduled_start).toLocaleDateString() : 'Unknown',
        time: b.scheduled_start ? new Date(b.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
        status: b.status === 'pending' ? 'upcoming' : (b.status === 'active' ? 'active' : (b.status === 'completed' ? 'complete' : 'cancelled')),
        duration: b.duration_minutes || 0,
        ref: `Booking ID: ${String(b.booking_id || '').slice(0, 8) || 'unknown'}`
      }))
      setBookings(formatted)
    } catch (err) {
      console.error(err)
      showToast('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancel = async (id) => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}))
        throw new Error(error || 'Cancel failed')
      }
      showToast('Booking cancelled')
      await fetchBookings()
    } catch (err) {
      console.error(err)
      showToast(err.message || 'Failed to cancel booking')
    } finally {
      setCancelId(null)
    }
  }

  const counts = {
    all: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    upcoming: bookings.filter(b => b.status === 'upcoming').length,
    complete: bookings.filter(b => b.status === 'complete').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  const base = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)
  const filtered = [...base].sort((a, b) => {
    switch (sort) {
      case 'oldest':  return new Date(a.rawStart || 0) - new Date(b.rawStart || 0)
      case 'machine': return (a.machine || '').localeCompare(b.machine || '')
      default:        return new Date(b.rawStart || 0) - new Date(a.rawStart || 0) // newest
    }
  })

  if (loading) return <div className="p-8 text-center">Loading bookings...</div>

  return (
    <div className="min-h-screen bg-[#F0F7F7]">
      <div className="bg-gradient-to-br from-[#0D1B2A] to-[#1E3448] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-700">My Bookings</h1>
              <p className="text-white/50 text-sm mt-1">Manage all your laundry bookings</p>
            </div>
          </div>
          <div className="flex gap-3 mt-5 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `#0ABAB518`, border: `1px solid #0ABAB530` }}>
              <span className="w-2 h-2 rounded-full bg-teal-400"/>
              <span className="text-sm font-medium text-teal-300">{counts.active} Active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `#3B82F618`, border: `1px solid #3B82F630` }}>
              <span className="w-2 h-2 rounded-full bg-blue-400"/>
              <span className="text-sm font-medium text-blue-300">{counts.upcoming} Upcoming</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-[#E2EEED] w-fit">
            {['all','active','upcoming','complete','cancelled'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${filter === f ? 'bg-[#0ABAB5] text-white' : 'text-[#7A96A0] hover:text-[#1E3448]'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-1.5 opacity-60">({counts[f]})</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-700 uppercase tracking-widest text-[#7A96A0]">Sort</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs font-medium border border-[#E2EEED] bg-white rounded-lg px-3 py-1.5 text-[#1E3448] focus:outline-none focus:border-[#0ABAB5] cursor-pointer">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="machine">Machine name</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E2EEED] p-12 text-center">
              <p className="text-4xl mb-3">🫧</p>
              <p className="font-display font-600 text-[#1E3448]">No bookings here</p>
              <p className="text-sm text-[#7A96A0] mt-1">Book a machine from the Dashboard</p>
            </div>
          )}
          {filtered.map(b => {
            const s = statusConfig[b.status]
            return (
              <div key={b.id} className={`bg-white rounded-2xl border p-5 ${s.border} hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.dot}15` }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="7" stroke={s.dot} strokeWidth="1.5" opacity=".4"/>
                        <circle cx="10" cy="10" r="3.5" stroke={s.dot} strokeWidth="1.5"/>
                        <circle cx="10" cy="3.5" r="1" fill={s.dot}/>
                        <circle cx="16" cy="13" r="1" fill={s.dot}/>
                        <circle cx="4" cy="13" r="1" fill={s.dot}/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-600 text-[#1E3448]">{b.machine}</p>
                        <span className="text-xs text-[#7A96A0]">{b.block}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-[#7A96A0]">📅 {b.date}</span>
                        <span className="text-xs text-[#7A96A0]">🕐 {b.time}</span>
                        <span className="text-xs text-[#7A96A0]">⏱ {b.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }}/>
                      {s.label}
                    </span>
                    {b.status === 'upcoming' && (
                      <button onClick={() => setCancelId(b.id)} className="text-xs text-red-400 hover:text-red-600">Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <p className="font-display font-700 text-[#1E3448] mb-2">Cancel Booking?</p>
            <p className="text-sm text-[#7A96A0] mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 text-sm border border-[#E2EEED] py-2 rounded-xl">Keep it</button>
              <button onClick={() => handleCancel(cancelId)} className="flex-1 text-sm bg-red-500 text-white py-2 rounded-xl">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-[#0D1B2A] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"/>
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}