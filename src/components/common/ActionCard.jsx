export default function ActionCard({ icon, label, count, iconColor = 'text-primary', onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-surface-container-low p-stack-md rounded-xl hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group text-left w-full"
    >
      <span className={`material-symbols-outlined ${iconColor} group-hover:scale-110 transition-transform`}>
        {icon}
      </span>
      <div>
        <p className="text-numeric-bold font-bold text-on-surface">{count}</p>
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      </div>
    </button>
  )
}
