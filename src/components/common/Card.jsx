export default function Card({ children, className = '', glass = false, onClick }) {
  const base = 'rounded-[24px] border border-outline-variant shadow-sm'
  const bg = glass ? 'glass-card' : 'bg-surface-container-lowest'
  const interactive = onClick ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]' : ''

  return (
    <div className={`${base} ${bg} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
