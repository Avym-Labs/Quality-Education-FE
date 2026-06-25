import { useEffect } from 'react'

const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' }
const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-error-container border-error text-error',
  info: 'bg-surface-container border-outline-variant text-on-surface',
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
}
const iconColors = { success: 'text-green-600', error: 'text-error', info: 'text-primary', warning: 'text-orange-600' }

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl border shadow-lg max-w-sm w-full mx-4 ${colors[type]}`}>
      <span className={`material-symbols-outlined text-xl ${iconColors[type]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icons[type]}
      </span>
      <span className="text-label-md font-medium flex-1">{message}</span>
      <button onClick={onClose} className="material-symbols-outlined text-base opacity-60 hover:opacity-100">close</button>
    </div>
  )
}
