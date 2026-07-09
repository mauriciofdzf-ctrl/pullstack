# PullStack — Contexto para Claude Code

## Qué es este proyecto

PullStack es la **plataforma de confianza para coleccionistas de trading cards deportivas en México y LATAM**. No es solo un e-commerce; compite en educación, pricing, confianza, grading concierge y comunidad. Los deportes cubiertos: NBA, NFL, Soccer, MLB, Pokémon, One Piece.

**Propuesta de valor central:** Responder 5 preguntas mejor que cualquier grupo de Facebook/WhatsApp:
1. ¿Qué carta tengo exactamente?
2. ¿Cuánto vale de verdad?
3. ¿Me conviene vender, holdear o gradear?
4. ¿Cómo la vendo sin que me estafen?
5. ¿Cómo construyo una colección con estrategia?

**URL de producción:** https://pullstack.vercel.app  
**Owner:** Mauricio Fernández (mauriciofdzf@gmail.com)

## Contexto del negocio (crítico para tomar decisiones)

### El ecosistema de cartas deportivas
| Capa | Qué hace |
|------|----------|
| Licencias | Derechos de logos, equipos, ligas (MLB, NBA/Topps 2025+, NFL/Topps 2026+, FIFA/Topps 2031+) |
| Fabricantes | Topps/Fanatics (dominante), Panini (histórico), Upper Deck, Bandai |
| Grading | PSA (mayor liquidez), BGS (subgrades), SGC (vintage+rápido), CGC (TCG) |
| Data | Card Ladder, Market Movers, PSA Pop Report, eBay sold listings |
| Mercado 2ario | eBay, Goldin, Fanatics Collect, Whatnot, grupos informales |

### Tipos de cartas (jerarquía de valor)
- **Rookie Card (RC)** — primera carta oficial de novato; driver especulativo más importante
- **Prospect card** — sale antes del debut (Bowman Chrome 1st en béisbol)
- **Autograph** — on-card auto > sticker auto; RPA = Rookie Patch Auto = lo más premium en NBA/NFL
- **Numbered** — serial limitado (/99, /50, /25, /10, /5, 1/1); escasez ≠ valor automático
- **Parallel** — versión alternativa por color/acabado; cada set tiene jerarquía propia
- **Insert** — diseños especiales (Kaboom, Manga Art, Stained Glass)
- **Memorabilia/Relic** — pieza de jersey/bat; game-worn > player-worn
- **SSP/SP** — short print sin numeración pero producción limitada

### Factores de valor (en orden de peso)
Valor = jugador + carta correcta + escasez + condición + marca + timing + liquidez + narrativa

### Dolores del coleccionista LATAM (por qué PullStack existe)
- Precios en USD, conversión confusa
- Costo real de importación no calculado (envío + impuestos ~18%)
- Poca educación en español sobre grading, parallels, comps
- Grupos informales sin escrow = riesgo de estafa
- Sin comps locales en MXN
- Difícil enviar cartas a PSA desde México

### Monetización planificada
1. Comisión por venta en marketplace
2. **Grading concierge** (fee por carta + envío + seguro + tracking) ← mayor oportunidad a corto plazo
3. Membresía premium (herramientas de pricing, alertas)
4. Autenticación/escrow para transacciones P2P de alto valor
5. Breaks responsables (con transparencia total de odds)

## Stack

- **Frontend:** React 19 + TypeScript + Vite 8
- **Estilos:** Tailwind CSS 4 (vanilla, sin componentes externos)
- **Backend:** Supabase (auth + PostgreSQL + RLS)
- **Deploy:** Vercel (SPA rewrite configurado en vercel.json)
- **Linting:** Oxlint

## Estructura

```
src/
  components/
    Navbar.tsx         — Nav fija: Explorador, Aprende, En Vivo, Comunidad, Rifas, Mensajes
    ChatBot.tsx        — Bot flotante con reglas de keywords (sin IA externa)
    ProtectedRoute.tsx — Guards: ProtectedRoute (auth) y AdminRoute (admin)
    CartDrawer.tsx     — Drawer de checkout con formulario de envío → tabla orders
  contexts/
    AuthContext.tsx    — Session, profile, isAdmin, signIn/signUp/signOut
  lib/
    supabase.ts        — Cliente Supabase (vars de env)
    imageConfig.ts     — URLs de imágenes + localStorage override (admin)
  pages/
    Landing.tsx        — Hero + categorías + trending + live + features + footer
    Marketplace.tsx    — Catálogo (36 items) + filtros + carrito + toggle USD/MXN + colección
    Aprende.tsx        — Tipos de cartas, Grading, Calculadora de grading, Guía LATAM, Valor
    Wallet.tsx         — Colección personal del usuario (collection_items)
    Admin.tsx          — Panel de imágenes (admin only, guarda en localStorage)
    Profile.tsx        — Perfil con tabs: Actividad / Colección / Ajustes
    Login.tsx          — Email+password + errores específicos (Email not confirmed detectado)
    Register.tsx       — Registro con emailRedirectTo dinámico + confirmación clara
    ResetPassword.tsx  — Página de cambio de contraseña (PASSWORD_RECOVERY event)
    Live.tsx / Community.tsx / Raffles.tsx / Messages.tsx
```

## Base de datos (Supabase) — todas las tablas

```sql
-- profiles: auto-creado por trigger handle_new_user
id uuid (FK auth.users), username, display_name, avatar_url, bio
role text ('user' | 'admin'), created_at

-- orders: checkout del carrito (CartDrawer)
id bigint, user_id uuid, items jsonb, total text
contact_name, phone, address, city, state, notes
status text ('pending'|'confirmed'|'paid'|'shipped'|'delivered'|'cancelled')

-- collection_items: Wallet/colección personal
id bigint, user_id uuid, catalog_id int
name, sport, kind, price text, added_at
UNIQUE(user_id, catalog_id)
```

