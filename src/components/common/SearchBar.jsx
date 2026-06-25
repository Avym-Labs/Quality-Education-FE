export default function SearchBar({ value, onChange, placeholder = 'Search...', onFilter }) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1 group">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl group-focus-within:text-primary transition-colors">search</span>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-surface-container rounded-xl text-body-md outline-none focus:ring-2 focus:ring-primary border border-transparent focus:border-primary transition-all placeholder:text-outline/60"
        />
      </div>
      {onFilter && (
        <button
          onClick={onFilter}
          className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
      )}
    </div>
  )
}
