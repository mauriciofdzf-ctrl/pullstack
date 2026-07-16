export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.svg"
      alt="PullStackMX"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-black text-xl tracking-tight leading-none ${className}`}>
      <span className="text-white">Pull</span>
      <span
        className="bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' }}
      >
        StackMX
      </span>
    </span>
  )
}
