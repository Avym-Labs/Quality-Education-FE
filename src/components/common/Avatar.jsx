export default function Avatar({ name = '', src, size = 'md', online = false, rank, border = false }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const rankColors = { 1: 'bg-yellow-400', 2: 'bg-slate-400', 3: 'bg-orange-400' }

  return (
    <div className="relative inline-block">
      <div className={`${sizes[size]} rounded-full overflow-hidden ${border ? 'border-2 border-primary' : ''}`}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary-fixed flex items-center justify-center">
            <span className="font-bold text-primary">{initials}</span>
          </div>
        )}
      </div>
      {online && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
      )}
      {rank && (
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${rankColors[rank] || 'bg-gray-400'} rounded-full border-2 border-white flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{rank}</span>
        </div>
      )}
    </div>
  )
}
