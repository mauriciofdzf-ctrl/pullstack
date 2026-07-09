import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type ChatMsg = {
  id: number
  user_id: string
  display_name: string
  room: string
  content: string
  created_at: string
}

const ROOMS = [
  { id: 'general',   label: 'General',    icon: '💬' },
  { id: 'nba',       label: 'NBA',        icon: '🏀' },
  { id: 'nfl',       label: 'NFL',        icon: '🏈' },
  { id: 'soccer',    label: 'Soccer',     icon: '⚽' },
  { id: 'mlb',       label: 'MLB',        icon: '⚾' },
  { id: 'pokemon',   label: 'Pokémon',    icon: '🃏' },
  { id: 'onepiece',  label: 'One Piece',  icon: '🏴‍☠️' },
  { id: 'grading',   label: 'Grading',    icon: '🔬' },
]

const AVATAR_COLORS = [
  'from-violet-500 to-fuchsia-700',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-teal-600',
  'from-red-500 to-pink-600',
]

function getColor(id: string) {
  let h = 0; for (const c of id) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function timeLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const { user, profile } = useAuth()
  const navigate  = useNavigate()
  const [room, setRoom]     = useState('general')
  const [msgs, setMsgs]     = useState<ChatMsg[]>([])
  const [input, setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    loadMessages()
    const ch = supabase
      .channel(`chat:${room}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room=eq.${room}`,
      }, payload => {
        setMsgs(prev => [...prev, payload.new as ChatMsg])
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState()
        setOnline(Object.keys(state).length)
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED' && user) {
          await ch.track({ user_id: user.id, display_name: profile?.display_name || 'Anon' })
        }
      })
    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [room, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const loadMessages = async () => {
    setMsgs([])
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(80)
    setMsgs((data as ChatMsg[]) || [])
  }

  const send = async () => {
    if (!input.trim() || !user || sending) return
    if (!user) { navigate('/login', { state: { from: '/chat' } }); return }
    const content = input.trim()
    setInput('')
    setSending(true)
    await supabase.from('chat_messages').insert({
      user_id:      user.id,
      display_name: profile?.display_name || user.email?.split('@')[0] || 'Anon',
      room,
      content,
    })
    setSending(false)
  }

  if (!user) return (
    <div className="min-h-screen bg-[#090c14] pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-white text-2xl font-black mb-2">Chat de Coleccionistas</h2>
        <p className="text-gray-400 text-sm mb-6">Inicia sesión para unirte a la conversación</p>
        <button onClick={() => navigate('/login', { state: { from: '/chat' } })}
          className="bg-violet-600 hover:bg-violet-500 text-white font-black px-6 py-2.5 rounded-xl transition-all">
          Iniciar sesión
        </button>
      </div>
    </div>
  )

  const currentRoom = ROOMS.find(r => r.id === room)

  return (
    <div className="bg-[#090c14] pt-16" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="flex flex-1 min-h-0 max-w-6xl mx-auto w-full">

        {/* Sidebar de rooms */}
        <div className="w-16 sm:w-52 border-r border-white/5 bg-[#090c14] flex flex-col shrink-0">
          <div className="p-3 sm:p-4 border-b border-white/5">
            <p className="text-white font-black text-sm hidden sm:block">Chat</p>
            <p className="text-gray-600 text-[10px] hidden sm:block mt-0.5">
              {online > 0 ? <span className="text-green-400 font-bold">{online} en línea</span> : 'Conectando...'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {ROOMS.map(r => (
              <button key={r.id} onClick={() => setRoom(r.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                  room === r.id
                    ? 'bg-violet-500/10 border-r-2 border-violet-500 text-violet-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                }`}>
                <span className="text-lg shrink-0">{r.icon}</span>
                <span className="text-sm font-bold hidden sm:block truncate">{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Room header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
            <span className="text-xl">{currentRoom?.icon}</span>
            <div>
              <p className="text-white font-bold text-sm">#{currentRoom?.label}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-green-400 text-[10px]">{online} en línea</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {msgs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl block mb-2">{currentRoom?.icon}</span>
                  <p className="text-gray-600 text-sm">Sé el primero en escribir en #{currentRoom?.label}</p>
                </div>
              </div>
            ) : (
              msgs.map((m, i) => {
                const isMe = m.user_id === user?.id
                const prevSame = i > 0 && msgs[i - 1].user_id === m.user_id
                return (
                  <div key={m.id} className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!prevSame && (
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getColor(m.user_id)} flex items-center justify-center text-white font-black text-[10px] shrink-0 mt-0.5`}>
                        {(m.display_name || 'A').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {prevSame && <div className="w-8 shrink-0" />}
                    <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!prevSame && (
                        <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-white text-xs font-bold">{isMe ? 'Tú' : m.display_name}</span>
                          <span className="text-gray-600 text-[10px]">{timeLabel(m.created_at)}</span>
                        </div>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-violet-600 text-white font-medium rounded-tr-md'
                          : 'bg-[#191d28] border border-white/5 text-gray-200 rounded-tl-md'
                      }`}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/5 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={`Mensaje en #${currentRoom?.label}...`}
                maxLength={500}
                className="flex-1 bg-[#191d28] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              <button onClick={send} disabled={!input.trim() || sending}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-black font-black px-4 py-2.5 rounded-xl transition-all shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
