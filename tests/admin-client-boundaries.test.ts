import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const CLIENT_BOUNDARY_FILES = [
  "src/components/admin/AdminBulkTableWrapper.tsx",
  "src/components/admin/UsersTableClient.tsx",
  "src/components/admin/ConversationsTableClient.tsx",
] as const;

describe("admin table client boundaries", () => {
  it("keeps interactive admin table presentation files inside the client graph", () => {
    for (const file of CLIENT_BOUNDARY_FILES) {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      const firstStatement = source.trimStart().split("\n", 1)[0]?.trim();

      expect(firstStatement, `${file} must start with a client boundary`).toBe("'use client';");
    }
  });
});