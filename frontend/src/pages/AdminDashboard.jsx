// src/pages/AdminDashboard.jsx
// Admin-only page. Access is controlled by ProtectedAdminRoute.
// Uses mock data — replace with real API calls when ready.
import { useState, useEffect, useRef } from 'react'
import { mockStats, mockBookings, mockChartData } from '../mock/data.js'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// ─── Mock extended data ───────────────────────────────────────────────────────
const INITIAL_MACHINES = [
  { id: '1', name: 'Washer A1', location: 'Block A · Ground',  type: 'washer', status: 'available',   progress: 0,  timeLeft: null, cycles: 34 },
  { id: '2', name: 'Washer A2', location: 'Block A · Ground',  type: 'washer', status: 'in_use',      progress: 28, timeLeft: 22,   cycles: 51 },
  { id: '3', name: 'Washer A3', location: 'Block A · Level 1', type: 'washer', status: 'available',   progress: 0,  timeLeft: null, cycles: 22 },
  { id: '4', name: 'Dryer B1',  location: 'Block B · Ground',  type: 'dryer',  status: 'maintenance', progress: 0,  timeLeft: null, cycles: 72 },
  { id: '5', name: 'Dryer B2',  location: 'Block B · Ground',  type: 'dryer',  status: 'in_use',      progress: 71, timeLeft: 8,    cycles: 18 },
  { id: '6', name: 'Washer C1', location: 'Block C · Ground',  type: 'washer', status: 'available',   progress: 0,  timeLeft: null, cycles: 9  },
  { id: '7', name: 'Washer C2', location: 'Block C · Ground',  type: 'washer', status: 'in_use',      progress: 45, timeLeft: 15,   cycles: 37 },
  { id: '8', name: 'Dryer C1',  location: 'Block C · Level 1', type: 'dryer',  status: 'maintenance', progress: 0,  timeLeft: null, cycles: 29 },
]

const INITIAL_BOOKINGS = [
  { id: 'WL-001', user: 'Alice Dlamini',   machine: 'Washer A2', time: '2025-05-15 14:00', status: 'pending',   cycleType: 'normal'   },
  { id: 'WL-002', user: 'Brian Nkosi',     machine: 'Dryer B2',  time: '2025-05-15 14:30', status: 'active',    cycleType: 'heavy'    },
  { id: 'WL-003', user: 'Carmen Petersen', machine: 'Washer A1', time: '2025-05-15 15:00', status: 'completed', cycleType: 'delicate' },
  { id: 'WL-004', user: 'Dennis Mokoena',  machine: 'Washer A3', time: '2025-05-15 15:00', status: 'pending',   cycleType: 'normal'   },
  { id: 'WL-005', user: 'Emily van Wyk',   machine: 'Washer C2', time: '2025-05-15 16:00', status: 'cancelled', cycleType: 'normal'   },
  { id: 'WL-006', user: 'Thabo Sithole',   machine: 'Washer A2', time: '2025-05-15 17:00', status: 'active',    cycleType: 'delicate' },
  { id: 'WL-007', user: 'Amara Osei',      machine: 'Dryer B1',  time: '2025-05-15 17:30', status: 'pending',   cycleType: 'heavy'    },
  { id: 'WL-008', user: 'Sipho Khumalo',   machine: 'Washer C1', time: '2025-05-15 18:00', status: 'completed', cycleType: 'normal'   },
]

// ─── Constants ────────────────────────────────────────────────────────────────
const TEAL  = '#0ABAB5'
const GREEN = '#22C55E'
const AMBER = '#F59E0B'
const RED   = '#EF4444'
const NAVY  = '#0D1B2A'
const SLATE = '#1E3448'
const MUTED = '#7A96A0'

const M_STATUS = {
  available:   { label: 'Available',   bg: 'bg-green-50',  text: 'text-green-700',  dot: GREEN, border: '#DCFCE7' },
  in_use:      { label: 'In Use',      bg: 'bg-teal-50',   text: 'text-teal-700',   dot: TEAL,  border: '#CCFBF1' },
  maintenance: { label: 'Maintenance', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: AMBER, border: '#FEF3C7' },
}

const B_STATUS = {
  pending:   { label: 'Pending',   bg: 'bg-yellow-50', text: 'text-yellow-700', dot: AMBER },
  active:    { label: 'Active',    bg: 'bg-teal-50',   text: 'text-teal-700',   dot: TEAL  },
  completed: { label: 'Completed', bg: 'bg-green-50',  text: 'text-green-700',  dot: GREEN },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',    text: 'text-red-600',    dot: RED   },
}

