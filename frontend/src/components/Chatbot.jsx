import { useState, useRef, useEffect } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'

// ---------- Pre‑written answers for chips (no AI) ----------
const CHIP_ANSWERS = {
  'available': '✅ Available machines right now: Machine 1 (Ground Floor), Machine 4 (First Floor East), Machine 6 (First Floor West), Machine 7 (Second Floor Central), Machine 8 (Second Floor Central). Machine 2 is in use, Machine 5 under maintenance.',
  'my_booking': '❌ You have no active bookings. Go to Dashboard, find an available machine, and tap “Book Now” to start a cycle.',
  'cycle_length': '⏱️ A full cycle takes 45 minutes: Washing (0‑40%), Rinsing (41‑65%), Spinning (66‑85%), Drying (86‑100%).',
  'how_to_book': '📖 1) Dashboard → 2) Pick available machine → 3) Tap “Book Now” → 4) Choose time → 5) Confirm. You’ll get a notification when done.',
  'machine5': '🔧 Machine 5 is in maintenance (drum sensor replacement). Expected back tomorrow.',
  'emergency': '📞 Emergency support: +27 31 907 7111 (Mon‑Fri 8am‑6pm). For urgent issues, also contact your residence advisor.'
}

// System prompt for Groq (used only for free‑text typed questions)
const SYSTEM_PROMPT = `You are Washly Assistant, an AI for a university laundry booking app called Washly.  
You help students with:  
- Checking machine availability (mock data: Machine 1,4,6,7,8 available; Machine 2 running Washing 28%; Machine 3 running Rinsing 55%; Machine 5 maintenance)  
- Booking or cancelling laundry slots  
- Understanding wash phases (Washing 0-40%, Rinsing 41-65%, Spinning 66-85%, Drying 86-100%)  
- Troubleshooting (e.g., "machine not starting")  

You MUST refuse to answer anything unrelated to laundry, booking, or Washly.  
If asked about anything else, reply: "I'm here only for laundry & Washly questions. Please use the chips below or ask about machine status, booking, or cycle phases."  
Keep answers short, friendly, and practical. Use emojis sparingly.`

