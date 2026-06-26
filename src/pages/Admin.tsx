import { useState, useEffect } from 'react'
import {
  IMAGE_DEFAULTS,
  IMAGE_LABELS,
  IMAGE_SECTIONS,
  getOverrides,
  saveImage,
  resetImages,
  type ImageKey,
} from '../lib/imageConfig'

// ─── Preview de imagen individual ────────────────────────────────────────────
function ImageSlot({ imgKey }: { imgKey: ImageKey }) {
  const overrides = getOverrides()
  const isCustom   = imgKey in overrides
  const currentUrl = isCustom ? overrides[imgKey]! : IMAGE_DEFAULTS[imgKey]

  const [input,   setInput]   = useState(currentUrl)
  const [preview, setPreview] = useState(currentUrl)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState(false)
  const [custom,  setCustom]  = useState(isCustom)

  const handlePreview = (url: string) => {
    setInput(url)
    setPreview(url)
    setError(false)
  }

  const handleSave = () => {
    if (!input.trim()) return
    saveImage(imgKey, input.trim())
    setCustom(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    const saved = getOverrides()
    delete saved[imgKey]
    localStorage.setItem('pullstack_images_v1', JSON.stringify(saved))
    setInput(IMAGE_DEFAULTS[imgKey])
    setPreview(IMAGE_DEFAULTS[imgKey])
    setCustom(false)
    setError(false)
  }

  return (
    <div className={`bg-[#0d0d0d] rounded-2xl overflow-hidden border transition-all ${custom ? 'border-violet-500/40' : 'border-white/5'}`}>
      {/* Preview */}
      <div className="relative h-44 overflow-hidden bg-[#0e0e1e]">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-600">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">URL inválida</p>
          </div>
        ) : (
          <img
            key={preview}
            src={preview}
            alt={IMAGE_LABELS[imgKey]}
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        {custom && (
          <div className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            ✓ Personalizada
          </div>
        )}
        <p className="absolute bottom-2 left-3 text-white text-xs font-bold drop-shadow">{IMAGE_LABELS[imgKey]}</p>
      </div>

      {/* Editor */}
      <div className="p-3 space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handlePreview(e.target.value)}
          placeholder="https://... (Unsplash, Cloudinary, Drive público, etc.)"
          className="w-full bg-[#0e0e1e] border border-white/10 text-white placeholder-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-violet-500/50 font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}
          >
            {saved ? '✓ Guardado' : 'Guardar'}
          </button>
          {custom && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-400 transition-all border border-white/5"
              title="Volver al default"
            >
              ↩ Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────
export default function Admin() {
  const [activeSection, setActiveSection] = useState(IMAGE_SECTIONS[0].label)
  const [overridesCount, setOverridesCount] = useState(0)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    setOverridesCount(Object.keys(getOverrides()).length)
  }, [activeSection, resetDone])

  const handleResetAll = () => {
    if (!confirm('¿Resetear TODAS las imágenes a los defaults? Esta acción no se puede deshacer.')) return
    resetImages()
    setResetDone(true)
    setTimeout(() => setResetDone(false), 2500)
  }

  const currentSection = IMAGE_SECTIONS.find((s) => s.label === activeSection)!

  return (
    <div className="min-h-screen bg-[#06060f] pt-20 pb-16 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-2">PullStack · Creator</p>
            <h1 className="text-4xl font-black text-white mb-1">Panel de Imágenes</h1>
            <p className="text-gray-500 text-sm">Personaliza las fotos de la plataforma. Los cambios se aplican al instante.</p>
          </div>
          <div className="text-right shrink-0">
            {overridesCount > 0 && (
              <p className="text-violet-400 text-sm font-bold mb-2">
                {overridesCount} imagen{overridesCount !== 1 ? 's' : ''} personalizada{overridesCount !== 1 ? 's' : ''}
              </p>
            )}
            <button
              onClick={handleResetAll}
              className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${resetDone ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-white/3 border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400'}`}
            >
              {resetDone ? '✓ Reseteado' : '↩ Reset todo a defaults'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-violet-600/5 border border-violet-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
          <span className="text-2xl shrink-0">💡</span>
          <div className="text-sm text-gray-400 leading-relaxed">
            <strong className="text-amber-300">¿Cómo funciona?</strong> Pega cualquier URL de imagen (Unsplash, Google Photos, Cloudinary, etc.) y haz clic en <strong className="text-white">Guardar</strong>. El preview se actualiza al instante. Los cambios se guardan localmente en tu navegador y se aplican en toda la app.
            <br />
            <span className="text-gray-600 text-xs mt-1 block">
              Para producción: sube tus fotos a <a href="https://cloudinary.com" target="_blank" className="text-violet-400 underline">Cloudinary</a> (gratis) y usa esa URL. Evita URLs de Google Drive o WhatsApp — no funcionan en producción.
            </span>
          </div>
        </div>

        {/* Tabs por sección */}
        <div className="flex gap-2 flex-wrap mb-8">
          {IMAGE_SECTIONS.map((s) => {
            const overrides = getOverrides()
            const customCount = s.keys.filter((k) => k in overrides).length
            return (
              <button
                key={s.label}
                onClick={() => setActiveSection(s.label)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all relative ${activeSection === s.label ? 'bg-violet-600 text-white' : 'bg-[#0e0e1e] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400'}`}
              >
                {s.label}
                {customCount > 0 && (
                  <span className={`ml-2 text-[10px] font-black ${activeSection === s.label ? 'text-black/60' : 'text-violet-400'}`}>
                    {customCount}✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Grid de slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentSection.keys.map((key) => (
            <ImageSlot key={key} imgKey={key} />
          ))}
        </div>

        {/* Dónde se usan */}
        <div className="mt-10 bg-[#0e0e1e] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">¿Dónde se usa cada imagen?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { slot: 'NBA 1-4',       where: 'Landing (categoría NBA), Marketplace (cartas NBA), Tienda (cajas NBA)' },
              { slot: 'NFL 1-3',       where: 'Landing (categoría NFL), Marketplace (cartas NFL), Tienda (cajas NFL)' },
              { slot: 'Soccer 1-3',    where: 'Landing (categoría Soccer), Marketplace (cartas soccer), Tienda (cajas soccer)' },
              { slot: 'MLB 1-2',       where: 'Landing (categoría MLB), Marketplace (cartas MLB), Tienda (cajas MLB)' },
              { slot: 'Pokémon 1',     where: 'Landing (categoría Pokémon), Marketplace (cartas Pokémon), Tienda (cajas TCG)' },
              { slot: 'One Piece 1',   where: 'Landing (categoría One Piece), Marketplace (cartas One Piece), Tienda (cajas One Piece)' },
              { slot: 'Genérica',      where: 'Accesorios en tienda, sección de grupos en Mensajes, backgrounds hero' },
            ].map((row, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-violet-400 font-bold shrink-0 text-xs pt-0.5 w-24">{row.slot}</span>
                <span className="text-gray-500 text-xs leading-relaxed">{row.where}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips de URLs buenas */}
        <div className="mt-6 bg-[#0e0e1e] border border-white/5 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">✅ URLs que funcionan bien</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold shrink-0">✓</span>
              <span><strong className="text-white">Unsplash:</strong> <code className="text-amber-300">https://images.unsplash.com/photo-ID?w=600&q=90</code> — Gratis, rápido, sin copyright.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold shrink-0">✓</span>
              <span><strong className="text-white">Cloudinary:</strong> <code className="text-amber-300">https://res.cloudinary.com/TU-CLOUD/image/upload/foto.jpg</code> — Sube tus propias fotos.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 font-bold shrink-0">✓</span>
              <span><strong className="text-white">Imgur:</strong> <code className="text-amber-300">https://i.imgur.com/CODIGO.jpg</code> — Para imágenes públicas.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0">✗</span>
              <span><strong className="text-gray-300">Google Drive / Fotos / WhatsApp</strong> — Bloquean carga desde otros dominios.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-400 font-bold shrink-0">✗</span>
              <span><strong className="text-gray-300">Instagram / Twitter</strong> — Protegen sus CDNs.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
