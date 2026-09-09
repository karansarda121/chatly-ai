import { useEffect } from 'react';

/** Calls onIntersect when targetRef enters the scroll container in rootRef. */
function useIntersectionObserver({ enabled = true, onIntersect, rootRef, targetRef }) {
  useEffect(() => {
    const target = targetRef.current;
    if (!enabled || !target) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onIntersect();
    }, { root: rootRef.current, threshold: 0.1 });

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, onIntersect, rootRef, targetRef]);
}

export default useIntersectionObserver;
