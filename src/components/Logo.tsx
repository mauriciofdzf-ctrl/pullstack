export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  const id = `ps-g-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      {/* Back card */}
      <rect
        x="2" y="8" width="20" height="26" rx="3.5"
        fill={`url(#${id}b)`} opacity="0.38"
        transform="rotate(-11 12 21)"
      />
      {/* Mid card */}
      <rect
        x="5" y="6" width="20" height="26" rx="3.5"
        fill={`url(#${id}b)`} opacity="0.62"
        transform="rotate(-4 15 19)"
      />
      {/* Front card */}
      <rect x="10" y="4" width="22" height="28" rx="4" fill={`url(#${id})`} />
      {/* Shine top-left on front card */}
      <rect x="10" y="4" width="22" height="6" rx="4" fill="white" opacity="0.10" />
      {/* Lightning bolt — the "pull" */}
      <path d="M23 10 L18 19 H22 L19 27 L27 16 H23 Z" fill="white" opacity="0.95" />
    </svg>
  )
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-black text-xl tracking-tight leading-none ${className}`}>
      <span className="text-white">Pull</span>
      <span
        className="bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa 0%, #e879f9 100%)' }}
      >
        Stack
      </span>
    </span>
  )
}
