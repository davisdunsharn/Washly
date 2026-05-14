import { useState } from 'react'

const CYCLE_PHASES = [
  { label: 'Washing',  from: 0,  to: 40, color: '#0ABAB5', icon: '🫧' },
  { label: 'Rinsing',  from: 41, to: 65, color: '#378ADD', icon: '💧' },
  { label: 'Spinning', from: 66, to: 85, color: '#8B5CF6', icon: '🌀' },
  { label: 'Drying',   from: 86, to: 100, color: '#F59E0B', icon: '♨️' },
]
function getPhase(p) { return CYCLE_PHASES.find(x => p >= x.from && p <= x.to) || CYCLE_PHASES[0] }

const ALL_MACHINES = [
  { id: 1,  name: 'Washer A1', block: 'Block A', floor: 'Ground Floor', status: 'available',   progress: 0,  timeLeft: null, cycles: 34, lastService: '2026-04-10', capacity: '8kg' },
  { id: 2,  name: 'Washer A2', block: 'Block A', floor: 'Ground Floor', status: 'running',     progress: 28, timeLeft: 22,   cycles: 51, lastService: '2026-04-10', capacity: '8kg' },
  { id: 3,  name: 'Washer A3', block: 'Block A', floor: 'Level 1',      status: 'available',   progress: 0,  timeLeft: null, cycles: 22, lastService: '2026-03-28', capacity: '8kg' },
  { id: 4,  name: 'Washer B1', block: 'Block B', floor: 'Ground Floor', status: 'running',     progress: 55, timeLeft: 12,   cycles: 29, lastService: '2026-04-15', capacity: '10kg' },
  { id: 5,  name: 'Washer B2', block: 'Block B', floor: 'Ground Floor', status: 'running',     progress: 78, timeLeft: 5,    cycles: 18, lastService: '2026-04-15', capacity: '10kg' },
  { id: 6,  name: 'Washer B3', block: 'Block B', floor: 'Level 1',      status: 'available',   progress: 0,  timeLeft: null, cycles: 41, lastService: '2026-04-02', capacity: '10kg' },
  { id: 7,  name: 'Washer C1', block: 'Block C', floor: 'Ground Floor', status: 'maintenance', progress: 0,  timeLeft: null, cycles: 72, lastService: '2026-05-01', capacity: '8kg' },
  { id: 8,  name: 'Washer C2', block: 'Block C', floor: 'Ground Floor', status: 'available',   progress: 0,  timeLeft: null, cycles: 9,  lastService: '2026-05-10', capacity: '8kg' },
  { id: 9,  name: 'Washer C3', block: 'Block C', floor: 'Level 1',      status: 'running',     progress: 92, timeLeft: 2,    cycles: 37, lastService: '2026-04-20', capacity: '8kg' },
]

function DrumIcon({ phase, isRunning, size = 36 }) {
  const color = phase?.color || '#22C55E'
  const spinStyle = isRunning ? {
    animation: `spin ${phase?.label === 'Spinning' ? '0.6s' : '4s'} linear infinite`
  } : {}
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={spinStyle}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <circle cx="18" cy="18" r="13" stroke={color} strokeWidth="1.5" opacity=".25"/>
      <circle cx="18" cy="18" r="8"  stroke={color} strokeWidth="1.5" opacity=".5"/>
      <circle cx="18" cy="18" r="3.5" stroke={color} strokeWidth="2"/>
      <circle cx="18" cy="6"  r="1.8" fill={color}/>
      <circle cx="28" cy="23" r="1.8" fill={color}/>
      <circle cx="8"  cy="23" r="1.8" fill={color}/>
    </svg>
  )
}

function PhaseBar({ progress }) {
  return (
    <div className="flex gap-1 mt-2">
      {CYCLE_PHASES.map(p => {
        const done   = progress > p.to
        const active = progress >= p.from && progress <= p.to
        return (
          <div key={p.label} className="flex-1">
            <div className="h-1 rounded-full transition-all" style={{
              background: done || active ? p.color : '#E2EEED',
              opacity: done ? 0.5 : active ? 1 : 0.25
            }}/>
            <p className="text-center mt-0.5" style={{ fontSize: 8, color: active ? p.color : '#9CA3AF', fontWeight: active ? 600 : 400 }}>
              {p.icon}
            </p>
          </div>
        )
      })}
    </div>
  )
}

const statusConfig = {
  available:   { label: 'Available',   bg: 'bg-green-50',  text: 'text-green-700',  dot: '#22C55E' },
  running:     { label: 'Running',     bg: 'bg-teal-50',   text: 'text-teal-700',   dot: '#0ABAB5' },
  maintenance: { label: 'Maintenance', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: '#F59E0B' },
}

