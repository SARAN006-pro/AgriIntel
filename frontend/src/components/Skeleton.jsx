export function Skeleton({ className = '', variant = 'text' }) {
  const variants = {
    text: 'h-4 rounded-lg',
    circle: 'rounded-full',
    card: 'rounded-3xl h-24',
    stat: 'rounded-3xl h-20',
    bar: 'h-3 rounded-full',
  }
  return (
    <div className={`skeleton ${variants[variant]} ${className}`} />
  )
}

export function StatSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur p-5">
      <div className="skeleton h-3 w-24 rounded-lg mb-3" />
      <div className="skeleton h-8 w-16 rounded-lg mb-2" />
      <div className="skeleton h-3 w-20 rounded-lg" />
    </div>
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur p-6">
      <div className="skeleton h-5 w-32 rounded-lg mb-6" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
