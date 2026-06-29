export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      {/* Standup Block Skeleton */}
      <div className="lg:col-span-2 border border-slate-800 bg-slate-950/20 rounded-2xl p-6 space-y-6">
        <div className="h-6 bg-slate-800 rounded-lg w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-800/60 rounded w-1/4" />
          <div className="h-3 bg-slate-800/40 rounded w-full" />
          <div className="h-3 bg-slate-800/40 rounded w-5/6" />
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-900">
          <div className="h-4 bg-slate-800/60 rounded w-1/4" />
          <div className="h-3 bg-slate-800/40 rounded w-full" />
          <div className="h-3 bg-slate-800/40 rounded w-4/5" />
        </div>
      </div>

      {/* Side Profile Meter Skeleton */}
      <div className="border border-slate-800 bg-slate-950/20 rounded-2xl p-6 space-y-6">
        <div className="h-6 bg-slate-800 rounded-lg w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-800/60 rounded w-1/3" />
          <div className="h-4 bg-slate-800 rounded w-full" />
        </div>
        <div className="h-16 bg-slate-800/40 rounded-xl w-full" />
      </div>
    </div>
  );
}