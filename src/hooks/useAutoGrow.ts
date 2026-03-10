import { useEffect } from "react";

export function useAutoGrow(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight: number = 240
) {
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    }
  }, [ref, value, maxHeight]);
}
