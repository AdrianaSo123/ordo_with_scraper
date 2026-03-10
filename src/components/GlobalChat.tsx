"use client";

import { usePathname } from "next/navigation";
import { ChatContainer } from "@/frameworks/ui/ChatContainer";

export function GlobalChat() {
  const pathname = usePathname();
  
  // Hide FAB on Home page to avoid redundancy with the Hero chat
  if (pathname === "/") return null;
  
  return <ChatContainer isFloating={true} />;
}
