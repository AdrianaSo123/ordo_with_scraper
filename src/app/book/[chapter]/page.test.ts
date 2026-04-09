import { describe, expect, it, vi } from "vitest";

const {
  getCorpusIndexMock,
  getViewerRoleMock,
  handleLibraryAccessDeniedMock,
  redirectMock,
  notFoundMock,
} = vi.hoisted(() => ({
  getCorpusIndexMock: vi.fn(),
  getViewerRoleMock: vi.fn(),
  handleLibraryAccessDeniedMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

vi.mock("@/lib/corpus-library", () => ({
  getCorpusIndex: getCorpusIndexMock,
}));

vi.mock("@/lib/corpus-access", () => ({
  getViewerRole: getViewerRoleMock,
  handleLibraryAccessDenied: handleLibraryAccessDeniedMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

import OldChapterPage from "@/app/book/[chapter]/page";

describe("legacy chapter redirect route", () => {
  it("redirects a section slug to the canonical library route", async () => {
    getViewerRoleMock.mockResolvedValue("AUTHENTICATED");
    getCorpusIndexMock.mockResolvedValue([
      {
        bookSlug: "software-engineering",
        chapterSlug: "audit-to-sprint",
      },
    ]);

    await expect(
      OldChapterPage({ params: Promise.resolve({ chapter: "audit-to-sprint" }) }),
    ).rejects.toThrow("redirect:/library/software-engineering/audit-to-sprint");
  });

  it("returns notFound for unknown section slugs", async () => {
    getViewerRoleMock.mockResolvedValue("AUTHENTICATED");
    getCorpusIndexMock.mockResolvedValue([]);

    await expect(
      OldChapterPage({ params: Promise.resolve({ chapter: "missing-section" }) }),
    ).rejects.toThrow("notFound");
  });
});