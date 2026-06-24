import { useState } from 'react'

const groups = [
  { id: 1, name: 'Coleccionistas NBA 🏀', members: 234, lastMsg: 'CardKing: ¡Saqué un Wemby RC!', time: '2m', unread: 5, img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=100&q=80' },
  { id: 2, name: 'Soccer Cards LATAM ⚽', members: 189, lastMsg: 'MessiFan: Nuevo Panini 2024 llegó', time: '15m', unread: 2, img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&q=80' },
  { id: 3, name: 'NFL Traders MX 🏈', members: 97, lastMsg: 'NFLBreaker: Spot disponible break', time: '1h', unread: 0, img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=100&q=80' },
  { id: 4, name: 'Baseball Collectors ⚾', members: 56, lastMsg: 'BaseballFan: PSA volvió a subir', time: '3h', unread: 0, img: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=100&q=80' },
  { id: 5, name: 'Trading & Offers 🔄', members: 412, lastMsg: 'SlabMaster: Busco Mahomes RC', time: '5h', unread: 12, img: 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=100&q=80' },
]

const dms = [
  { id: 10, name: 'CardKing_MX', lastMsg: 'Te ofrezco el LeBron por...', time: '10m', unread: 1, online: true, img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=100&q=80' },
  { id: 11, name: 'PullMaster', lastMsg: 'Listo, acepto el trade 🤝', time: '2h', unread: 0, online: false, img: 'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=100&q=80' },
  { id: 12, name: 'SlabCollector', lastMsg: '¿Tienes el Messi /150?', time: '1d', unread: 0, online: true, img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&q=80' },
]

const initialMessages = [
  { id: 1, user: 'CardKing_MX', text: '¡Bienvenidos al grupo de coleccionistas NBA! 🏀🔥', time: '9:00 AM', mine: false },
  { id: 2, user: 'PullMaster', text: 'Acaban de sacar el nuevo Prizm 2024, ¿alguien ya lo tiene?', time: '9:05 AM', mine: false },
  { id: 3, user: 'SlabCollector', text: 'Yo abrí una caja ayer, saqué un Wembanyama Silver /149 🔥🔥🔥', time: '9:10 AM', mine: false },
  { id: 4, user: 'Tú', text: '¿A cuánto lo cotizas?', time: '9:12 AM', mine: true },
  { id: 5, user: 'SlabCollector', text: 'Lo mandé a graduar a PSA, si sale 10 lo pongo en $3,500', time: '9:15 AM', mine: false },
  { id: 6, user: 'CardKing_MX', text: 'Si necesitan info del grupo break de este viernes, el link está en el canal de rifas 👆', time: '9:20 AM', mine: false },
]

export default function Messages() {
  const [activeTab, setActiveTab] = useState<'groups' | 'dms'>('groups')
  const [activeChat, setActiveChat] = useState(groups[0])
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  const send = () => {
    if (!input.trim()) return
    setMessages((m) => [...m, { id: Date.now(), user: 'Tú', text: input, time: 'ahora', mine: true }])
    setInput('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16 flex">
      {/* Sidebar */}
      <div className="w-80 shrink-0 border-r border-white/5 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'groups' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Grupos
          </button>
          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'dms' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Mensajes
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input placeholder="Buscar..." className="w-full bg-[#111] border border-white/10 text-white placeholder-gray-600 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50" />
          </div>
        </div>

        {/* Create group button */}
        {activeTab === 'groups' && (
          <div className="px-3 py-2 border-b border-white/5">
            <button className="w-full flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-bold py-2 px-3 rounded-lg hover:bg-amber-500/5 transition-colors border border-amber-500/20 hover:border-amber-500/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear grupo
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {(activeTab === 'groups' ? groups : dms).map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveChat(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors border-b border-white/3 ${activeChat.id === item.id ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''}`}
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden">
                  <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                </div>
                {activeTab === 'dms' && item.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-sm truncate">{item.name}</span>
                  <span className="text-gray-600 text-[10px] shrink-0 ml-1">{item.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-gray-500 text-xs truncate">{item.lastMsg}</span>
                  {item.unread > 0 && (
                    <span className="bg-amber-500 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-1">
                      {item.unread}
                    </span>
                  )}
                </div>
                {activeTab === 'groups' && (
                  <div className="text-gray-700 text-[10px] mt-0.5">{item.members} miembros</div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-[#0d0d0d]">
          <div className="w-9 h-9 rounded-full overflow-hidden">
            <img src={activeChat.img} alt={activeChat.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-white font-bold">{activeChat.name}</div>
            <div className="text-gray-600 text-xs">
              {'members' in activeChat ? `${activeChat.members} miembros` : 'En línea'}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="text-gray-500 hover:text-amber-400 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-amber-400 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.mine ? 'flex-row-reverse' : ''}`}>
              {!m.mine && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-xs shrink-0">
                  {m.user[0]}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md ${m.mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!m.mine && <div className="text-xs text-gray-600 mb-1 ml-1">{m.user}</div>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${m.mine ? 'bg-amber-500 text-black font-medium rounded-br-md' : 'bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-bl-md'}`}>
                  {m.text}
                </div>
                <div className="text-[10px] text-gray-700 mt-1 mx-1">{m.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#0d0d0d]">
          <div className="flex gap-3 items-center">
            <button className="text-gray-600 hover:text-amber-400 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className="flex-1 bg-[#111] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={send}
              className="bg-amber-500 hover:bg-amber-400 text-black p-3 rounded-xl transition-all hover:scale-105 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
