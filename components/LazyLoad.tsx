'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export default function LazyLoad({
  children,
  fallback = null,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentElement = elementRef.current;

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