export default function MachinesPage() {
  const [blockFilter, setBlockFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const blocks = ['All', 'Block A', 'Block B', 'Block C']

  const filtered = ALL_MACHINES.filter(m => {
    const bOk = blockFilter === 'All' || m.block === blockFilter
    const sOk = statusFilter === 'all' || m.status === statusFilter
    return bOk && sOk
  })

  const totals = {
    available:   ALL_MACHINES.filter(m => m.status === 'available').length,
    running:     ALL_MACHINES.filter(m => m.status === 'running').length,
    maintenance: ALL_MACHINES.filter(m => m.status === 'maintenance').length,
  }

  return (
    <div className="min-h-screen bg-[#F0F7F7]">
      {/* Page header */}
      <div className="bg-gradient-to-br from-[#0D1B2A] to-[#1E3448] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl font-700">All Machines</h1>
          <p className="text-white/50 text-sm mt-1">All-in-One Commercial Drum Units across all residence blocks</p>
          <div className="flex gap-4 mt-5">
            {[
              { l: 'Available', v: totals.available, c: '#22C55E' },
              { l: 'Running',   v: totals.running,   c: '#0ABAB5' },
              { l: 'Maintenance', v: totals.maintenance, c: '#F59E0B' },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${c}18`, border: `1px solid ${c}30` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c }}/>
                <span className="text-sm font-medium" style={{ color: c }}>{v} {l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-[#E2EEED]">
            {blocks.map(b => (
              <button key={b} onClick={() => setBlockFilter(b)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${blockFilter === b ? 'bg-[#0ABAB5] text-white' : 'text-[#7A96A0] hover:text-[#1E3448]'}`}>
                {b}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 bg-white rounded-xl p-1 border border-[#E2EEED]">
            {['all', 'available', 'running', 'maintenance'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${statusFilter === s ? 'bg-[#1E3448] text-white' : 'text-[#7A96A0] hover:text-[#1E3448]'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#7A96A0] ml-auto">{filtered.length} machines shown</span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const s = statusConfig[m.status]
            const phase = m.status === 'running' ? getPhase(m.progress) : null
            return (
              <div key={m.id} onClick={() => setSelected(m)}
                className="bg-white rounded-2xl border border-[#E2EEED] p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-display font-600 text-[#1E3448]">{m.name}</p>
                    <p className="text-xs text-[#7A96A0] mt-0.5">{m.block} · {m.floor}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot, animation: m.status === 'running' ? 'pulse 1.5s infinite' : 'none' }}/>
                    {s.label}
                  </span>
                </div>

                {/* Drum */}
                <div className="flex justify-center py-3 relative">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: phase ? `${phase.color}15` : m.status === 'available' ? '#F0FDF4' : '#FEF3C7' }}>
                    <DrumIcon phase={phase || { color: m.status === 'available' ? '#22C55E' : '#F59E0B' }} isRunning={m.status === 'running'} />
                  </div>
                  {phase && (
                    <div className="absolute bottom-0 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: `${phase.color}15`, color: phase.color, border: `1px solid ${phase.color}30` }}>
                      {phase.icon} {phase.label}
                    </div>
                  )}
                </div>

                {/* Progress */}
                {m.status === 'running' && (
                  <div className="mt-1">
                    <PhaseBar progress={m.progress} />
                    <div className="flex justify-between mt-2 text-xs">
                      <span style={{ color: phase.color }}>{m.progress}% complete</span>
                      <span className="text-[#7A96A0]">{m.timeLeft} min left</span>
                    </div>
                  </div>
                )}

                {/* Info row */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F0F7F7]">
                  <div className="text-xs text-[#7A96A0]">
                    <span className="font-medium text-[#1E3448]">{m.capacity}</span> · {m.cycles} cycles
                  </div>
                  {m.status === 'available'
                    ? <span className="text-xs font-medium text-[#0ABAB5] bg-[#E0FAF9] px-3 py-1 rounded-full">Book Now →</span>
                    : m.status === 'maintenance'
                    ? <span className="text-xs text-[#F59E0B]">Out of service</span>
                    : <span className="text-xs text-[#7A96A0]">View details →</span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0D1B2A]/50 backdrop-blur-sm" onClick={() => setSelected(null)}/>
          <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F0F7F7] text-[#7A96A0] hover:bg-[#E2EEED]">✕</button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#E0FAF9] flex items-center justify-center text-[#0ABAB5]">
                <DrumIcon phase={{ color: '#0ABAB5' }} isRunning={false} size={32} />
              </div>
              <div>
                <h3 className="font-display font-700 text-[#1E3448] text-lg">{selected.name}</h3>
                <p className="text-xs text-[#7A96A0]">{selected.block} · {selected.floor}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { l: 'Capacity',       v: selected.capacity },
                { l: 'Total Cycles',   v: `${selected.cycles} cycles` },
                { l: 'Last Serviced',  v: selected.lastService },
                { l: 'Current Status', v: statusConfig[selected.status].label },
              ].map(({ l, v }) => (
                <div key={l} className="flex justify-between py-2 border-b border-[#F0F7F7]">
                  <span className="text-xs text-[#7A96A0]">{l}</span>
                  <span className="text-xs font-medium text-[#1E3448]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelected(null)} className="flex-1 text-sm font-medium border border-[#E2EEED] text-[#7A96A0] py-2.5 rounded-xl hover:bg-[#F0F7F7]">Close</button>
              {selected.status === 'available' && (
                <button className="flex-1 text-sm font-medium bg-[#0ABAB5] text-white py-2.5 rounded-xl hover:bg-[#09A8A3]">Book This Machine</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
