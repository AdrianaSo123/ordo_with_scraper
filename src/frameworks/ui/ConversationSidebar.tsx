"use client";

import React from "react";
import { useGlobalChat } from "@/hooks/useGlobalChat";

export const ConversationSidebar: React.FC = () => {
  const {
    conversations,
    conversationId,
    loadConversation,
    newConversation,
    deleteConversation,
  } = useGlobalChat();

  if (conversations.length === 0 && !conversationId) return null;

  return (
    <div className="flex flex-col gap-1 px-2 py-2">
      <button
        onClick={newConversation}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold opacity-70 hover:opacity-100 hover-surface transition-all"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>

      {conversations.map((conv) => (
        <div
          key={conv.id}
          className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
            conv.id === conversationId
              ? "accent-fill font-bold"
              : "opacity-60 hover:opacity-100 hover-surface"
          }`}
        >
          <button
            onClick={() => loadConversation(conv.id)}
            className="flex-1 text-left truncate"
          >
            {conv.title || "Untitled"}
          </button>
          <span className="text-[9px] opacity-40 shrink-0">
            {conv.messageCount}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteConversation(conv.id);
            }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
            aria-label={`Delete conversation: ${conv.title || "Untitled"}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
