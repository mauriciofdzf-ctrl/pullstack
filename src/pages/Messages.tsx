import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LogoIcon } from '../components/Logo'

type SupportMsg = {
  id: number
  user_id: string
  content: string
  from_admin: boolean
  created_at: string
}

type DM = {
  id: number
  from_user_id: string
  to_user_id: string
  from_name: string
  to_name: string
  content: string
  listing_id: number | null
  listing_title: string | null
  action_type: string
  bid_amount: string | null
  read: boolean
  created_at: string
}

type Conversation = {
  partnerId: string
  partnerName: string
  lastMessage: string
  lastAt: string
  unread: number
  listingTitle: string | null
}

const QUICK = [
  '¿Cómo envío mi carta a gradear?',
  '¿Cuánto cuesta el grading desde México?',
  '¿Tienen seguro para cartas en tránsito?',
  '¿Cuánto tarda el proceso completo?',
  '¿Cómo vendo una carta en PullStack?',
  '¿Aceptan todas las cartas?',
]

const WELCOME = (name: string) =>
  `¡Hola ${name}! 👋 Bienvenido a PullStack. Puedes preguntarme sobre grading concierge, compra/venta de cartas, envíos desde México, o cualquier duda sobre tu colección. ¿En qué te puedo ayudar?`

const ACTION_LABEL: Record<string, string> = {
  buy: '🛒 Compra', auction: '🔨 Puja', trade: '🔄 Trade', general: '💬'
}

