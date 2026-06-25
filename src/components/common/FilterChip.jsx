export default function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-label-md font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-primary text-on-primary shadow-sm'
          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant'
      }`}
    >
      {label}
    </button>
  )
}
