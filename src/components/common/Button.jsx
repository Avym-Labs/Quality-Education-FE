const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90 shadow-md',
  secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80',
  outline: 'border border-outline-variant text-on-surface hover:bg-surface-container',
  danger: 'bg-error text-on-error hover:bg-error/90',
  ghost: 'text-primary hover:bg-surface-container',
}

const sizes = {
  sm: 'px-3 py-1.5 text-label-md rounded-lg',
  md: 'px-4 py-2.5 text-label-md rounded-xl',
  lg: 'px-6 py-4 text-title-lg rounded-xl font-bold',
  full: 'w-full px-6 py-4 text-title-lg rounded-xl font-bold',
}

export default function Button({ children, variant = 'primary', size = 'md', icon, iconRight, loading = false, disabled = false, onClick, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
      ) : (
        <>
          {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
          {children}
          {iconRight && <span className="material-symbols-outlined text-[20px]">{iconRight}</span>}
        </>
      )}
    </button>
  )
}