RLS habilitado en todas. Trigger `handle_new_user` auto-crea perfil al registrarse.

**IMPORTANTE:** Ejecutar `supabase_setup.sql` completo en Supabase SQL Editor antes de usar la app.

## Variables de entorno requeridas

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

En producción: Vercel → Project → Settings → Environment Variables.  
En local: archivo `.env.local` (no commitear).

## Decisiones de diseño importantes

- **Dark theme único:** bg-[#0d0d0d] / bg-[#141414] / bg-[#1a1a1a] / bg-[#1d1d1d] inputs. No hay modo claro.
- **Colores de marca:** amber-500 = acción primaria (botones CTA, tabs activos), red-500 = subastas/live, emerald = ventas/éxito, blue = trades. Logo: gradiente amber→orange.
- **Sin componentes UI externos:** todo es Tailwind vanilla. No shadcn, no Radix, no MUI.
- **Imágenes:** Defaults en Unsplash, admin puede overridear desde el panel Admin. Se guardan en Supabase `settings` table (key: `image_overrides`), NO localStorage.
- **TypeScript strict: false** — no forzar tipos estrictos, priorizar velocidad de desarrollo.
- **Supabase cloud only** — sin instancia local de Supabase.

## Convenciones de código

- Componentes en PascalCase, archivos .tsx
- Tailwind inline, sin CSS modules
- No comentarios salvo que el WHY sea no-obvio
- Estado local con useState, no Zustand ni Redux
- Fetch a Supabase directo desde componentes (sin capa de servicios)

## Roles del asistente al trabajar en este proyecto

Cuando se pida ayuda, asumir el rol correspondiente según la tarea:

### Rol: Arquitecto de Auth
Al trabajar en `AuthContext.tsx`, `ProtectedRoute.tsx`, login/registro:
- Priorizar que `setLoading(false)` siempre ocurra DESPUÉS de `await fetchProfile`
- Google OAuth usa `redirectTo: window.location.origin`
- Errores de Supabase siempre traducidos al español antes de mostrarse al usuario
- Forgot password: `supabase.auth.resetPasswordForEmail` con feedback inline

### Rol: Diseñador de UI/UX
Al trabajar en componentes visuales:
- Mantener coherencia dark: [#0a0a0a] fondo, [#111] cards, [#1a1a1a] inputs
- Botón primario: `bg-amber-500 hover:bg-amber-400 text-black font-black`
- Cards con `rounded-2xl border border-white/5 hover:border-amber-500/30`
- Transiciones: `transition-all hover:-translate-y-1`
- Loading spinners: `border-2 border-amber-500 border-t-transparent rounded-full animate-spin`
- Errores: `bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3`

### Rol: Desarrollador de Features
Al agregar nuevas funcionalidades:
- Verificar primero si la tabla de Supabase necesita schema nuevo
- Actualizar `supabase_setup.sql` con el DDL correspondiente
- Accesorios (sport: 'General') pasan cualquier filtro de sport en Marketplace
- `getImages()` siempre con `useMemo(() => getImages(), [])` — lee localStorage

### Rol: Revisor de Calidad
Al hacer code review:
- Checar race conditions en useEffect con async (fetchProfile debe ser awaited)
- useEffect sin deps `[]` = riesgo de infinite re-render
- Campos de formulario deben sincronizarse con `useEffect([profile])` si vienen de async
- Filtros de Marketplace: `item.sport === 'General'` siempre pasa (accesorios universales)

## Comandos útiles

```bash
npm run dev      # Dev server en localhost:5173
npm run build    # Build de producción (tsc + vite build)
npm run lint     # Oxlint
npm run preview  # Preview del build local
```

## Backlog priorizado

### Alta prioridad
- **Grading concierge** — formulario de solicitud + tracking status (tabla `grading_submissions`)
- **Fair Value Score** — mostrar confianza del precio con # de comps reales y fecha última venta
- **Stats reales en Profile** — query a orders + collection_items para mostrar Cartas/Compras/Valor
- **Escrow P2P** — para compraventas de usuario a usuario de alto valor

### Media prioridad
- **LATAM landed cost** mejorado — tipo de cambio live (API) en vez de fijo $17.50
- **Stripe** — CartDrawer actualmente coordina por WhatsApp; necesita Edge Function
- **Avatar file upload** — actualmente solo URL; usar Supabase Storage bucket `avatars`
- **Actividad en Profile** — hardcodeada; necesita query a Supabase (orders + collection)
- **Scanner de cartas** — foto frontal/reverso → identificación automática

### Baja prioridad / futuro
- Breaks responsables (con odds claros, grabación, randomizer verificable)
- Subastas en tiempo real (Supabase Realtime)
- Card identity graph (normalización de nombres para comparar parallels)
- App móvil (React Native o PWA)

## Implementado y estable (no modificar sin revisar)

- `/reset-password` — página completa, funciona con PASSWORD_RECOVERY event de Supabase
- `CartDrawer` — checkout 3 steps (cart → form → success), guarda en tabla `orders`
- `Wallet` (/wallet) — colección personal, guarda en `collection_items`, bookmark desde Marketplace
- `Aprende` (/aprende) — 5 tabs: Tipos, Grading, Calculadora, Valor, Guía LATAM
- `Login` — errores específicos ("Email not confirmed" detectado + botón reenviar confirmación)
- `Register` — `emailRedirectTo: window.location.origin` (funciona en localhost Y producción)
- Avatar URL en Profile — guarda en profiles.avatar_url, visible en Navbar
- Marketplace — toggle USD/MXN, badges RC/Auto/1/1/Numerada, bookmark a colección
