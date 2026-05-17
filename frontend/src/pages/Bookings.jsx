import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'

const ALL_BOOKINGS = [
  { id: 'WL-2841', user: 'Amina Patel', userEmail: 'amina@washly.test', machine: 'Washer A2', block: 'Block A', date: '2026-05-14', time: '11:00 AM', status: 'active',    duration: 45, ref: 'Cycle in progress – Washing phase' },
  { id: 'WL-2840', user: 'James Reed',  userEmail: 'james@washly.test',  machine: 'Washer B1', block: 'Block B', date: '2026-05-14', time: '09:30 AM', status: 'complete',  duration: 45, ref: 'Completed successfully' },
  { id: 'WL-2839', user: 'Amina Patel', userEmail: 'amina@washly.test', machine: 'Washer C2', block: 'Block C', date: '2026-05-15', time: '08:00 AM', status: 'upcoming',  duration: 45, ref: 'Scheduled for tomorrow' },
  { id: 'WL-2821', user: 'James Reed',  userEmail: 'james@washly.test',  machine: 'Washer A1', block: 'Block A', date: '2026-05-13', time: '03:00 PM', status: 'complete',  duration: 45, ref: 'Completed successfully' },
  { id: 'WL-2810', user: 'Amina Patel', userEmail: 'amina@washly.test', machine: 'Washer B3', block: 'Block B', date: '2026-05-12', time: '10:00 AM', status: 'cancelled', duration: 45, ref: 'Cancelled by user' },
  { id: 'WL-2799', user: 'James Reed',  userEmail: 'james@washly.test',  machine: 'Washer A3', block: 'Block A', date: '2026-05-11', time: '07:00 AM', status: 'complete',  duration: 45, ref: 'Completed successfully' },
]

const statusConfig = {
  active:    { label: 'Active',     bg: 'bg-teal-50',   text: 'text-teal-700',   dot: '#0ABAB5', border: 'border-teal-200' },
  complete:  { label: 'Complete',   bg: 'bg-green-50',  text: 'text-green-700',  dot: '#22C55E', border: 'border-green-200' },
  upcoming:  { label: 'Upcoming',   bg: 'bg-blue-50',   text: 'text-blue-700',   dot: '#3B82F6', border: 'border-blue-200' },
  cancelled: { label: 'Cancelled',  bg: 'bg-red-50',    text: 'text-red-600',    dot: '#EF4444', border: 'border-red-200' },
}

const MACHINES_FOR_BOOKING = ['Washer A1','Washer A2','Washer A3','Washer B1','Washer B2','Washer B3','Washer C2','Washer C3']

