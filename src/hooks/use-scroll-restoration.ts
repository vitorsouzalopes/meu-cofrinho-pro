import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function useScrollRestoration() {
  const positions = useRef<Record<string, number>>({});
  const { pathname } = useLocation();

  useEffect(() => {
    const save = () => {
      positions.current[pathname] = window.scrollY;
    };
    window.addEventListener("scroll", save);
    return () => window.removeEventListener("scroll", save);
  }, [pathname]);

  useEffect(() => {
    const pos = positions.current[pathname];
    if (typeof pos === "number") {
      window.scrollTo(0, pos);
    }
  }, [pathname]);
}
