import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'

const SYSTEM_PROMPT = `You are Washly Assistant, a helpful AI embedded in the Washly smart laundry booking app used by university residence students. 

The app manages All-in-One Commercial Single Drum Units that go through 4 phases per 45-minute cycle:
- Washing (0–40%): drum rotates with detergent and water
- Rinsing (41–65%): flushes out soap and residue
- Spinning (66–85%): high-speed water extraction
- Drying (86–100%): warm air drying cycle

Current mock machine status:
- Washer A1 (Block A): Available
- Washer A2 (Block A): Running – Washing phase (28%, 22 min left)
- Washer A3 (Block A): Available
- Washer B1 (Block B): Running – Rinsing phase (55%, 12 min left)
- Washer B2 (Block B): Running – Spinning phase (78%, 5 min left)
- Washer B3 (Block B): Available
- Washer C1 (Block C): Maintenance (out of service)
- Washer C2 (Block C): Available
- Washer C3 (Block C): Running – Drying phase (92%, 2 min left)

Help students with: checking machine availability, booking guidance, cycle phase questions, troubleshooting, and general laundry tips.
Keep responses short, friendly, and practical. Use emojis sparingly. Never make up booking confirmation numbers.`

export default function Chatbot() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hey ${user?.firstName || 'there'}! 👋 I'm your Washly assistant. Ask me about machine availability, your cycle status, or anything laundry-related!` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    if (open) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setUnread(0) }
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.map(c => c.text || '').join('') || 'Sorry, I had trouble responding. Try again!'
      const botMsg = { role: 'assistant', content: reply }
      setMessages(prev => [...prev, botMsg])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Connection issue. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const quickReplies = ['Which machines are available?', 'What phase is Washer A2 on?', 'How long is a full cycle?', 'How do I book a machine?']

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#0ABAB5] text-white shadow-2xl shadow-[#0ABAB5]/40 flex items-center justify-center hover:bg-[#09A8A3] transition-all hover:scale-105"
        style={{ boxShadow: '0 8px 32px rgba(10,186,181,0.4)' }}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H8l-4 4V5z" fill="white" opacity=".9"/>
              <circle cx="8" cy="9" r="1" fill="#0ABAB5"/>
              <circle cx="11" cy="9" r="1" fill="#0ABAB5"/>
              <circle cx="14" cy="9" r="1" fill="#0ABAB5"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{unread}</span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-[#E2EEED] overflow-hidden"
          style={{ height: '480px', animation: 'slideUp 0.2s ease-out' }}>
          <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0D1B2A] to-[#1E3448] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0ABAB5] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="9" r="3" stroke="white" strokeWidth="1.5"/>
                <circle cx="9" cy="3.5" r="1" fill="white"/>
                <circle cx="14.5" cy="11.5" r="1" fill="white"/>
                <circle cx="3.5" cy="11.5" r="1" fill="white"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-display font-600 text-sm">Washly Assistant</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse"/>
                <p className="text-white/50 text-xs">Online · AI powered</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white/70 transition-colors text-lg leading-none">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFA]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#0ABAB5] flex items-center justify-center text-white text-xs shrink-0 mr-2 mt-0.5">W</div>
                )}
                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#0ABAB5] text-white rounded-tr-sm'
                    : 'bg-white text-[#1E3448] rounded-tl-sm border border-[#E2EEED] shadow-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-[#0ABAB5] flex items-center justify-center text-white text-xs shrink-0 mr-2 mt-0.5">W</div>
                <div className="bg-white border border-[#E2EEED] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#0ABAB5] animate-bounce" style={{ animationDelay: `${i*0.15}s` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick replies — only show at start */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t border-[#F0F7F7]">
              {quickReplies.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(send, 0) }}
                  className="text-xs text-[#0ABAB5] border border-[#0ABAB5]/30 bg-[#E0FAF9] px-2.5 py-1 rounded-full hover:bg-[#0ABAB5] hover:text-white transition-all">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-[#E2EEED] bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about machines, bookings…"
              className="flex-1 text-sm text-[#1E3448] placeholder-[#B0C4C4] bg-[#F0F7F7] rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#0ABAB5]/25 border border-transparent focus:border-[#0ABAB5]/30"
            />
            <button onClick={send} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-[#0ABAB5] text-white flex items-center justify-center hover:bg-[#09A8A3] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l12-5-5 12-2-4-5-3z" fill="white"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
