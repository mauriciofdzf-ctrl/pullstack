const posts = [
  { user: 'CardKing_MX', avatar: 'CK', time: 'hace 2h', img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=80', caption: '¡PULL DEL AÑO! 🔥 LeBron James RC PSA 10 de una caja de Topps Chrome. No lo puedo creer. Esta carta lleva 3 meses en mi lista de deseos. #PullStack #LeBron #PSA10', likes: 2400, comments: 89, sport: 'NBA' },
  { user: 'MessiCollector', avatar: 'MC', time: 'hace 4h', img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80', caption: 'Mi colección completa de Messi 🐐 Desde su rookie hasta su última Panini Select. Años de búsqueda. No está en venta (por ahora 👀) #Messi #SoccerCards #Panini', likes: 1890, comments: 134, sport: 'Soccer' },
  { user: 'NFLBreaker', avatar: 'NB', time: 'hace 6h', img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&q=80', caption: 'Box break de Panini Prizm NFL 2024 en vivo hoy a las 8pm. Quedan 3 spots disponibles. ¿Quién va por Chiefs? 🏈 DM para apartar tu spot. #NFLCards #Prizm #GroupBreak', likes: 567, comments: 43, sport: 'NFL' },
  { user: 'BaseballFan_GDL', avatar: 'BF', time: 'hace 1d', img: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=600&q=80', caption: 'Ohtani Bowman Chrome RC recién graduada PSA 10 🎰 La mandé hace 3 meses y por fin llegó el resultado. Vale cada centavo. #Ohtani #MLB #PSA #Bowman', likes: 923, comments: 67, sport: 'MLB' },
]

const suggested = [
  { user: 'PrizmHunter', pulls: 234, img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=100&q=80' },
  { user: 'SlabMaster', pulls: 189, img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&q=80' },
  { user: 'BoxBreaker_Pro', pulls: 412, img: 'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=100&q=80' },
  { user: 'ToppsCollector', pulls: 98, img: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=100&q=80' },
]

export default function Community() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-black text-white">Comunidad</h1>
              <button className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-lg transition-all">
                + Publicar
              </button>
            </div>

            {posts.map((post) => (
              <div key={post.user + post.time} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                {/* Post header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-sm">
                    {post.avatar}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{post.user}</div>
                    <div className="text-gray-600 text-xs">{post.time}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {post.sport}
                    </span>
                  </div>
                </div>

                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={post.img} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Actions */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-5">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes.toLocaleString()}
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-400 transition-colors text-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition-colors text-sm ml-auto">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Compartir
                  </button>
                </div>

                {/* Caption */}
                <div className="px-4 pb-4">
                  <p className="text-gray-300 text-sm leading-relaxed mt-2">
                    <span className="text-white font-bold mr-1">{post.user}</span>
                    {post.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Suggested users */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">Coleccionistas populares</h3>
              <div className="space-y-4">
                {suggested.map((u) => (
                  <div key={u.user} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden">
                      <img src={u.img} alt={u.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm">{u.user}</div>
                      <div className="text-gray-600 text-xs">{u.pulls} pulls</div>
                    </div>
                    <button className="text-amber-400 hover:text-amber-300 text-xs font-bold border border-amber-500/30 hover:border-amber-500/60 px-3 py-1.5 rounded-lg transition-all">
                      Seguir
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending tags */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
              <h3 className="text-white font-bold mb-4">Trending</h3>
              <div className="flex flex-wrap gap-2">
                {['#Prizm2024', '#PSA10', '#LeBron', '#Messi', '#BoxBreak', '#Topps', '#PullStack', '#Panini'].map((tag) => (
                  <span key={tag} className="bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-amber-400 text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
