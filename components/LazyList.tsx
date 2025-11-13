'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  initialCount?: number;
  increment?: number;
  threshold?: number;
  className?: string;
}

export default function LazyList<T>({
  items,
  renderItem,
  initialCount = 10,
  increment = 10,
  threshold = 200,
  className = '',
}: LazyListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [items.length, initialCount]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (visibleCount >= items.length) return;

    const sentinelElement = sentinelRef.current;
    if (!sentinelElement) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingRef.current) {
          setIsLoading(true);
          isLoadingRef.current = true;
          timeoutId = setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + increment, items.length));
            setIsLoading(false);
            isLoadingRef.current = false;
            timeoutId = null;
          }, 100);
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(sentinelElement);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
        setIsLoading(false);
        isLoadingRef.current = false;
      }
      observer.unobserve(sentinelElement);
      observer.disconnect();
    };
  }, [visibleCount, items.length, increment, threshold]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className={className}>
      {visibleItems.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex justify-center items-center py-4"
        >
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading more...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

