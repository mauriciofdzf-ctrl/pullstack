import { useState } from 'react'

const INITIAL_POSTS = [
  { id: 1, user: 'CardKing_MX',       avatar: 'CK', time: 'hace 2h',  img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=80', caption: '¡PULL DEL AÑO! 🔥 Cooper Flagg RC Auto de una caja de Topps Now. No lo puedo creer. #1 pick, #1 en mi colección. ¿Alguien tiene idea del PSA 10? #PullStack #CooperFlagg #Topps', likes: 2400, sport: 'NBA',      comments: [{ user: 'PullFanatic', text: '¡Que animal! Vale fácil $28k en PSA 10' }, { user: 'SlabCollector', text: 'Mándala ya a gradear amigo 🔥🔥' }] },
  { id: 2, user: 'MessiCollector',    avatar: 'MC', time: 'hace 4h',  img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80', caption: 'Mi colección completa de Lamine Yamal 🐐 Desde su primera carta de La Masia hasta el SuperFractor. Años de búsqueda. No está en venta (por ahora 👀) #Yamal #Soccer #Topps', likes: 1890, sport: 'Soccer',   comments: [{ user: 'YamalTrader', text: 'El SuperFractor por favor 😭 hazte una oferta' }] },
  { id: 3, user: 'NFLBreaker',        avatar: 'NB', time: 'hace 6h',  img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&q=80', caption: 'Box break de Panini Prizm NFL 2025 hoy a las 8PM. Cam Ward, Jaxson Dart, Quinn Ewers. Quedan 2 spots de Panthers disponibles 🏈 DM para apartar. #NFL #Prizm #GroupBreak', likes: 567, sport: 'NFL',      comments: [{ user: 'PanthersFan', text: 'Me apunto al spot de Panthers!' }] },
  { id: 4, user: 'BaseballFan_GDL',  avatar: 'BF', time: 'hace 1d',  img: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=600&q=80', caption: 'Ohtani Bowman Chrome RC recién graduada PSA 10 🎰 La mandé hace 3 meses y por fin llegó el resultado. Vale cada centavo. #Ohtani #MLB #PSA10 #Bowman', likes: 923, sport: 'MLB',      comments: [{ user: 'BaseballPro', text: 'Hermosa 😍 cuánto quieres?' }, { user: 'SlabMaster', text: 'PSA 10 de Bowman Chrome es difícil, felicidades' }] },
  { id: 5, user: 'PokéBreaker_MX',   avatar: 'PB', time: 'hace 2d',  img: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&q=80', caption: '¡Saqué el Mewtwo ex Special Art Rare del SV151! 😭 Abrí 4 cajas japonesas para esto. Lleva a gradeo BGS esta semana. #Pokémon #SV151 #MewtwoEx #PullStack', likes: 3200, sport: 'Pokémon',  comments: [{ user: 'PokeCollector', text: '¡INCREÍBLE! eso vale $400+ en PSA 10' }, { user: 'CardKing_MX', text: 'Mándala a BGS no PSA, mejor para Pokémon' }] },
]

const SUGGESTED = [
  { user: 'PrizmHunter',   pulls: 234, sport: '🏀 NBA',       online: true },
  { user: 'SlabMaster',    pulls: 189, sport: '⚡ Pokémon',   online: false },
  { user: 'BoxBreaker_Pro',pulls: 412, sport: '🏈 NFL',       online: true },
  { user: 'YamalTrader',   pulls: 98,  sport: '⚽ Soccer',    online: true },
]

const TAGS = ['#Prizm2025', '#PSA10', '#CooperFlagg', '#Yamal', '#BoxBreak', '#Topps', '#PullStack', '#Wembanyama', '#Charizard', '#OnePiece']

const AVATAR_COLORS = ['from-amber-400 to-amber-600', 'from-purple-400 to-purple-600', 'from-blue-400 to-blue-600', 'from-green-400 to-green-600', 'from-red-400 to-red-600']

export default function Community() {
  const [posts, setPosts]         = useState(INITIAL_POSTS)
  const [liked, setLiked]         = useState<Set<number>>(new Set())
  const [followed, setFollowed]   = useState<Set<string>>(new Set())
  const [openComments, setOpenComments] = useState<Set<number>>(new Set())
  const [commentInput, setCommentInput] = useState<Record<number, string>>({})
  const [showNewPost, setShowNewPost]   = useState(false)
  const [newCaption, setNewCaption]     = useState('')
  const [newSport, setNewSport]         = useState('NBA')
  const [activeFilter, setActiveFilter] = useState('Todo')

  const toggleLike = (id: number) => {
    setLiked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setPosts((prev) => prev.map((p) => p.id === id
      ? { ...p, likes: liked.has(id) ? p.likes - 1 : p.likes + 1 }
      : p
    ))
  }

  const toggleComments = (id: number) => {
    setOpenComments((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const addComment = (id: number) => {
    const text = (commentInput[id] || '').trim()
    if (!text) return
    setPosts((prev) => prev.map((p) =>
      p.id === id ? { ...p, comments: [...p.comments, { user: 'Tú', text }] } : p
    ))
    setCommentInput((prev) => ({ ...prev, [id]: '' }))
  }

  const toggleFollow = (user: string) => {
    setFollowed((prev) => {
      const next = new Set(prev)
      next.has(user) ? next.delete(user) : next.add(user)
      return next
    })
  }

  const publishPost = () => {
    if (!newCaption.trim()) return
    const newPost = {
      id: Date.now(),
      user: 'Tú',
      avatar: 'TÚ',
      time: 'ahora',
      img: 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=600&q=80',
      caption: newCaption,
      likes: 0,
      sport: newSport,
      comments: [],
    }
    setPosts((prev) => [newPost, ...prev])
    setNewCaption('')
    setShowNewPost(false)
  }

  const filters = ['Todo', 'NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece']
  const filtered = activeFilter === 'Todo' ? posts : posts.filter((p) => p.sport === activeFilter)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Feed ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header + filtros */}
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">PullStack</p>
                <h1 className="text-2xl font-black text-white">Comunidad</h1>
              </div>
              <button
                onClick={() => setShowNewPost(true)}
                className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-lg transition-all hover:scale-105"
              >
                + Publicar
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeFilter === f ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-500/30'}`}>
                  {f}
                </button>
              ))}
            </div>

            {/* Modal nuevo post */}
            {showNewPost && (
              <div className="bg-[#111] border border-amber-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-xs">TÚ</div>
                  <p className="text-white font-bold text-sm">Nueva publicación</p>
                </div>
                <textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="¿Qué pull tuviste? ¿Qué piensas del mercado? Comparte con la comunidad..."
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:border-amber-500/50"
                />
                <div className="flex items-center gap-3">
                  <select value={newSport} onChange={(e) => setNewSport(e.target.value)}
                    className="bg-[#1a1a1a] border border-white/10 text-gray-400 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-amber-500/50">
                    {['NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => setShowNewPost(false)} className="text-gray-500 hover:text-gray-300 text-xs font-bold px-4 py-2 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={publishPost} disabled={!newCaption.trim()} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-black px-5 py-2 rounded-lg transition-all">Publicar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Posts */}
            {filtered.map((post, pi) => (
              <div key={post.id} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[pi % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                    {post.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm">{post.user}</div>
                    <div className="text-gray-600 text-xs">{post.time}</div>
                  </div>
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">{post.sport}</span>
                  {post.user !== 'Tú' && (
                    <button onClick={() => toggleFollow(post.user)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all shrink-0 ${followed.has(post.user) ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-white/10 text-gray-500 hover:border-amber-500/30 hover:text-amber-400'}`}>
                      {followed.has(post.user) ? 'Siguiendo' : 'Seguir'}
                    </button>
                  )}
                </div>

                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0d0d0d]">
                  <img src={post.img} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Actions */}
                <div className="px-4 pt-3 pb-2 flex items-center gap-4">
                  <button onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 transition-colors text-sm font-medium ${liked.has(post.id) ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}>
                    <svg className="w-5 h-5" fill={liked.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes.toLocaleString()}
                  </button>
                  <button onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.comments.length}
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-500 hover:text-amber-400 transition-colors text-sm ml-auto">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Compartir
                  </button>
                </div>

                {/* Caption */}
                <div className="px-4 pb-3">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    <span className="text-white font-bold mr-1">{post.user}</span>
                    {post.caption}
                  </p>
                </div>

                {/* Comments section */}
                {openComments.has(post.id) && (
                  <div className="border-t border-white/5 px-4 py-3 space-y-2.5">
                    {post.comments.map((c, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-white font-bold shrink-0">{c.user}</span>
                        <span className="text-gray-400">{c.text}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Agrega un comentario..."
                        value={commentInput[post.id] || ''}
                        onChange={(e) => setCommentInput((p) => ({ ...p, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addComment(post.id)}
                        className="flex-1 bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
                      />
                      <button onClick={() => addComment(post.id)} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-3 py-2 rounded-lg text-xs transition-all">→</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-5">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 text-sm">Coleccionistas populares</h3>
              <div className="space-y-3">
                {SUGGESTED.map((u, i) => (
                  <div key={u.user} className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                      {u.user.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm truncate">{u.user}</div>
                      <div className="text-gray-600 text-xs">{u.sport} · {u.pulls} pulls</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {u.online && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                      <button onClick={() => toggleFollow(u.user)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${followed.has(u.user) ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-white/10 text-gray-500 hover:border-amber-500/30 hover:text-amber-400'}`}>
                        {followed.has(u.user) ? '✓' : 'Seguir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4 text-sm">Trending 🔥</h3>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button key={tag} onClick={() => {}}
                    className="bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-amber-400 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-3 text-sm">Próximos eventos</h3>
              <div className="space-y-3">
                {[
                  { label: 'Break NFL Prizm 2025', date: 'Jul 2 · 8PM', type: 'Break' },
                  { label: 'Rifa Flagg RC Auto',   date: 'Jul 5 · 10PM', type: 'Rifa' },
                  { label: 'Live Pokémon 151',     date: 'Jul 7 · 9PM',  type: 'Live' },
                ].map((ev) => (
                  <div key={ev.label} className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ev.type === 'Live' ? 'bg-red-600/20 text-red-400' : ev.type === 'Break' ? 'bg-purple-600/20 text-purple-400' : 'bg-amber-500/20 text-amber-400'}`}>{ev.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{ev.label}</p>
                      <p className="text-gray-600 text-[10px]">{ev.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