export default function Messages() {
  const { user, profile } = useAuth()
  const navigate   = useNavigate()
  const [params]   = useSearchParams()

  const [tab, setTab] = useState<'dms' | 'support'>(params.get('tab') === 'support' ? 'support' : 'dms')

  // Support chat
  const [supportMsgs, setSupportMsgs] = useState<SupportMsg[]>([])
  const [supportInput, setSupportInput] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [supportLoaded, setSupportLoaded]   = useState(false)
  const supportBottom = useRef<HTMLDivElement>(null)

  // DMs
  const [dms, setDms]           = useState<DM[]>([])
  const [dmsLoading, setDmsL]   = useState(false)
  const [activeConv, setActiveConv] = useState<string | null>(null) // partnerId
  const [replyInput, setReplyInput] = useState('')
  const [replySending, setReplySending] = useState(false)
  const dmBottom = useRef<HTMLDivElement>(null)

  // ── Support ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || tab !== 'support') return
    supabase.from('messages').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setSupportMsgs(data?.length
          ? data as SupportMsg[]
          : [{ id: 0, user_id: 'admin', from_admin: true, created_at: new Date().toISOString(),
               content: WELCOME(profile?.display_name || user.email?.split('@')[0] || 'Coleccionista') }]
        )
        setSupportLoaded(true)
      })
  }, [user, profile, tab])

  useEffect(() => { supportBottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [supportMsgs])

  const sendSupport = async () => {
    if (!supportInput.trim() || !user || supportSending) return
    const content = supportInput.trim()
    setSupportInput(''); setSupportSending(true)
    setSupportMsgs(p => [...p, { id: Date.now(), user_id: user.id, content, from_admin: false, created_at: new Date().toISOString() }])
    await supabase.from('messages').insert({ user_id: user.id, content, from_admin: false })
    setSupportSending(false)
  }

  // ── DMs ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || tab !== 'dms') return
    loadDMs()

    // Abrir conversación si viene de marketplace
    const partner = params.get('partner')
    if (partner) setActiveConv(partner)
  }, [user, tab])

  useEffect(() => { dmBottom.current?.scrollIntoView({ behavior: 'smooth' }) }, [dms, activeConv])

  const loadDMs = async () => {
    if (!user) return
    setDmsL(true)
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
    setDms((data || []) as DM[])
    setDmsL(false)
  }

  const markRead = async (partnerId: string) => {
    if (!user) return
    await supabase.from('direct_messages')
      .update({ read: true })
      .eq('to_user_id', user.id)
      .eq('from_user_id', partnerId)
    setDms(prev => prev.map(d => d.from_user_id === partnerId && d.to_user_id === user.id ? { ...d, read: true } : d))
  }

  const openConv = (partnerId: string) => {
    setActiveConv(partnerId)
    markRead(partnerId)
  }

  const sendReply = async () => {
    if (!replyInput.trim() || !user || !activeConv || replySending) return
    const content = replyInput.trim()
    setReplyInput(''); setReplySending(true)
    const partnerName = conversations.find(c => c.partnerId === activeConv)?.partnerName || 'Usuario'
    const { data } = await supabase.from('direct_messages').insert({
      from_user_id: user.id,
      to_user_id: activeConv,
      from_name: profile?.display_name || user.email?.split('@')[0] || 'Usuario',
      to_name: partnerName,
      content,
      action_type: 'general',
      read: false,
    }).select().single()
    if (data) setDms(prev => [data as DM, ...prev])
    setReplySending(false)
  }

  // Agrupar DMs en conversaciones
  const conversations: Conversation[] = []
  const seen = new Set<string>()
  const sorted = [...dms].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  for (const dm of sorted) {
    const partnerId   = dm.from_user_id === user?.id ? dm.to_user_id : dm.from_user_id
    const partnerName = dm.from_user_id === user?.id ? dm.to_name    : dm.from_name
    if (seen.has(partnerId)) continue
    seen.add(partnerId)
    const unread = dms.filter(d => d.from_user_id === partnerId && d.to_user_id === user?.id && !d.read).length
    conversations.push({ partnerId, partnerName, lastMessage: dm.content, lastAt: dm.created_at, unread, listingTitle: dm.listing_title })
  }

  // Mensajes de la conversación activa
  const convMsgs = activeConv
    ? [...dms].filter(d => (d.from_user_id === activeConv && d.to_user_id === user?.id) || (d.from_user_id === user?.id && d.to_user_id === activeConv))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : []

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0)

  // ── Unauthenticated ───────────────────────────────────────────────────────────
  if (!user) return (
    <div className="min-h-screen bg-[#0c0a1e] pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-white text-2xl font-black mb-2">Mensajes</h2>
        <p className="text-gray-400 text-sm mb-6">Inicia sesión para ver tus mensajes</p>
        <button onClick={() => navigate('/login', { state: { from: '/messages' } })}
          className="bg-violet-600 hover:bg-violet-500 text-white font-black px-6 py-2.5 rounded-xl transition-all">
          Iniciar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-[#0c0a1e] pt-16" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-4 pb-2 border-b border-white/5 shrink-0">
          <button onClick={() => setTab('dms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'dms' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            💬 Mensajes directos
            {totalUnread > 0 && <span className="bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{totalUnread}</span>}
          </button>
          <button onClick={() => setTab('support')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'support' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            🎧 Soporte PullStack
          </button>
        </div>

        {/* ── DMs ── */}
        {tab === 'dms' && (
          <div className="flex flex-1 min-h-0">
            {/* Lista de conversaciones */}
            <div className={`w-full sm:w-72 border-r border-white/5 flex flex-col shrink-0 ${activeConv ? 'hidden sm:flex' : 'flex'}`}>
              <div className="p-4 border-b border-white/5">
                <p className="text-white font-bold text-sm">Conversaciones</p>
                <p className="text-gray-600 text-xs mt-0.5">{conversations.length} conversaciones</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {dmsLoading ? (
                  <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-gray-500 text-sm font-medium">Sin mensajes aún</p>
                    <p className="text-gray-700 text-xs mt-1 leading-relaxed">Cuando alguien te contacte por un anuncio, aparecerá aquí.</p>
                    <button onClick={() => navigate('/marketplace')}
                      className="mt-4 bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-bold px-4 py-2 rounded-xl hover:bg-violet-600/20 transition-all">
                      Explorar Mercado →
                    </button>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button key={conv.partnerId} onClick={() => openConv(conv.partnerId)}
                      className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/3 transition-all ${activeConv === conv.partnerId ? 'bg-violet-600/10 border-r-2 border-r-violet-500' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                          {conv.partnerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm font-bold truncate ${conv.unread > 0 ? 'text-white' : 'text-gray-300'}`}>{conv.partnerName}</p>
                            {conv.unread > 0 && <span className="bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0">{conv.unread}</span>}
                          </div>
                          {conv.listingTitle && <p className="text-violet-400 text-[10px] font-bold truncate">{conv.listingTitle}</p>}
                          <p className="text-gray-600 text-[10px] truncate mt-0.5">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Conversación activa */}
            <div className={`flex-1 flex flex-col min-h-0 ${!activeConv ? 'hidden sm:flex' : 'flex'}`}>
              {!activeConv ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-4xl mb-3">👈</p>
                    <p className="text-gray-500 text-sm">Selecciona una conversación</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header de la conv */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
                    <button onClick={() => setActiveConv(null)} className="sm:hidden text-gray-500 hover:text-white mr-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs">
                      {(conversations.find(c => c.partnerId === activeConv)?.partnerName || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{conversations.find(c => c.partnerId === activeConv)?.partnerName || 'Usuario'}</p>
                      {conversations.find(c => c.partnerId === activeConv)?.listingTitle && (
                        <p className="text-violet-400 text-[10px]">Re: {conversations.find(c => c.partnerId === activeConv)?.listingTitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {convMsgs.map(m => {
                      const isMe = m.from_user_id === user.id
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-[10px] shrink-0">
                              {m.from_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className={`max-w-xs lg:max-w-sm ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            {m.action_type && m.action_type !== 'general' && (
                              <span className="text-[9px] text-gray-600 mb-0.5 px-1">{ACTION_LABEL[m.action_type] || m.action_type}</span>
                            )}
                            {m.listing_title && (
                              <div className="bg-[#26213d] border border-violet-500/20 rounded-xl px-3 py-2 mb-1 text-[10px] text-violet-400 font-bold">
                                📋 {m.listing_title}
                                {m.bid_amount && <span className="ml-2 text-red-400">Puja: {m.bid_amount}</span>}
                              </div>
                            )}
                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-violet-600 text-white rounded-br-md' : 'bg-[#26213d] border border-white/5 text-gray-200 rounded-bl-md'}`}>
                              {m.content}
                            </div>
                            <span className="text-gray-700 text-[9px] mt-0.5 px-1">
                              {new Date(m.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={dmBottom} />
                  </div>

                  {/* Input respuesta */}
                  <div className="px-4 py-3 border-t border-white/5 shrink-0">
                    <div className="flex gap-2">
                      <input
                        value={replyInput}
                        onChange={e => setReplyInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                        placeholder="Escribe tu respuesta..."
                        className="flex-1 bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                      />
                      <button onClick={sendReply} disabled={!replyInput.trim() || replySending}
                        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Soporte ── */}
        {tab === 'support' && (
          <div className="flex flex-col flex-1 min-h-0 px-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 py-4 border-b border-white/5 shrink-0">
              <LogoIcon size={40} />
              <div className="flex-1">
                <div className="text-white font-bold text-sm">PullStack Support</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-green-400 text-xs">En línea · responde en &lt;24h</span>
                </div>
              </div>
              <a href="/grading" className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-violet-500/20 transition-all">
                Grading →
              </a>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
              {!supportLoaded && <div className="text-center text-gray-600 text-sm py-8">Cargando...</div>}
              {supportMsgs.map(m => (
                <div key={m.id} className={`flex ${m.from_admin ? 'justify-start' : 'justify-end'}`}>
                  {m.from_admin && (
                    <div className="w-7 h-7 mr-2 shrink-0 mt-0.5">
                      <LogoIcon size={28} />
                    </div>
                  )}
                  <div className={`max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.from_admin ? 'bg-[#26213d] border border-white/5 text-gray-300 rounded-tl-md' : 'bg-violet-600 text-white font-medium rounded-tr-md'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={supportBottom} />
            </div>

            {supportLoaded && supportMsgs.length <= 2 && (
              <div className="py-3 border-t border-white/5 shrink-0">
                <p className="text-gray-600 text-xs mb-2">Preguntas frecuentes:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map(q => (
                    <button key={q} onClick={() => setSupportInput(q)}
                      className="bg-[#26213d] border border-white/10 hover:border-violet-500/30 text-gray-400 hover:text-violet-400 text-xs px-3 py-1.5 rounded-lg transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="py-3 border-t border-white/5 shrink-0">
              <div className="flex gap-2">
                <input value={supportInput} onChange={e => setSupportInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupport() } }}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                <button onClick={sendSupport} disabled={!supportInput.trim() || supportSending}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-black px-4 py-2.5 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