export default function BookingsPage() {
  const { user } = useUser()
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ machine: '', date: '', time: '08:00' })
  const [bookings, setBookings] = useState([])
  const [toast, setToast] = useState(null)
  const [cancelId, setCancelId] = useState(null)

  const currentEmail = user?.primaryEmailAddress?.emailAddress
    || user?.emailAddresses?.[0]?.emailAddress
    || user?.emailAddress
    || ''

  useEffect(() => {
    if (!currentEmail) return
    setBookings(ALL_BOOKINGS.filter(b => b.userEmail === currentEmail))
  }, [currentEmail])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const handleBook = () => {
    if (!form.machine || !form.date) return
    const newB = {
      id: `WL-${Math.floor(2842 + Math.random() * 100)}`,
      user: user?.fullName || 'You',
      userEmail: currentEmail,
      machine: form.machine,
      block: form.machine.includes('A') ? 'Block A' : form.machine.includes('B') ? 'Block B' : 'Block C',
      date: form.date,
      time: form.time,
      status: 'upcoming',
      duration: 45,
      ref: 'Booking confirmed',
    }
    setBookings(prev => [newB, ...prev])
    setShowNew(false)
    setForm({ machine: '', date: '', time: '08:00' })
    showToast(`Booking ${newB.id} confirmed for ${form.machine}`)
  }

  const handleCancel = (id) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    setCancelId(null)
    showToast('Booking cancelled')
  }

  const counts = { all: bookings.length, active: bookings.filter(b=>b.status==='active').length, upcoming: bookings.filter(b=>b.status==='upcoming').length, complete: bookings.filter(b=>b.status==='complete').length, cancelled: bookings.filter(b=>b.status==='cancelled').length }

  return (
    <div className="min-h-screen bg-[#F0F7F7]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D1B2A] to-[#1E3448] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-700">My Bookings</h1>
              <p className="text-white/50 text-sm mt-1">Manage all your laundry bookings</p>
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-[#0ABAB5] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#09A8A3] transition-colors shadow-lg shadow-[#0ABAB5]/20">
              + New Booking
            </button>
          </div>
          {/* Summary pills */}
          <div className="flex gap-3 mt-5 flex-wrap">
            {[
              { l: 'Active',   v: counts.active,   c: '#0ABAB5' },
              { l: 'Upcoming', v: counts.upcoming,  c: '#3B82F6' },
              { l: 'Complete', v: counts.complete,  c: '#22C55E' },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${c}18`, border: `1px solid ${c}30` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c }}/>
                <span className="text-sm font-medium" style={{ color: c }}>{v} {l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter tabs */}
        <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-[#E2EEED] mb-6 w-fit">
          {['all','active','upcoming','complete','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${filter === f ? 'bg-[#0ABAB5] text-white' : 'text-[#7A96A0] hover:text-[#1E3448]'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1.5 opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Booking list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E2EEED] p-12 text-center">
              <p className="text-4xl mb-3">🫧</p>
              <p className="font-display font-600 text-[#1E3448]">No bookings here</p>
              <p className="text-sm text-[#7A96A0] mt-1">Try a different filter or book a machine</p>
            </div>
          )}
          {filtered.map(b => {
            const s = statusConfig[b.status]
            return (
              <div key={b.id} className={`bg-white rounded-2xl border p-5 ${s.border} hover:shadow-md transition-all`}>
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${s.dot}15` }}>
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
                      <p className="text-xs text-[#7A96A0] mt-1 italic">{b.ref}</p>
                    </div>
                  </div>
                  {/* Right */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot, animation: b.status === 'active' ? 'pulse 1.5s infinite' : 'none' }}/>
                      {s.label}
                    </span>
                    <span className="text-xs font-mono text-[#7A96A0]">{b.id}</span>
                    {(b.status === 'upcoming' || b.status === 'active') && (
                      <button onClick={() => setCancelId(b.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* New Booking Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0D1B2A]/50 backdrop-blur-sm" onClick={() => setShowNew(false)}/>
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <h3 className="font-display font-700 text-[#1E3448] text-lg mb-1">New Booking</h3>
            <p className="text-xs text-[#7A96A0] mb-6">All cycles are 45 min — Wash · Rinse · Spin · Dry</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#7A96A0] mb-1.5">Machine</label>
                <select value={form.machine} onChange={e => setForm({...form, machine: e.target.value})}
                  className="w-full border border-[#E2EEED] rounded-xl px-4 py-2.5 text-sm text-[#1E3448] focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]">
                  <option value="">Select a machine…</option>
                  {MACHINES_FOR_BOOKING.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7A96A0] mb-1.5">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full border border-[#E2EEED] rounded-xl px-4 py-2.5 text-sm text-[#1E3448] focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#7A96A0] mb-1.5">Time</label>
                <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})}
                  className="w-full border border-[#E2EEED] rounded-xl px-4 py-2.5 text-sm text-[#1E3448] focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNew(false)} className="flex-1 text-sm font-medium border border-[#E2EEED] text-[#7A96A0] py-2.5 rounded-xl hover:bg-[#F0F7F7]">Cancel</button>
              <button onClick={handleBook} disabled={!form.machine || !form.date}
                className="flex-1 text-sm font-medium bg-[#0ABAB5] text-white py-2.5 rounded-xl hover:bg-[#09A8A3] disabled:opacity-40 disabled:cursor-not-allowed">
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0D1B2A]/50 backdrop-blur-sm" onClick={() => setCancelId(null)}/>
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <p className="font-display font-700 text-[#1E3448] mb-2">Cancel Booking?</p>
            <p className="text-sm text-[#7A96A0] mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 text-sm border border-[#E2EEED] text-[#7A96A0] py-2 rounded-xl hover:bg-[#F0F7F7]">Keep it</button>
              <button onClick={() => handleCancel(cancelId)} className="flex-1 text-sm bg-red-500 text-white py-2 rounded-xl hover:bg-red-600">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
