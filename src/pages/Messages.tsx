import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Msg = {
  id: number
  user_id: string
  content: string
  from_admin: boolean
  created_at: string
}

const QUICK = [
  '¿Cómo envío mi carta a gradear?',
  '¿Cuánto cuesta el grading desde México?',
  '¿Tienen seguro para cartas en tránsito?',
  '¿Aceptan cartas de Pokémon para CGC?',
  '¿Cuánto tarda el proceso completo?',
  '¿Cómo vendo una carta en PullStack?',
]

const WELCOME = (name: string) =>
  `¡Hola ${name}! 👋 Soy el equipo de PullStack. ¿En qué te puedo ayudar? Puedes preguntarme sobre grading concierge, compra/venta de cartas, envíos desde México, breaks y rifas, o cualquier duda sobre tu colección.`

export default function Messages() {
  const { user, profile } = useAuth()
  const navigate  = useNavigate()
  const [msgs, setMsgs]     = useState<Msg[]>([])
  const [input, setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setMsgs([{
            id: 0,
            user_id:    'admin',
            content:    WELCOME(profile?.display_name || user.email?.split('@')[0] || 'Coleccionista'),
            from_admin: true,
            created_at: new Date().toISOString(),
          }])
        } else {
          setMsgs(data)
        }
        setLoaded(true)
      })
  }, [user, profile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = async () => {
    if (!input.trim() || !user || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    const tmp: Msg = { id: Date.now(), user_id: user.id, content, from_admin: false, created_at: new Date().toISOString() }
    setMsgs(prev => [...prev, tmp])
    await supabase.from('messages').insert({ user_id: user.id, content, from_admin: false })
    setSending(false)
  }

  if (!user) return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-white text-2xl font-black mb-2">Mensajes</h2>
        <p className="text-gray-400 text-sm mb-6">Inicia sesión para chatear con el equipo de PullStack</p>
        <button onClick={() => navigate('/login', { state: { from: '/messages' } })}
          className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-2.5 rounded-xl transition-all">
          Iniciar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-[#0a0a0a] pt-16" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0 px-4">

        {/* Chat header */}
        <div className="flex items-center gap-3 py-4 border-b border-white/5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-black font-black text-sm">PS</span>
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-sm">PullStack Support</div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-400 text-xs">En línea · responde en &lt;24h</span>
            </div>
          </div>
          <a href="/grading"
            className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-all">
            Grading →
          </a>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
          {!loaded && <div className="text-center text-gray-600 text-sm py-8">Cargando...</div>}
          {msgs.map(m => (
            <div key={m.id} className={`flex ${m.from_admin ? 'justify-start' : 'justify-end'}`}>
              {m.from_admin && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-[10px] mr-2 shrink-0 mt-0.5">
                  PS
                </div>
              )}
              <div className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.from_admin
                  ? 'bg-[#1a1a1a] border border-white/5 text-gray-300 rounded-tl-md'
                  : 'bg-amber-500 text-black font-medium rounded-tr-md'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions (only when few messages) */}
        {loaded && msgs.length <= 2 && (
          <div className="py-3 border-t border-white/5 shrink-0">
            <p className="text-gray-600 text-xs mb-2">Preguntas frecuentes:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK.map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="bg-[#1a1a1a] border border-white/10 hover:border-amber-500/30 text-gray-400 hover:text-amber-400 text-xs px-3 py-1.5 rounded-lg transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="py-3 border-t border-white/5 shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-[#1a1a1a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button onClick={send} disabled={!input.trim() || sending}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black px-4 py-2.5 rounded-xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
