export default function SkeletonLoader() {
  return (
    <div className="app-card space-y-6 p-5 animate-pulse sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-full bg-slate-200 shimmer"></div>
          <div className="h-8 w-64 max-w-full rounded-xl bg-slate-200 shimmer"></div>
          <div className="h-4 w-44 rounded-lg bg-slate-100 shimmer"></div>
        </div>
        <div className="h-20 w-28 rounded-3xl bg-slate-200 shimmer"></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 rounded-2xl bg-slate-100 shimmer"></div>
        <div className="h-20 rounded-2xl bg-slate-100 shimmer"></div>
        <div className="h-20 rounded-2xl bg-slate-100 shimmer"></div>
      </div>

      <div className="h-80 w-full rounded-3xl bg-slate-200 shimmer"></div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="app-card-soft space-y-3 p-4">
          <div className="h-5 w-1/2 rounded bg-slate-200 shimmer"></div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-slate-200 shimmer"></div>
            <div className="h-4 w-5/6 rounded bg-slate-200 shimmer"></div>
            <div className="h-4 w-4/6 rounded bg-slate-200 shimmer"></div>
          </div>
        </div>
        <div className="app-card-soft space-y-3 p-4">
          <div className="h-5 w-1/2 rounded bg-slate-200 shimmer"></div>
          <div className="space-y-2">
            <div className="h-4 rounded bg-slate-200 shimmer"></div>
            <div className="h-4 w-5/6 rounded bg-slate-200 shimmer"></div>
            <div className="h-4 w-4/6 rounded bg-slate-200 shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

