export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-3/4" />
          {Array.from({ length: lines - 2 }).map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded w-2/3" />
          ))}
        </div>
        <div className="h-6 w-20 bg-muted rounded-full" />
      </div>
    </div>
  );
}