const CYCLE_COLORS = { normal: TEAL, delicate: '#8B5CF6', heavy: AMBER }

const LOCATIONS = [
  'Block A · Ground', 'Block A · Level 1', 'Block A · Level 2',
  'Block B · Ground', 'Block B · Level 1',
  'Block C · Ground', 'Block C · Level 1',
]

// ─── Shared sub-components ────────────────────────────────────────────────────
function DrumIcon({ color = TEAL, spin = false, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      style={spin ? { animation: 'spin 3s linear infinite' } : {}}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="2" opacity="0.25"/>
      <circle cx="20" cy="20" r="9"  stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <circle cx="20" cy="20" r="4"  stroke={color} strokeWidth="2"/>
      <circle cx="20" cy="7"  r="2"  fill={color}/>
      <circle cx="31.1" cy="25.5" r="2" fill={color}/>
      <circle cx="8.9"  cy="25.5" r="2" fill={color}/>
    </svg>
  )
}

function StatusBadge({ status, config }) {
  const cfg = config[status]
  if (!cfg) return null
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-600 px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }}/>
      {cfg.label}
    </span>
  )
}

function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [message])
  const dot = type === 'delete' ? RED : type === 'warning' ? AMBER : GREEN
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-in">
      <div className="flex items-center gap-3 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl" style={{ background: NAVY }}>
        <span className="w-2 h-2 rounded-full" style={{ background: dot }}/>
        {message}
      </div>
    </div>
  )
}

// ─── Machine Modal (Add / Edit) ───────────────────────────────────────────────
const BLANK_MACHINE = { name: '', location: LOCATIONS[0], type: 'washer', status: 'available', cycles: 0 }