export default function Chatbot() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [sessionActive, setSessionActive] = useState(true)
  const [lastAIMessageId, setLastAIMessageId] = useState(null) // for feedback
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  let timeoutId = useRef(null)

  // Session timeout: 5 minutes of inactivity
  const resetTimeout = () => {
    if (timeoutId.current) clearTimeout(timeoutId.current)
    timeoutId.current = setTimeout(() => {
      if (open && sessionActive) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⏰ Session timed out due to inactivity. Please close and reopen the chat to start again.', id: Date.now() }])
        setSessionActive(false)
      }
    }, 5 * 60 * 1000)
  }

  // Initial greeting when chat opens
  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = `Hey ${user?.firstName || 'there'}! 👋 I'm your Washly assistant.\n\nTap a chip below or type your question.`
      setMessages([{ role: 'assistant', content: greeting, id: Date.now() }])
      setSessionActive(true)
      resetTimeout()
    }
  }, [open, user])

  // Auto‑scroll and unread counter
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      if (messages.length > 0 && messages[messages.length-1].role === 'assistant') {
        setUnread(0)
      }
    }
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  // Send a message (chip or typed)
  const sendMessage = async (text, isChip = false) => {
    const message = text?.trim()
    if (!message || loading || !sessionActive) return
    setInput('')
    resetTimeout()

    // Add user message
    const userMsg = { role: 'user', content: message, id: Date.now() }
    setMessages(prev => [...prev, userMsg])

    // Handle chip answers (pre‑written, no AI)
    if (isChip && CHIP_ANSWERS[message]) {
      const botMsg = { role: 'assistant', content: CHIP_ANSWERS[message], id: Date.now() + 1 }
      setMessages(prev => [...prev, botMsg])
      setLastAIMessageId(null) // chips don't need feedback
      return
    }

    // Otherwise, call Groq for free‑text question
    setLoading(true)
    try {
      const token = await getToken()
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          systemPrompt: SYSTEM_PROMPT,
          conversationHistory: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await res.json()
      if (res.ok) {
        const reply = data.reply || 'Sorry, I could not respond.'
        const botMsg = { role: 'assistant', content: reply, id: Date.now() + 1, awaitingFeedback: true }
        setMessages(prev => [...prev, botMsg])
        setLastAIMessageId(botMsg.id)
      } else {
        throw new Error(data.error || 'Request failed')
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue. Please try again or use the chips.', id: Date.now() + 1 }])
    } finally {
      setLoading(false)
    }
  }

  // Feedback handler (thumbs up/down)
  const giveFeedback = (messageId, isPositive) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: isPositive ? '👍' : '👎', awaitingFeedback: false } : msg
    ))
    // In a real app you could send this feedback to a backend endpoint
    console.log(`Feedback for message ${messageId}: ${isPositive ? 'positive' : 'negative'}`)
    setLastAIMessageId(null)
  }

  // Chips definitions – each chip sends a specific key that maps to CHIP_ANSWERS
  const chips = [
    { label: '📋 Available machines', key: 'available' },
    { label: '📌 My booked machine', key: 'my_booking' },
    { label: '⏱️ Cycle length', key: 'cycle_length' },
    { label: '📖 How to book', key: 'how_to_book' },
    { label: '🔧 Machine 5 status', key: 'machine5' },
    { label: '📞 Emergency', key: 'emergency' }
  ]

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#0ABAB5] text-white shadow-2xl shadow-[#0ABAB5]/40 flex items-center justify-center hover:bg-[#09A8A3] transition-all hover:scale-105"
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
            {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">{unread}</span>}
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-[#E2EEED] overflow-hidden" style={{ height: '540px' }}>
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

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFA]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-[#0ABAB5] flex items-center justify-center text-white text-xs shrink-0 mr-2 mt-0.5">W</div>}
                <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#0ABAB5] text-white rounded-tr-sm'
                    : 'bg-white text-[#1E3448] rounded-tl-sm border border-[#E2EEED] shadow-sm'
                }`}>
                  {msg.content}
                  {msg.awaitingFeedback && (
                    <div className="flex gap-2 mt-2 pt-1 border-t border-[#E2EEED]/50">
                      <button onClick={() => giveFeedback(msg.id, true)} className="text-xs text-green-600 hover:text-green-800">👍 Helpful</button>
                      <button onClick={() => giveFeedback(msg.id, false)} className="text-xs text-red-500 hover:text-red-700">👎 Not helpful</button>
                    </div>
                  )}
                  {msg.feedback && <div className="text-right text-[10px] text-gray-400 mt-1">Feedback: {msg.feedback}</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-[#0ABAB5] flex items-center justify-center text-white text-xs shrink-0 mr-2 mt-0.5">W</div>
                <div className="bg-white border border-[#E2EEED] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                  {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#0ABAB5] animate-bounce" style={{ animationDelay: `${i*0.15}s` }}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Sticky chip bar (scrollable) */}
          <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-[#E2EEED] bg-white sticky bottom-0">
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => sendMessage(chip.key, true)}
                disabled={!sessionActive || loading}
                className="flex-shrink-0 text-xs text-[#0ABAB5] border border-[#0ABAB5]/30 bg-[#E0FAF9] px-3 py-1.5 rounded-full hover:bg-[#0ABAB5] hover:text-white transition-all disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input area (disabled if session expired) */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-[#E2EEED] bg-white">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input, false)}
              placeholder={sessionActive ? "Type your question..." : "Session expired. Close and reopen."}
              className="flex-1 text-sm text-[#1E3448] placeholder-[#B0C4C4] bg-[#F0F7F7] rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#0ABAB5]/25 border border-transparent focus:border-[#0ABAB5]/30"
              disabled={!sessionActive}
            />
            <button onClick={() => sendMessage(input, false)} disabled={!input.trim() || loading || !sessionActive}
              className="w-9 h-9 rounded-xl bg-[#0ABAB5] text-white flex items-center justify-center hover:bg-[#09A8A3] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l12-5-5 12-2-4-5-3z" fill="white"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}