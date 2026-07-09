import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Post = {
  id: number
  user_id: string
  display_name: string
  title: string
  body: string | null
  sport: string
  likes: number
  created_at: string
}

const SPORTS = ['Todos', 'NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General']

const SPORT_COLORS: Record<string, string> = {
  NBA:        'text-orange-400 bg-orange-500/10 border-orange-500/20',
  NFL:        'text-green-400  bg-green-500/10  border-green-500/20',
  Soccer:     'text-blue-400   bg-blue-500/10   border-blue-500/20',
  MLB:        'text-red-400    bg-red-500/10    border-red-500/20',
  'Pokémon':  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'One Piece':'text-violet-400  bg-violet-500/10  border-violet-500/20',
  General:    'text-gray-400   bg-gray-500/10   border-gray-500/20',
}

const AVATAR_COLORS = [
  'from-violet-500 to-fuchsia-700',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-teal-600',
]

function getColor(str: string) {
  let h = 0; for (const c of str) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  if (m < 1440) return `hace ${Math.floor(m / 60)}h`
  return `hace ${Math.floor(m / 1440)}d`
}

export default function Community() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts]       = useState<Post[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('Todos')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState('')
  const [body, setBody]         = useState('')
  const [sport, setSport]       = useState('General')
  const [submitting, setSubmitting] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())

  useEffect(() => { fetchPosts() }, [filter])

  async function fetchPosts() {
    setLoading(true)
    let q = supabase.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50)
    if (filter !== 'Todos') q = q.eq('sport', filter)
    const { data } = await q
    setPosts(data || [])
    setLoading(false)
  }

  async function submitPost() {
    if (!user || !title.trim()) return
    setSubmitting(true)
    const { error } = await supabase.from('community_posts').insert({
      user_id:      user.id,
      display_name: profile?.display_name || user.email?.split('@')[0] || 'Coleccionista',
      title:        title.trim(),
      body:         body.trim() || null,
      sport,
      likes:        0,
    })
    setSubmitting(false)
    if (!error) {
      setTitle(''); setBody(''); setShowForm(false)
      fetchPosts()
    }
  }

  async function toggleLike(post: Post) {
    if (!user) { navigate('/login'); return }
    const isLiked = likedIds.has(post.id)
    const newLikes = Math.max(0, post.likes + (isLiked ? -1 : 1))
    setLikedIds(prev => { const s = new Set(prev); isLiked ? s.delete(post.id) : s.add(post.id); return s })
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, likes: newLikes } : p))
    await supabase.from('community_posts').update({ likes: newLikes }).eq('id', post.id)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-3xl font-black mb-1">Comunidad</h1>
            <p className="text-gray-400 text-sm">Coleccionistas de México y LATAM</p>
          </div>
          {user ? (
            <button onClick={() => setShowForm(!showForm)}
              className="bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2.5 rounded-xl text-sm transition-all">
              + Publicar
            </button>
          ) : (
            <button onClick={() => navigate('/login')}
              className="bg-[#1a1a1a] border border-white/10 hover:border-violet-500/30 text-gray-300 font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
              Iniciar sesión
            </button>
          )}
        </div>

        {/* New post form */}
        {showForm && user && (
          <div className="bg-[#1a1a1a] border border-violet-500/20 rounded-2xl p-5 mb-6 animate-in fade-in duration-200">
            <h3 className="text-white font-bold mb-4">Nueva publicación</h3>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Título *"
              className="w-full bg-[#1d1d1d] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-violet-500/50 transition-colors" />
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Descripción, preguntas, pulls del día... (opcional)"
              rows={3}
              className="w-full bg-[#1d1d1d] border border-white/10 text-white rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-violet-500/50 resize-none transition-colors" />
            <div className="flex items-center gap-3 flex-wrap">
              <select value={sport} onChange={e => setSport(e.target.value)}
                className="bg-[#1d1d1d] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                {SPORTS.filter(s => s !== 'Todos').map(s => <option key={s}>{s}</option>)}
              </select>
              <div className="flex-1" />
              <button onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-white text-sm transition-colors">Cancelar</button>
              <button onClick={submitPost} disabled={submitting || !title.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-black font-black px-4 py-2 rounded-xl text-sm transition-all">
                {submitting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        )}

        {!user && (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">Inicia sesión para publicar y darle like a posts</p>
            <button onClick={() => navigate('/login')}
              className="bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all">
              Iniciar sesión
            </button>
          </div>
        )}

        {/* Sport filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {SPORTS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${
                filter === s
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                  : 'bg-[#1a1a1a] border-white/5 text-gray-400 hover:text-white hover:border-white/10'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-600 text-sm">Cargando...</div>
        ) : posts.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-white font-bold mb-1">Sin publicaciones aún</h3>
            <p className="text-gray-500 text-sm">Sé el primero en publicar en esta categoría.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getColor(p.user_id)} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                      {(p.display_name || 'C').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm">{p.display_name || 'Coleccionista'}</span>
                      <span className="text-gray-600 text-xs ml-2">{timeAgo(p.created_at)}</span>
                    </div>
                  </div>
                  {p.sport && p.sport !== 'General' && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${SPORT_COLORS[p.sport] || SPORT_COLORS.General}`}>
                      {p.sport}
                    </span>
                  )}
                </div>
                <h3 className="text-white font-bold mb-1">{p.title}</h3>
                {p.body && <p className="text-gray-400 text-sm leading-relaxed">{p.body}</p>}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                  <button onClick={() => toggleLike(p)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${likedIds.has(p.id) ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}>
                    <svg className="w-4 h-4" fill={likedIds.has(p.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {p.likes || 0}
                  </button>
                  {user?.id === p.user_id && (
                    <button onClick={async () => {
                      await supabase.from('community_posts').delete().eq('id', p.id)
                      setPosts(ps => ps.filter(x => x.id !== p.id))
                    }} className="text-gray-600 hover:text-red-400 text-xs transition-colors ml-auto">
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