function MachineModal({ machine, onSave, onClose }) {
  const isEdit = !!machine?.id
  const [form, setForm] = useState(machine || BLANK_MACHINE)
  const [errors, setErrors] = useState({})
  const firstRef = useRef()

  useEffect(() => { firstRef.current?.focus() }, [])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())     e.name     = 'Name is required'
    if (!form.location.trim()) e.location = 'Location is required'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, cycles: Number(form.cycles) || 0 })
  }

  // Close on backdrop click
  function handleBackdrop(ev) {
    if (ev.target === ev.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2EEED]">
          <div>
            <h2 className="font-display font-700 text-[#1E3448] text-lg">
              {isEdit ? 'Edit Machine' : 'Add New Machine'}
            </h2>
            <p className="text-xs text-[#7A96A0] mt-0.5">
              {isEdit ? `Editing ${machine.name}` : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A96A0] hover:bg-[#F0F7F7] hover:text-[#1E3448] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-700 text-[#1E3448] uppercase tracking-widest mb-1.5">
              Machine Name *
            </label>
            <input
              ref={firstRef}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Washer A4"
              className={`w-full text-sm px-4 py-2.5 rounded-xl border outline-none transition-all ${
                errors.name
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-[#E2EEED] bg-[#F0F7F7] focus:border-[#0ABAB5] focus:bg-white'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-700 text-[#1E3448] uppercase tracking-widest mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              {['washer', 'dryer'].map(t => (
                <button key={t} onClick={() => set('type', t)}
                  className={`flex-1 text-sm font-medium py-2.5 rounded-xl border transition-all ${
                    form.type === t
                      ? 'bg-[#0ABAB5] text-white border-[#0ABAB5] shadow-sm'
                      : 'border-[#E2EEED] text-[#7A96A0] hover:border-[#0ABAB5] hover:text-[#0ABAB5]'
                  }`}>
                  {t === 'washer' ? '🫧 Washer' : '💨 Dryer'}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-700 text-[#1E3448] uppercase tracking-widest mb-1.5">
              Location *
            </label>
            <select
              value={form.location}
              onChange={e => set('location', e.target.value)}
              className={`w-full text-sm px-4 py-2.5 rounded-xl border outline-none transition-all appearance-none cursor-pointer ${
                errors.location
                  ? 'border-red-300 bg-red-50'
                  : 'border-[#E2EEED] bg-[#F0F7F7] focus:border-[#0ABAB5] focus:bg-white'
              }`}>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-700 text-[#1E3448] uppercase tracking-widest mb-1.5">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(M_STATUS).map(([key, cfg]) => (
                <button key={key} onClick={() => set('status', key)}
                  className={`text-xs font-medium px-3 py-2 rounded-xl border transition-all ${
                    form.status === key
                      ? `${cfg.bg} ${cfg.text} border-transparent shadow-sm`
                      : 'border-[#E2EEED] text-[#7A96A0] hover:border-[#0ABAB5]'
                  }`}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: cfg.dot }}/>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cycles (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-xs font-700 text-[#1E3448] uppercase tracking-widest mb-1.5">
                Total Cycles
              </label>
              <input
                type="number" min="0"
                value={form.cycles}
                onChange={e => set('cycles', e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#E2EEED] bg-[#F0F7F7] focus:border-[#0ABAB5] focus:bg-white outline-none transition-all"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2EEED] flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="text-sm font-medium text-[#7A96A0] hover:text-[#1E3448] px-4 py-2 rounded-xl hover:bg-[#F0F7F7] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="text-sm font-medium text-white px-5 py-2 rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: TEAL }}>
            {isEdit ? 'Save Changes' : 'Add Machine'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ machine, onConfirm, onClose }) {
  function handleBackdrop(ev) {
    if (ev.target === ev.currentTarget) onClose()
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-in p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 11v6M14 11v6" stroke={RED} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="font-display font-700 text-[#1E3448] text-lg mb-2">Remove Machine?</h3>
        <p className="text-sm text-[#7A96A0] mb-6">
          <strong className="text-[#1E3448]">{machine.name}</strong> will be permanently removed from the system.
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 text-sm font-medium text-[#7A96A0] border border-[#E2EEED] px-4 py-2.5 rounded-xl hover:bg-[#F0F7F7] transition-colors">
            Keep it
          </button>
          <button onClick={onConfirm}
            className="flex-1 text-sm font-medium text-white px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: RED }}>
            Yes, Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section: Stats cards ─────────────────────────────────────────────────────
function StatsSection({ machines }) {
  const total       = machines.length
  const inUse       = machines.filter(m => m.status === 'in_use').length
  const maintenance = machines.filter(m => m.status === 'maintenance').length
  const util        = total ? Math.round((inUse / total) * 100) : 0

  const cards = [
    { label: 'Total Machines',  value: total,       sub: 'Across all blocks',         color: SLATE,      icon: '🫧' },
    { label: 'Active Bookings', value: mockStats.activeBookings, sub: 'In progress right now', color: TEAL,  icon: '📅' },
    { label: 'Utilisation',     value: `${util}%`,  sub: 'Machines currently in use', color: AMBER,      icon: '📊' },
    { label: 'Avg Wait Time',   value: `${mockStats.avgWaitTime}m`, sub: 'Until next slot',  color: '#8B5CF6', icon: '⏱️' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, color, icon }) => (
        <div key={label} className="bg-white rounded-2xl border border-[#E2EEED] p-5 animate-slide-in">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[#7A96A0] uppercase tracking-widest">{label}</p>
            <span className="text-xl">{icon}</span>
          </div>
          <p className="font-display font-700 text-4xl leading-none" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-[#7A96A0] mt-2">{sub}</p>}
        </div>
      ))}
    </div>
  )
}

// ─── Section: Machine CRUD ────────────────────────────────────────────────────
function MachinesSection({ machines, setMachines, showToast }) {
  const [modal, setModal]     = useState(null)  // null | { mode: 'add' | 'edit' | 'delete', machine }
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all') // all | available | in_use | maintenance

  const filtered = machines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.location.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  function openAdd()        { setModal({ mode: 'add', machine: null }) }
  function openEdit(m)      { setModal({ mode: 'edit', machine: m }) }
  function openDelete(m)    { setModal({ mode: 'delete', machine: m }) }
  function closeModal()     { setModal(null) }

  function handleSave(data) {
    if (modal.mode === 'add') {
      const newM = { ...data, id: String(Date.now()), progress: 0, timeLeft: null }
      setMachines(prev => [...prev, newM])
      showToast(`${data.name} added successfully`, 'success')
    } else {
      setMachines(prev => prev.map(m => m.id === data.id ? { ...m, ...data } : m))
      showToast(`${data.name} updated`, 'success')
    }
    closeModal()
  }

  function handleDelete() {
    const name = modal.machine.name
    setMachines(prev => prev.filter(m => m.id !== modal.machine.id))
    showToast(`${name} removed`, 'delete')
    closeModal()
  }

  function setStatus(id, status) {
    setMachines(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    showToast(`Status updated to ${M_STATUS[status]?.label ?? status}`, 'success')
  }

  return (
    <>
      <section>
        {/* Header row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-display font-700 text-[#1E3448] text-lg">Machine Management</h2>
            <p className="text-xs text-[#7A96A0] mt-0.5">{machines.length} machines total · {filtered.length} shown</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: TEAL }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add Machine
          </button>
        </div>

        {/* Search + filter toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A96A0]" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or location…"
              className="w-full text-sm pl-9 pr-4 py-2 rounded-xl border border-[#E2EEED] bg-white focus:border-[#0ABAB5] outline-none transition-all"
            />
          </div>
          <div className="flex gap-1 bg-[#F0F7F7] rounded-xl p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'available', label: 'Available' },
              { key: 'in_use', label: 'In Use' },
              { key: 'maintenance', label: 'Maintenance' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  filter === key ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-[#7A96A0] hover:text-[#1E3448]'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2EEED] py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm text-[#7A96A0]">No machines match your search</p>
            <button onClick={() => { setSearch(''); setFilter('all') }}
              className="mt-3 text-xs text-[#0ABAB5] hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(m => {
              const cfg     = M_STATUS[m.status] || M_STATUS.available
              const isInUse = m.status === 'in_use'
              return (
                <div key={m.id}
                  className="bg-white rounded-2xl p-5 border hover:shadow-sm transition-shadow group"
                  style={{ borderColor: cfg.border }}>
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${cfg.dot}18` }}>
                        <DrumIcon color={cfg.dot} spin={isInUse} size={22}/>
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-700 text-[#1E3448] text-sm">{m.name}</p>
                        <p className="text-xs text-[#7A96A0] mt-0.5">{m.location}</p>
                        <p className="text-xs text-[#7A96A0] mt-0.5">{m.cycles} cycles total</p>
                        {isInUse && (
                          <div className="mt-2.5 w-44">
                            <div className="flex justify-between text-[10px] text-[#7A96A0] mb-1">
                              <span style={{ color: cfg.dot }} className="font-medium">{m.progress}% complete</span>
                              <span>{m.timeLeft} min left</span>
                            </div>
                            <div className="h-1.5 bg-[#E2EEED] rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${m.progress}%`, background: cfg.dot }}/>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right — CRUD actions */}
                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <StatusBadge status={m.status} config={M_STATUS}/>

                      {/* Status quick-toggle */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setStatus(m.id, 'available')}
                          disabled={m.status === 'available'}
                          title="Set Available"
                          className="text-xs font-medium text-[#22C55E] border border-green-200 bg-green-50 px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          ✓
                        </button>
                        <button
                          onClick={() => setStatus(m.id, 'maintenance')}
                          disabled={m.status === 'maintenance'}
                          title="Set Maintenance"
                          className="text-xs font-medium text-[#F59E0B] border border-amber-200 bg-amber-50 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          🔧
                        </button>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(m)}
                          title="Edit machine"
                          className="flex items-center gap-1 text-xs font-medium text-[#1E3448] border border-[#E2EEED] bg-white px-2.5 py-1.5 rounded-lg hover:bg-[#F0F7F7] hover:border-[#0ABAB5] transition-all">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M1.5 9.5h1.5l5-5-1.5-1.5-5 5v1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                            <path d="M7.5 2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(m)}
                          title="Remove machine"
                          className="flex items-center gap-1 text-xs font-medium text-red-500 border border-red-100 bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M1.5 3h8M4 3V2h3v1M8.5 3l-.5 6H3L2.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Modals */}
      {modal?.mode === 'add' && (
        <MachineModal machine={null} onSave={handleSave} onClose={closeModal}/>
      )}
      {modal?.mode === 'edit' && (
        <MachineModal machine={modal.machine} onSave={handleSave} onClose={closeModal}/>
      )}
      {modal?.mode === 'delete' && (
        <DeleteModal machine={modal.machine} onConfirm={handleDelete} onClose={closeModal}/>
      )}
    </>
  )
}

// ─── Section: Bookings table ──────────────────────────────────────────────────
function BookingsSection({ bookings, setBookings, showToast }) {
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter)

  function cancelBooking(id) {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b))
    showToast('Booking cancelled', 'warning')
  }

  function exportCSV() {
    const header = 'Booking ID,User,Machine,Time,Status,Cycle Type'
    const rows   = filtered.map(b =>
      `${b.id},"${b.user}",${b.machine},${b.time},${b.status},${b.cycleType}`
    ).join('\n')
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'washly-bookings.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV exported', 'success')
  }

  return (
    <section>
      <div className="bg-white rounded-2xl border border-[#E2EEED] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#E2EEED] flex-wrap">
          <h2 className="font-display font-700 text-[#1E3448] text-base">All Bookings</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1 bg-[#F0F7F7] rounded-xl p-1">
              {['all', 'pending', 'active', 'completed', 'cancelled'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === s ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-[#7A96A0] hover:text-[#1E3448]'
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={exportCSV}
              className="flex items-center gap-2 text-xs font-medium text-[#1E3448] bg-white border border-[#E2EEED] px-4 py-2 rounded-xl hover:bg-[#F0F7F7] transition-colors">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v8M3.5 6l3 3 3-3M1 10.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E2EEED]">
                {['Booking ID', 'User', 'Machine', 'Scheduled Time', 'Status', 'Cycle Type', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-700 text-[#7A96A0] uppercase tracking-widest bg-[#F0F7F7] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const bCfg  = B_STATUS[b.status] || B_STATUS.pending
                const cColor = CYCLE_COLORS[b.cycleType] || TEAL
                return (
                  <tr key={b.id} className="border-t border-[#E2EEED] hover:bg-[#F0F7F7] transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-700" style={{ color: TEAL }}>{b.id}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-700 text-white shrink-0"
                          style={{ background: TEAL }}>
                          {b.user[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-[#1E3448]">{b.user}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#1E3448]">{b.machine}</td>
                    <td className="px-4 py-3.5 text-xs text-[#7A96A0]">{b.time}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={b.status} config={B_STATUS}/>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[#F0F7F7] text-[#1E3448]"
                        style={{ borderLeft: `3px solid ${cColor}` }}>
                        {b.cycleType.charAt(0).toUpperCase() + b.cycleType.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {(b.status === 'pending' || b.status === 'active') ? (
                        <button onClick={() => cancelBooking(b.id)}
                          className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 px-2.5 py-1 rounded-lg transition-colors">
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-[#7A96A0]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#7A96A0]">
                    No bookings match this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-[#E2EEED] bg-[#F0F7F7]">
          <p className="text-xs text-[#7A96A0]">
            Showing <strong className="text-[#1E3448]">{filtered.length}</strong> of {bookings.length} bookings
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Usage chart ─────────────────────────────────────────────────────
function ChartSection() {
  const maxVal = Math.max(...mockChartData.map(d => d.bookings))

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: NAVY, color: '#fff', padding: '8px 14px',
        borderRadius: 10, fontSize: 12, fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}>
        <p style={{ color: TEAL, marginBottom: 2 }}>{label}</p>
        <p>{payload[0].value} booking{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-[#E2EEED] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-700 text-[#1E3448] text-base">Bookings Per Hour</h2>
          <p className="text-xs text-[#7A96A0] mt-0.5">Daily demand pattern</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7A96A0]">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: TEAL }}/>
          Bookings
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={mockChartData} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2EEED" vertical={false}/>
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#E0FAF9', radius: 6 }}/>
          <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
            {mockChartData.map((entry, i) => (
              <Cell key={i} fill={entry.bookings === maxVal ? '#09A8A3' : TEAL} opacity={entry.bookings === maxVal ? 1 : 0.75}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#7A96A0]">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: TEAL }}/>
        Peak hour:
        <strong className="ml-1" style={{ color: TEAL }}>
          {mockChartData.find(d => d.bookings === maxVal)?.hour} · {maxVal} bookings
        </strong>
      </div>
    </section>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [machines, setMachines] = useState(INITIAL_MACHINES)
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS)
  const [toast, setToast]       = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
  }

  const inUse = machines.filter(m => m.status === 'in_use').length

  return (
    <div>
      {/* Page header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${SLATE} 100%)` }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-[#5CD8D4] text-xs font-700 uppercase tracking-widest mb-1">Admin Console</p>
              <h1 className="font-display font-700 text-3xl">Overview</h1>
              <p className="text-white/50 text-sm mt-1">Stats · Machines · Bookings · Analytics</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { v: machines.filter(m => m.status === 'available').length,   l: 'Available',   c: GREEN },
                { v: inUse,                                                    l: 'In Use',      c: TEAL  },
                { v: machines.filter(m => m.status === 'maintenance').length, l: 'Maintenance', c: AMBER },
              ].map(({ v, l, c }) => (
                <div key={l} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: `${c}18`, border: `1px solid ${c}30` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: c }}/>
                  <span className="text-sm font-medium" style={{ color: c }}>{v} {l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StatsSection machines={machines}/>
        <MachinesSection machines={machines} setMachines={setMachines} showToast={showToast}/>
        <ChartSection/>
        <BookingsSection bookings={bookings} setBookings={setBookings} showToast={showToast}/>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}
    </div>
  )
}
