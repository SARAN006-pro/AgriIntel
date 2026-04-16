export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 shadow-sm">
          <Icon size={28} className="text-slate-400" strokeWidth={1.5} />
        </div>
      )}
      {title && <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1 text-base">{title}</p>}
      {description && <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
