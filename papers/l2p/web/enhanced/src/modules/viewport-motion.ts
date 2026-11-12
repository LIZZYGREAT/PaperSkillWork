import { useEffect, useRef, useState } from "react";

/** Start a short explanatory sequence once, when the drawing is readable in the viewport. */
export function useViewportMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setEntered(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < .55) return;
      setEntered(true);
      observer.disconnect();
    }, { threshold: .55, rootMargin: "-80px 0px -8% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, entered };
}
