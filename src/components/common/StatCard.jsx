export default function StatCard({ icon, label, value, badge, accent = 'primary', filled = false }) {
  const accents = {
    primary: {
      bg: filled ? 'bg-primary-container' : 'bg-surface-container-lowest',
      iconBg: filled ? 'bg-white/20' : 'bg-primary-fixed',
      iconColor: filled ? 'text-white' : 'text-primary',
      label: filled ? 'text-white/80' : 'text-on-surface-variant',
      value: filled ? 'text-white' : 'text-on-surface',
      badge: filled ? 'bg-white/20 text-white' : 'bg-primary-fixed-dim text-primary',
      blob: filled ? 'bg-white/10' : 'bg-primary-fixed',
    },
    tertiary: {
      bg: 'bg-surface-container-lowest',
      iconBg: 'bg-tertiary-fixed',
      iconColor: 'text-tertiary',
      label: 'text-on-surface-variant',
      value: 'text-on-surface',
      badge: 'bg-tertiary-fixed-dim text-tertiary',
      blob: 'bg-tertiary-fixed',
    },
  }
  const a = accents[accent] || accents.primary

  return (
    <div className={`${a.bg} p-stack-md rounded-[24px] shadow-sm border border-outline-variant flex flex-col justify-between relative overflow-hidden group`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${a.blob} opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500`} />
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl ${a.iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${a.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded ${a.badge}`}>{badge}</span>
        )}
      </div>
      <div>
        <p className={`text-label-md font-medium ${a.label}`}>{label}</p>
        <p className={`text-headline-lg font-semibold ${a.value}`}>{value}</p>
      </div>
    </div>
  )
}
