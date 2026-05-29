// src/pages/AdminDashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

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
  }, [message, onDone])
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

  function handleBackdrop(ev) {
    if (ev.target === ev.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in">
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
        <div className="px-6 py-5 space-y-4">
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

// ─── Section: Stats cards (real data) ─────────────────────────────────────────
function StatsSection({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E2EEED] p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  const { totalMachines, activeBookings, utilisation, avgWaitTime } = stats
  const cards = [
    { label: 'Total Machines',  value: totalMachines,       sub: 'Across all blocks',         color: SLATE,      icon: '🫧' },
    { label: 'Active Bookings', value: activeBookings,      sub: 'In progress right now',     color: TEAL,       icon: '📅' },
    { label: 'Utilisation',     value: `${utilisation}%`,   sub: 'Machines currently in use', color: AMBER,      icon: '📊' },
    { label: 'Avg Wait Time',   value: `${avgWaitTime}m`,   sub: 'Until next slot',           color: '#8B5CF6',  icon: '⏱️' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ label, value, sub, color, icon }) => (
        <div key={label} className="bg-white rounded-[28px] border border-[#E2EEED] p-6 shadow-sm animate-slide-in">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A96A0]">{label}</p>
              <p className="font-display font-700 text-3xl mt-3" style={{ color }}>{value}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F7F7] text-xl">
              {icon}
            </div>
          </div>
          {sub && <p className="text-sm text-[#7A96A0]">{sub}</p>}
        </div>
      ))}
    </div>
  )
}

