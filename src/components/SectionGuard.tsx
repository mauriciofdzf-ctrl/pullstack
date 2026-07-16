import { useNavigate } from 'react-router-dom'
import { type SectionKey, useSections } from '../contexts/SectionsContext'

export default function SectionGuard({ section, children }: { section: SectionKey; children: React.ReactNode }) {
  const sections = useSections()
  const navigate  = useNavigate()

  if (!sections[section]) {
    return (
      <div className="min-h-screen bg-[#0c0a1e] pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-5">🔧</div>
          <h2 className="text-white text-2xl font-black mb-2">Próximamente</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Esta sección está temporalmente desactivada.<br />Vuelve pronto.
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-2.5 rounded-xl transition-all">
            Ir al Mercado →
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
