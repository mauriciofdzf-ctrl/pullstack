import { useNavigate } from 'react-router-dom'
import { useChatRoom, getChatAvatarColor, formatChatTime } from '../lib/useChatRoom'

export default function StreamChat({ room }: { room: string }) {
  const navigate = useNavigate()
  const { user, msgs, input, setInput, sending, online, connected, send, bottomRef } = useChatRoom(room)

  if (!user) return (
    <div className="bg-[#1c1835] border border-white/5 rounded-2xl h-full flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-3xl mb-3">💬</p>
        <p className="text-gray-400 text-sm mb-4">Inicia sesión para chatear en vivo</p>
        <button onClick={() => navigate('/login', { state: { from: '/live' } })}
          className="bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2 rounded-xl text-sm transition-all">
          Iniciar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="bg-[#1c1835] border border-white/5 rounded-2xl flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <p className="text-white font-bold text-sm">Chat en vivo</p>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
          <span className={`text-[10px] ${connected ? 'text-green-400' : 'text-amber-400'}`}>
            {connected ? `${online} viendo` : 'Conectando...'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {msgs.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-600 text-xs text-center px-4">Sé el primero en escribir en el chat</p>
          </div>
        ) : (
          msgs.map(m => {
            const isMe   = m.user_id === user.id
            const isTemp = m.id < 0
            return (
              <div key={m.id} className="flex items-start gap-2">
                <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${getChatAvatarColor(m.user_id)} flex items-center justify-center text-white font-black text-[9px] shrink-0`}>
                  {(m.display_name || 'A').slice(0, 2).toUpperCase()}
                </div>
                <div className={`min-w-0 flex-1 ${isTemp ? 'opacity-60' : ''}`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xs font-bold truncate ${isMe ? 'text-violet-400' : 'text-white'}`}>
                      {isMe ? 'Tú' : m.display_name}
                    </span>
                    <span className="text-gray-600 text-[9px] shrink-0">{formatChatTime(m.created_at)}</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-snug break-words">{m.content}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 border-t border-white/5 shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Escribe un mensaje..."
            maxLength={500}
            disabled={!connected}
            className="flex-1 bg-[#26213d] border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button onClick={send} disabled={!input.trim() || sending || !connected}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-black px-3 py-2 rounded-xl transition-all shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
