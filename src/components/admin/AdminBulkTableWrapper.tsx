'use client';

import type { ColumnDef } from "@/components/admin/AdminDataTable";
import type { BulkAction } from "@/components/admin/AdminBulkActionBar";
import { AdminBulkTableWrapperClient } from "@/components/admin/AdminBulkTableWrapperClient";

interface AdminBulkTableWrapperProps {
  action: (formData: FormData) => void | Promise<void>;
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  emptyMessage: string;
  bulkActions: BulkAction[];
}

export function AdminBulkTableWrapper(props: AdminBulkTableWrapperProps) {
  return <AdminBulkTableWrapperClient {...props} />;
}
