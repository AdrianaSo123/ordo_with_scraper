'use client';

import { AdminBulkTableWrapper } from "@/components/admin/AdminBulkTableWrapper";
import type { BulkAction } from "@/components/admin/AdminBulkActionBar";
import type { ColumnDef } from "@/components/admin/AdminDataTable";

interface ConversationRow {
  id: string;
  title: string | null;
  userId: string;
  status: string;
  conversationMode?: string | null;
  detectedNeedSummary: string | null;
  createdAt: string;
}

function getConversationTitle(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value : "(untitled)";
}

const COLUMNS: ColumnDef[] = [
  {
    key: "title",
    header: "Title",
    render: (value: unknown, row: Record<string, unknown>) => {
      const entry = row as unknown as ConversationRow;
      return (
        <span>
          <a
            href={`/admin/conversations/${entry.id}`}
            className="text-foreground underline underline-offset-4"
          >
            {getConversationTitle(value)}
          </a>
          {entry.conversationMode === "human" && (
            <span className="ml-2 inline-flex rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700">HUMAN</span>
          )}
        </span>
      );
    },
  },
  { key: "userId", header: "User" },
  { key: "status", header: "Status" },
  { key: "createdAt", header: "Created" },
];

export function ConversationsTableClient({
  rows,
  action,
}: {
  rows: ConversationRow[];
  total: number;
  page: number;
  pageSize: number;
  action: (formData: FormData) => void;
}) {
  const bulkActions: BulkAction[] = [
    { label: "Archive selected", action: "bulkArchive", variant: "destructive" },
  ];

  return (
    <AdminBulkTableWrapper
      action={action}
      columns={COLUMNS}
      rows={rows as unknown as Record<string, unknown>[]}
      emptyMessage="No conversations found."
      bulkActions={bulkActions}
    />
  );
}
