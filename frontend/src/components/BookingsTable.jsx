// src/components/BookingsTable.jsx
// UI only — no API calls. Davis will wire real data + export.
import { useState } from 'react'
import { mockBookings } from '../mock/data.js'

const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: 'bg-yellow-50', text: 'text-yellow-700', dot: '#F59E0B' },
  active:    { label: 'Active',    bg: 'bg-teal-50',   text: 'text-teal-700',   dot: '#0ABAB5' },
  completed: { label: 'Completed', bg: 'bg-green-50',  text: 'text-green-700',  dot: '#22C55E' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',    text: 'text-red-600',    dot: '#EF4444' },
}

const CYCLE_CFG = {
  normal:   { label: 'Normal',   color: '#0ABAB5' },
  delicate: { label: 'Delicate', color: '#8B5CF6' },
  heavy:    { label: 'Heavy',    color: '#F59E0B' },
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-[10px] font-700 text-[#7A96A0] uppercase tracking-widest bg-[#F0F7F7] whitespace-nowrap">
      {children}
    </th>
  )
}

export default function BookingsTable({ bookings = mockBookings }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter)

  const handleExport = () => {
    // Davis will wire this up
    console.log('export clicked', filtered)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2EEED] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#E2EEED] flex-wrap">
        <h3 className="font-display font-700 text-[#1E3448] text-base">All Bookings</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter dropdown */}
          <div className="flex gap-1.5 bg-[#F0F7F7] rounded-xl p-1">
            {['all', 'pending', 'active', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs font-600 px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === s ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-[#7A96A0] hover:text-[#1E3448]'
                }`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {/* Export CSV */}
          <button onClick={handleExport}
            className="flex items-center gap-2 text-xs font-600 text-[#1E3448] bg-white border border-[#E2EEED] px-4 py-2 rounded-xl hover:bg-[#F0F7F7] transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v8M3.5 6l3 3 3-3M1 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Booking ID</Th>
              <Th>User</Th>
              <Th>Machine</Th>
              <Th>Scheduled Time</Th>
              <Th>Status</Th>
              <Th>Cycle Type</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => {
              const sCfg = STATUS_CFG[b.status] || STATUS_CFG.pending
              const cCfg = CYCLE_CFG[b.cycleType] || CYCLE_CFG.normal
              return (
                <tr key={b.id}
                  className="border-t border-[#E2EEED] hover:bg-[#F0F7F7] transition-colors">
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-700 text-[#0ABAB5]">{b.id}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#E0FAF9] flex items-center justify-center text-[10px] font-700 text-[#0ABAB5] shrink-0">
                        {b.user[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-500 text-[#1E3448]">{b.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#1E3448]">{b.machine}</td>
                  <td className="px-4 py-3.5 text-xs text-[#7A96A0] font-500">{b.time}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-full ${sCfg.bg} ${sCfg.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sCfg.dot }}/>
                      {sCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-full bg-[#F0F7F7] text-[#1E3448]"
                      style={{ borderLeft: `3px solid ${cCfg.color}` }}>
                      {cCfg.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#7A96A0]">
                  No bookings match this filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div className="px-6 py-3 border-t border-[#E2EEED] bg-[#F0F7F7]">
        <p className="text-xs text-[#7A96A0]">
          Showing <strong className="text-[#1E3448]">{filtered.length}</strong> of {bookings.length} bookings
        </p>
      </div>
    </div>
  )
}
