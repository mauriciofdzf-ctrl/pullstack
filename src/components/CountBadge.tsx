export default function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5">
      {n > 9 ? '9+' : n}
    </span>
  )
}
