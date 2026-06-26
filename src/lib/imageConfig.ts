// ─── Config central de imágenes ──────────────────────────────────────────────
// Todas las imágenes de la app se definen aquí.
// El panel /admin sobreescribe estos defaults en localStorage.
// ─────────────────────────────────────────────────────────────────────────────

export type ImageKey =
  // NBA
  | 'nba1' | 'nba2' | 'nba3' | 'nba4'
  // NFL
  | 'nfl1' | 'nfl2' | 'nfl3'
  // Soccer
  | 'soccer1' | 'soccer2' | 'soccer3'
  // MLB
  | 'mlb1' | 'mlb2'
  // TCG
  | 'pokemon1' | 'onepiece1'
  // Genérico
  | 'cards'

export const IMAGE_LABELS: Record<ImageKey, string> = {
  nba1:      '🏀 NBA — Canasta / Arena',
  nba2:      '🏀 NBA — Jugador en aros',
  nba3:      '🏀 NBA — Duelo en cancha',
  nba4:      '🏀 NBA — Mate / Acción',
  nfl1:      '🏈 NFL — Estadio panorámico',
  nfl2:      '🏈 NFL — Acción en campo',
  nfl3:      '🏈 NFL — Línea de scrimmage',
  soccer1:   '⚽ Soccer — Disparo al arco',
  soccer2:   '⚽ Soccer — Disputa de balón',
  soccer3:   '⚽ Soccer — Tiro libre',
  mlb1:      '⚾ MLB — Bateador',
  mlb2:      '⚾ MLB — Estadio béisbol',
  pokemon1:  '🃏 Pokémon TCG — Cartas reales',
  onepiece1: '🏴‍☠️ One Piece TCG — Anime/merch',
  cards:     '🃏 Genérico — Trading cards',
}

export const IMAGE_SECTIONS: { label: string; keys: ImageKey[] }[] = [
  { label: 'NBA',        keys: ['nba1', 'nba2', 'nba3', 'nba4'] },
  { label: 'NFL',        keys: ['nfl1', 'nfl2', 'nfl3'] },
  { label: 'Soccer',     keys: ['soccer1', 'soccer2', 'soccer3'] },
  { label: 'MLB',        keys: ['mlb1', 'mlb2'] },
  { label: 'Pokémon',    keys: ['pokemon1'] },
  { label: 'One Piece',  keys: ['onepiece1'] },
  { label: 'Genéricas',  keys: ['cards'] },
]

export const IMAGE_DEFAULTS: Record<ImageKey, string> = {
  nba1:      'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=800&q=95&auto=format&fit=crop',
  nba2:      'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=95&auto=format&fit=crop',
  nba3:      'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=95&auto=format&fit=crop',
  nba4:      'https://images.unsplash.com/photo-1578432014316-48b448d79d57?w=800&q=95&auto=format&fit=crop',
  nfl1:      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=95&auto=format&fit=crop',
  nfl2:      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=95&auto=format&fit=crop&crop=center',
  nfl3:      'https://images.unsplash.com/photo-1531873252757-2dcf08a23e93?w=800&q=95&auto=format&fit=crop',
  soccer1:   'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=95&auto=format&fit=crop',
  soccer2:   'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=95&auto=format&fit=crop',
  soccer3:   'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=95&auto=format&fit=crop',
  mlb1:      'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=800&q=95&auto=format&fit=crop',
  mlb2:      'https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=800&q=95&auto=format&fit=crop',
  pokemon1:  'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&q=95&auto=format&fit=crop',
  onepiece1: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=95&auto=format&fit=crop',
  cards:     'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=1200&q=95&auto=format&fit=crop',
}

const STORAGE_KEY = 'pullstack_images_v1'

export function getImages(): Record<ImageKey, string> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return { ...IMAGE_DEFAULTS, ...saved }
  } catch {
    return { ...IMAGE_DEFAULTS }
  }
}

export function saveImage(key: ImageKey, url: string): void {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    saved[key] = url
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {/* silencioso */}
}

export function resetImages(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getOverrides(): Partial<Record<ImageKey, string>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}
