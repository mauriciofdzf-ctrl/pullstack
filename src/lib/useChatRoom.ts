import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from './supabase'

export type ChatMsg = {
  id: number
  user_id: string
  display_name: string
  room: string
  content: string
  created_at: string
}

const AVATAR_COLORS = [
  'from-violet-500 to-fuchsia-700',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-teal-600',
  'from-red-500 to-pink-600',
]

export function getChatAvatarColor(id: string) {
  let h = 0; for (const c of id) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export function useChatRoom(room: string) {
  const { user, profile } = useAuth()

  const [msgs, setMsgs]           = useState<ChatMsg[]>([])
  const [input, setInput]         = useState('')
  const [sending, setSending]     = useState(false)
  const [online, setOnline]       = useState(0)
  const [connected, setConnected] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  // IDs of messages sent by this client — lets Realtime skip duplicates
  const sentIds    = useRef(new Set<number>())
  // Always-fresh profile ref so subscribe callback doesn't go stale
  const profileRef = useRef(profile)
  profileRef.current = profile

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
    const content      = input.trim()
    const tempId        = -(Date.now())        // negative → never clashes with real bigint IDs
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

  return { user, msgs, input, setInput, sending, online, connected, send, bottomRef }
}
