// src/components/StatusChart.jsx
// UI only — no API calls. Davis will wire real data.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { mockChartData } from '../mock/data.js'

const TEAL = '#0ABAB5'
const TEAL_LIGHT = '#E0FAF9'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0D1B2A', color: '#fff', padding: '8px 14px',
      borderRadius: 10, fontSize: 12, fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    }}>
      <p style={{ color: TEAL, marginBottom: 2 }}>{label}</p>
      <p>{payload[0].value} booking{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function StatusChart({ data = mockChartData, title = 'Bookings Per Hour' }) {
  const maxVal = Math.max(...data.map(d => d.bookings))

  return (
    <div className="bg-white rounded-2xl border border-[#E2EEED] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-700 text-[#1E3448] text-base">{title}</h3>
          <p className="text-xs text-[#7A96A0] mt-0.5">Daily demand pattern</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7A96A0]">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: TEAL }}/>
          Bookings
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2EEED" vertical={false}/>
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: '#7A96A0', fontFamily: 'DM Sans, sans-serif' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7A96A0', fontFamily: 'DM Sans, sans-serif' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: TEAL_LIGHT, radius: 6 }}/>
          <Bar dataKey="bookings" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.bookings === maxVal ? '#09A8A3' : TEAL}
                opacity={entry.bookings === maxVal ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center gap-2 text-xs text-[#7A96A0]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0ABAB5]"/>
        Peak hour: <strong className="text-[#0ABAB5] ml-1">
          {data.find(d => d.bookings === maxVal)?.hour} · {maxVal} bookings
        </strong>
      </div>
    </div>
  )
}
