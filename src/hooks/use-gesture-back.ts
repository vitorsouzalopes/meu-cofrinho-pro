import { useEffect } from "react";

export function useGestureBack() {
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.changedTouches[0].clientX < 40) {
        window.history.back();
      }
    };
    window.addEventListener("touchstart", handler);
    return () => window.removeEventListener("touchstart", handler);
  }, []);
}
