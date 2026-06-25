const variants = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary-container text-on-secondary-container',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  error: 'bg-error-container text-error',
  outline: 'border border-outline-variant text-on-surface-variant',
  tier: 'bg-secondary-container text-on-secondary-container',
}

export default function Badge({ label, variant = 'secondary', icon, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-md font-medium ${variants[variant]} ${className}`}>
      {icon && (
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      )}
      {label}
    </span>
  )
}
