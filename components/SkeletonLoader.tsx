export default function SkeletonLoader() {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
      </div>

      {/* Map skeleton */}
      <div className="h-96 w-full bg-gray-200 rounded-xl shimmer"></div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 hover-lift">
          <div className="h-6 bg-gray-200 rounded w-1/2 shimmer"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 shimmer"></div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 hover-lift">
          <div className="h-6 bg-gray-200 rounded w-1/2 shimmer"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

