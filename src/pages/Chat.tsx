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

type ChatRoom = { id: string; label: string; icon: string; custom?: boolean }

const BASE_ROOMS: ChatRoom[] = [
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
  const navigate = useNavigate()

  const [room, setRoom]       = useState('general')
  const [msgs, setMsgs]       = useState<ChatMsg[]>([])
  const [input, setInput]     = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline]   = useState(0)
  const [connected, setConnected] = useState(false)
  const [rooms, setRooms]     = useState<ChatRoom[]>(BASE_ROOMS)

  const bottomRef  = useRef<HTMLDivElement>(null)
  // IDs of messages sent by this client — lets Realtime skip duplicates
  const sentIds    = useRef(new Set<number>())
  // Always-fresh profile ref so subscribe callback doesn't go stale
  const profileRef = useRef(profile)
  profileRef.current = profile

  // Load custom rooms from settings
  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'chat_rooms').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const custom: ChatRoom[] = JSON.parse(data.value)
            if (Array.isArray(custom) && custom.length > 0)
              setRooms([...BASE_ROOMS, ...custom.map(r => ({ ...r, custom: true }))])
          } catch { /* noop */ }
        }
      })
  }, [])

  // Fetch history + subscribe on room / user change
  useEffect(() => {
    if (!user) return
    let mounted = true
    setMsgs([])
    setConnected(false)

    // 1. Load history
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (mounted) setMsgs((data as ChatMsg[]) || [])
      })

    // 2. Realtime — NO column filter (filter client-side for reliability)
    //    Supabase requires REPLICA IDENTITY FULL for column-filtered subscriptions;
    //    filtering client-side avoids that requirement and is more reliable.
    const ch = supabase
      .channel(`chat:${room}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, payload => {
        const msg = payload.new as ChatMsg
        if (msg.room !== room) return           // client-side room filter
        if (sentIds.current.has(msg.id)) {
          sentIds.current.delete(msg.id)
          return                                 // already shown optimistically
        }
        if (!mounted) return
        setMsgs(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      })
      .on('presence', { event: 'sync' }, () => {
        if (mounted) setOnline(Object.keys(ch.presenceState()).length)
      })
      .on('presence', { event: 'leave' }, () => {
        if (mounted) setOnline(Object.keys(ch.presenceState()).length)
      })
      .subscribe(async status => {
        if (!mounted) return
        setConnected(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') {
          await ch.track({
            user_id:      user.id,
            display_name: profileRef.current?.display_name || 'Anon',
          })
        }
      })

    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [room, user])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async () => {
    if (!input.trim() || !user || sending) return
    const content   = input.trim()
    const tempId    = -(Date.now())            // negative → never clashes with real bigint IDs
    const displayName = profileRef.current?.display_name || user.email?.split('@')[0] || 'Anon'

    setInput('')
    setSending(true)

    // Optimistic: show immediately for the sender
    setMsgs(prev => [...prev, {
      id: tempId, user_id: user.id, display_name: displayName,
      room, content, created_at: new Date().toISOString(),
    }])

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ user_id: user.id, display_name: displayName, room, content })
      .select()
      .single()

    if (data) {
      const real = data as ChatMsg
      sentIds.current.add(real.id)            // Realtime will skip this ID
      setMsgs(prev => prev.map(m => m.id === tempId ? real : m))
    } else {
      // Roll back on error
      setMsgs(prev => prev.filter(m => m.id !== tempId))
      console.error('Chat error:', error?.message)
    }
    setSending(false)
  }

  if (!user) return (
    <div className="min-h-screen bg-[#0c0a1e] pt-24 pb-16 px-4 flex items-center justify-center">
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

  const currentRoom = rooms.find(r => r.id === room)

  return (
    <div className="bg-[#0c0a1e] pt-16" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="flex flex-1 min-h-0 max-w-6xl mx-auto w-full">

        {/* Sidebar de rooms */}
        <div className="w-16 sm:w-52 border-r border-white/5 bg-[#0c0a1e] flex flex-col shrink-0">
          <div className="p-3 sm:p-4 border-b border-white/5">
            <p className="text-white font-black text-sm hidden sm:block">Chat</p>
            <p className="text-gray-600 text-[10px] hidden sm:block mt-0.5">
              {connected
                ? online > 0
                  ? <span className="text-green-400 font-bold">{online} en línea</span>
                  : <span className="text-green-400 font-bold">Conectado</span>
                : <span className="text-amber-400 animate-pulse">Conectando...</span>
              }
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {rooms.map(r => (
              <button key={r.id} onClick={() => setRoom(r.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                  room === r.id
                    ? 'bg-violet-500/10 border-r-2 border-violet-500 text-violet-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/3'
                }`}>
                <span className="text-lg shrink-0">{r.icon}</span>
                <span className="text-sm font-bold hidden sm:block truncate flex-1">{r.label}</span>
                {r.custom && <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-amber-500/60 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Room header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
            <span className="text-xl">{currentRoom?.icon}</span>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">#{currentRoom?.label}</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className={`text-[10px] ${connected ? 'text-green-400' : 'text-amber-400'}`}>
                  {connected ? `${online} en línea` : 'Conectando...'}
                </span>
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
                const isMe     = m.user_id === user.id
                const isTemp   = m.id < 0
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
                      <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed transition-opacity ${
                        isMe
                          ? `bg-violet-600 text-white font-medium rounded-tr-md ${isTemp ? 'opacity-60' : 'opacity-100'}`
                          : 'bg-[#26213d] border border-white/5 text-gray-200 rounded-tl-md'
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
                disabled={!connected}
                className="flex-1 bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button onClick={send} disabled={!input.trim() || sending || !connected}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-black px-4 py-2.5 rounded-xl transition-all shrink-0">
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
