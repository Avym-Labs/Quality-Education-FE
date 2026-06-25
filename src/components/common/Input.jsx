export default function Input({ label, icon, type = 'text', placeholder, value, onChange, error, className = '', ...props }) {
  return (
    <div className={`space-y-base ${className}`}>
      {label && <label className="text-label-md text-on-surface-variant ml-1 block">{label}</label>}
      <div className="relative group">
        {icon && (
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-transparent border ${error ? 'border-error' : 'border-outline-variant'} rounded-xl text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline/50`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-error ml-1">{error}</p>}
    </div>
  )
}
