export default function EmptyState({ icon = 'inbox', title = 'Nothing here', description = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-3xl">{icon}</span>
      </div>
      <p className="text-title-lg font-semibold text-on-surface">{title}</p>
      {description && <p className="text-label-md text-on-surface-variant max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
