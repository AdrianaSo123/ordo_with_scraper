import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme, Theme } from "@/components/ThemeProvider";
import type { PresentedMessage } from "../adapters/ChatPresenter";

export function useUICommands(presentedMessages: PresentedMessage[]) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const lastExecutedCommandRef = useRef<string>("");

  useEffect(() => {
    const lastMsg = presentedMessages[presentedMessages.length - 1];
    if (lastMsg && lastMsg.role === "assistant") {
      if (lastMsg.commands.length > 0) {
        lastMsg.commands.forEach((cmd: Record<string, unknown>) => {
          const cmdKey = `${JSON.stringify(cmd)}-${presentedMessages.length}`;
          if (cmdKey !== lastExecutedCommandRef.current) {
            lastExecutedCommandRef.current = cmdKey;
            if (cmd.type === "set_theme") {
              setTheme(cmd.theme as Theme);
            } else if (cmd.type === "navigate" && typeof cmd.path === "string") {
              if (cmd.path.startsWith("/")) router.push(cmd.path);
              else window.location.href = cmd.path;
            }
          }
        });
      }
    }
  }, [presentedMessages, setTheme, router]);
}
