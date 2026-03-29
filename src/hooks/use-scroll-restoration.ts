import { useEffect, useRef } from "react";

export function useScrollRestoration() {
  const positions = useRef<Record<string, number>>({});

  useEffect(() => {
    const save = () => {
      positions.current[window.location.pathname] = window.scrollY;
    };
    window.addEventListener("scroll", save);
    return () => window.removeEventListener("scroll", save);
  }, []);

  useEffect(() => {
    const pos = positions.current[window.location.pathname];
    if (typeof pos === "number") {
      window.scrollTo(0, pos);
    }
  }, [window.location.pathname]);
}