// ─── Section: Machine CRUD (self-contained with useAuth) ──────────────────────
function MachinesSection({ machines, setMachines, showToast, apiUrl, refreshStats }) {
  const { getToken } = useAuth()
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = machines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.location.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  async function refreshMachinesAndStats() {
    const machinesRes = await fetch(`${apiUrl}/api/machines`)
    const machinesData = await machinesRes.json()
    const transformed = machinesData.machines.map(m => ({
      id: m.machine_id,
      name: m.machine_name,
      location: m.location,
      type: m.machine_name.toLowerCase().includes('dryer') ? 'dryer' : 'washer',
      status: m.status,
      progress: m.status === 'in_use' ? 28 : 0,
      timeLeft: m.status === 'in_use' ? 22 : null,
      cycles: m.capacity_cycles || 0,
    }))
    setMachines(transformed)
    if (refreshStats) await refreshStats()
  }

  async function handleSave(data) {
    const token = await getToken()
    try {
      if (modal.mode === 'add') {
        const payload = {
          machine_name: data.name,
          location: data.location,
          floor: 0,
          capacity_cycles: data.cycles || 1,
          status: data.status,
        }
        await fetch(`${apiUrl}/api/admin/machines`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        const payload = {
          machine_name: data.name,
          location: data.location,
          capacity_cycles: data.cycles || 1,
          status: data.status,
        }
        await fetch(`${apiUrl}/api/admin/machines/${data.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      await refreshMachinesAndStats()
      showToast(`${modal.mode === 'add' ? 'Added' : 'Updated'} ${data.name}`, 'success')
    } catch (err) {
      console.error(err)
      showToast(`Error: ${err.message}`, 'warning')
    } finally {
      setModal(null)
    }
  }

  async function handleDelete() {
    const token = await getToken()
    try {
      await fetch(`${apiUrl}/api/admin/machines/${modal.machine.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      await refreshMachinesAndStats()
      showToast(`${modal.machine.name} removed`, 'delete')
    } catch (err) {
      console.error(err)
      showToast(`Cannot delete: ${err.message}`, 'warning')
    } finally {
      setModal(null)
    }
  }

  async function setStatus(id, newStatus) {
    const token = await getToken()
    try {
      await fetch(`${apiUrl}/api/machines/${id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      await refreshMachinesAndStats()
      showToast(`Status updated to ${M_STATUS[newStatus]?.label ?? newStatus}`, 'success')
    } catch (err) {
      console.error(err)
      showToast(`Error: ${err.message}`, 'warning')
    }
  }

  function openAdd() { setModal({ mode: 'add', machine: null }) }
  function openEdit(m) { setModal({ mode: 'edit', machine: m }) }
  function openDelete(m) { setModal({ mode: 'delete', machine: m }) }
  function closeModal() { setModal(null) }

  return (
    <>
      <section>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="font-display font-700 text-[#1E3448] text-xl">Machine Management</h2>
            <p className="text-sm text-[#7A96A0] mt-1">{machines.length} machines total · {filtered.length} shown</p>
          </div>
          <button onClick={openAdd}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-3 rounded-full shadow-sm transition duration-200 hover:opacity-95 active:scale-[0.98]"
            style={{ background: TEAL }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Add Machine
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A96A0]" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or location..."
              className="w-full text-sm pl-11 pr-4 py-3 rounded-full border border-[#E2EEED] bg-[#F8FBFB] focus:border-[#0ABAB5] focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'available', label: 'Available' },
              { key: 'in_use', label: 'In Use' },
              { key: 'maintenance', label: 'Maintenance' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`text-xs font-medium px-3.5 py-2 rounded-full transition-all ${
                  filter === key ? 'bg-[#0ABAB5] text-white shadow-sm' : 'text-[#7A96A0] bg-white border border-[#E2EEED] hover:border-[#0ABAB5] hover:text-[#0ABAB5]'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

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
                  className="bg-white rounded-[28px] p-6 border border-transparent shadow-sm hover:shadow-md transition-shadow group"
                  style={{ borderColor: cfg.border }}>
                  <div className="flex items-start justify-between gap-4">
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

                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <StatusBadge status={m.status} config={M_STATUS}/>
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

// ─── Section: Bookings table (self-contained with useAuth) ────────────────────
function BookingsSection({ bookings, setBookings, showToast, apiUrl, refreshStats }) {
  const { getToken } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all')
  const filtered = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter)

  async function refreshBookingsAndStats() {
    const token = await getToken()
    const res = await fetch(`${apiUrl}/api/admin/bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    const formatted = data.bookings.map(b => ({
      id: b.id,
      user: b.user,
      machine: b.machine,
      time: new Date(b.scheduled_start).toLocaleString(),
      status: b.status,
      cycleType: b.cycle_type || 'normal'
    }))
    setBookings(formatted)
    if (refreshStats) await refreshStats()
  }

  async function cancelBooking(id) {
    const token = await getToken()
    try {
      await fetch(`${apiUrl}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      await refreshBookingsAndStats()
      showToast('Booking cancelled', 'warning')
    } catch (err) {
      console.error(err)
      showToast(`Error: ${err.message}`, 'warning')
    }
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
                      <span className="text-xs font-700" style={{ color: TEAL }}>{b.id.slice(0,8)}</span>
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

// ─── Section: Usage chart (real data) ─────────────────────────────────────────
function ChartSection({ chartData }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2EEED] p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-40 bg-gray-100 rounded"></div>
      </div>
    )
  }

  const maxVal = Math.max(...chartData.map(d => d.count))

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
        <BarChart data={chartData} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2EEED" vertical={false}/>
          <XAxis dataKey="hour" tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize: 10, fill: MUTED }} axisLine={false} tickLine={false} allowDecimals={false}/>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#E0FAF9', radius: 6 }}/>
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.count === maxVal ? '#09A8A3' : TEAL} opacity={entry.count === maxVal ? 1 : 0.75}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center gap-2 text-xs text-[#7A96A0]">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: TEAL }}/>
        Peak hour:
        <strong className="ml-1" style={{ color: TEAL }}>
          {chartData.find(d => d.count === maxVal)?.hour} · {maxVal} bookings
        </strong>
      </div>
    </section>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { getToken } = useAuth()
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [chartData, setChartData] = useState([])
  const [machines, setMachines] = useState([])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(true)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  async function refreshStats() {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setStats(await res.json())
    } catch (err) { console.error(err) }
  }

  async function fetchAllData() {
    setLoading(true)
    try {
      const token = await getToken()
      const [statsRes, bookingsRes, chartRes, machinesRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/admin/charts/bookings-per-hour`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/api/machines`)
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setBookings(data.bookings.map(b => ({
          id: b.id,
          user: b.user,
          machine: b.machine,
          time: new Date(b.scheduled_start).toLocaleString(),
          status: b.status,
          cycleType: b.cycle_type || 'normal'
        })))
      }
      if (chartRes.ok) {
        const data = await chartRes.json()
        setChartData(data.chartData)
      }
      if (machinesRes.ok) {
        const data = await machinesRes.json()
        setMachines(data.machines.map(m => ({
          id: m.machine_id,
          name: m.machine_name,
          location: m.location,
          type: m.machine_name.toLowerCase().includes('dryer') ? 'dryer' : 'washer',
          status: m.status,
          progress: m.status === 'in_use' ? 28 : 0,
          timeLeft: m.status === 'in_use' ? 22 : null,
          cycles: m.capacity_cycles || 0,
        })))
      }
    } catch (err) {
      console.error(err)
      showToast('Failed to load data', 'warning')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAllData() }, [])

  function showToast(msg, type = 'success') { setToast({ msg, type }) }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  const inUse = machines.filter(m => m.status === 'in_use').length

  return (
    <div className="font-sans">
      <div className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(10,186,181,0.22),transparent_32%)]" />
        <div className="relative" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${SLATE} 100%)` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="max-w-2xl">
                <p className="text-[#5CD8D4] text-xs font-700 uppercase tracking-widest mb-2">Overview</p>
                <h1 className="font-display font-700 text-4xl sm:text-5xl">Admin Dashboard</h1>
                <p className="text-white/70 text-sm sm:text-base mt-3">Overview · Analytics</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              {[
                { v: machines.filter(m => m.status === 'available').length,   l: 'Available',   c: GREEN },
                { v: inUse,                                                    l: 'In Use',      c: TEAL  },
                { v: machines.filter(m => m.status === 'maintenance').length, l: 'Maintenance', c: AMBER },
              ].map(({ v, l, c }) => (
                <div key={l} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }}/>
                  {v} {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <StatsSection stats={stats}/>
        <MachinesSection
          machines={machines}
          setMachines={setMachines}
          showToast={showToast}
          apiUrl={apiUrl}
          refreshStats={refreshStats}
        />
        <ChartSection chartData={chartData}/>
        <BookingsSection
          bookings={bookings}
          setBookings={setBookings}
          showToast={showToast}
          apiUrl={apiUrl}
          refreshStats={refreshStats}
        />
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}
    </div>
  )
}