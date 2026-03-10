import { useEffect, useRef, useState, useCallback, type RefObject } from "react";

export function useChatScroll<T>(dep: T): {
  scrollRef: RefObject<HTMLDivElement | null>;
  isAtBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  handleScroll: () => void;
} {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    // Throttle scroll events to max once per 50ms
    const now = Date.now();
    if (now - lastScrollTime.current < 50) return;
    lastScrollTime.current = now;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // 100px tolerance for deciding if we're at the bottom.
    // This allows smooth scrolling to not be instantly interrupted by minor pixel differences.
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
      setIsAtBottom(true);
    }
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      // Small timeout to allow DOM to update after React state changes (like appending messages)
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [dep, isAtBottom]);

  return { scrollRef, isAtBottom, scrollToBottom, handleScroll };
}
