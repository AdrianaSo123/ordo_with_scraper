import * as fs from "fs/promises";
import * as path from "path";
import type { VectorStore } from "@/core/search/ports/VectorStore";

// ---------------------------------------------------------------------------
// Deps
// ---------------------------------------------------------------------------

export interface LibrarianToolDeps {
  corpusDir: string; // absolute path to docs/_corpus/
  vectorStore: VectorStore; // for embedding cleanup on remove
  clearCaches: () => void; // callback to clear repo + discovery caches
}

// ---------------------------------------------------------------------------
// Security helpers (LIBRARIAN-070, LIBRARIAN-080)
// ---------------------------------------------------------------------------

function assertSafePath(corpusDir: string, ...segments: string[]): string {
  const resolved = path.resolve(corpusDir, ...segments);
  const rel = path.relative(path.resolve(corpusDir), resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(
      "Path traversal detected — path escapes corpus directory.",
    );
  }
  return resolved;
}

function assertValidSlug(slug: string): void {
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) || slug.length > 100) {
    throw new Error(
      `Invalid slug: "${slug}". Must be lowercase alphanumeric with hyphens, 2–100 chars.`,
    );
  }
}

const VALID_DOMAINS = new Set([
  "teaching",
  "sales",
  "customer-service",
  "reference",
  "internal",
]);

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// librarian_list
// ---------------------------------------------------------------------------

export async function librarianList(deps: LibrarianToolDeps) {
  const collected: Array<{
    slug: string;
    title: string;
    number: string;
    domain: string[];
    tags: string[];
    chapterCount: number;
    indexed: boolean;
    sortOrder: number;
  }> = [];

  let entries: string[] = [];
  try {
    entries = await fs.readdir(deps.corpusDir);
  } catch {
    // corpus dir missing → empty corpus
  }

  const dirChecks = await Promise.all(
    entries.map(async (name) => {
      const stat = await fs.stat(path.join(deps.corpusDir, name));
      return { name, isDir: stat.isDirectory() };
    }),
  );
  const dirs = dirChecks.filter((d) => d.isDir);

  for (const dir of dirs) {
    const manifestPath = path.join(deps.corpusDir, dir.name, "book.json");
    try {
      const raw = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(raw) as Record<string, unknown>;

      const slug = manifest.slug as string | undefined;
      const title = manifest.title as string | undefined;
      const number = manifest.number as string | undefined;
      const sortOrder = manifest.sortOrder;
      const domain = manifest.domain as string[] | undefined;
      const tags = (manifest.tags ?? []) as string[];

      if (!slug || !title || !number) continue;
      if (typeof sortOrder !== "number") continue;
      if (!Array.isArray(domain) || domain.length === 0) continue;
      if (dir.name !== slug) continue;

      // Count chapters
      const chaptersDir = path.join(deps.corpusDir, slug, "chapters");
      let chapterSlugs: string[] = [];
      try {
        const files = await fs.readdir(chaptersDir);
        chapterSlugs = files
          .filter((f) => f.endsWith(".md"))
          .map((f) => f.replace(/\.md$/, ""));
      } catch {
        // no chapters dir
      }

      // Check indexing status — any chapter has embeddings?
      const indexed = chapterSlugs.some(
        (cs) => deps.vectorStore.getBySourceId(`${slug}/${cs}`).length > 0,
      );

      collected.push({
        slug,
        title,
        number,
        domain,
        tags,
        chapterCount: chapterSlugs.length,
        indexed,
        sortOrder: sortOrder as number,
      });
    } catch {
      // invalid manifest — skip
    }
  }

  // Sort by sortOrder ascending
  collected.sort((a, b) => a.sortOrder - b.sortOrder);

  // Strip sortOrder from output
  const books = collected.map(({ sortOrder: _, ...rest }) => rest);
  const totalChapters = books.reduce((sum, b) => sum + b.chapterCount, 0);

  return { books, totalBooks: books.length, totalChapters };
}

// ---------------------------------------------------------------------------
// librarian_get_book
// ---------------------------------------------------------------------------

export async function librarianGetBook(
  deps: LibrarianToolDeps,
  args: { slug: string },
) {
  assertValidSlug(args.slug);

  const bookDir = assertSafePath(deps.corpusDir, args.slug);
  const manifestPath = path.join(bookDir, "book.json");

  if (!(await pathExists(manifestPath))) {
    throw new Error(`Book not found: "${args.slug}".`);
  }

  const raw = await fs.readFile(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as Record<string, unknown>;

  const chaptersDir = path.join(bookDir, "chapters");
  const chapters: Array<{
    slug: string;
    title: string;
    indexed: boolean;
    contentLength: number;
  }> = [];

  try {
    const files = (await fs.readdir(chaptersDir))
      .filter((f) => f.endsWith(".md"))
      .sort();

    for (const file of files) {
      const chapterSlug = file.replace(/\.md$/, "");
      const content = await fs.readFile(
        path.join(chaptersDir, file),
        "utf-8",
      );

      // Extract title from first # heading, fallback to filename
      const headingMatch = content.match(/^#\s+(.+)$/m);
      const title = headingMatch ? headingMatch[1] : chapterSlug;

      const indexed =
        deps.vectorStore.getBySourceId(`${args.slug}/${chapterSlug}`).length >
        0;

      chapters.push({
        slug: chapterSlug,
        title,
        indexed,
        contentLength: content.length,
      });
    }
  } catch {
    // no chapters dir — valid (book with zero chapters)
  }

  return {
    slug: manifest.slug as string,
    title: manifest.title as string,
    number: manifest.number as string,
    domain: (manifest.domain ?? []) as string[],
    tags: (manifest.tags ?? []) as string[],
    directory: `_corpus/${args.slug}`,
    chapters,
  };
}

// ---------------------------------------------------------------------------
// librarian_add_book (manual JSON mode — Sprint 1)
// ---------------------------------------------------------------------------

export async function librarianAddBook(
  deps: LibrarianToolDeps,
  args: {
    slug: string;
    title: string;
    number: string;
    sortOrder: number;
    domain: string[];
    tags?: string[];
    chapters?: Array<{ slug: string; content: string }>;
  },
) {
  // 1. Validate required fields
  if (!args.slug || !args.title || !args.number) {
    throw new Error(
      "librarian_add_book requires slug, title, number, sortOrder, and domain.",
    );
  }
  if (typeof args.sortOrder !== "number") {
    throw new Error("sortOrder must be a number.");
  }
  assertValidSlug(args.slug);

  // 1b. Validate domain against controlled vocabulary
  if (!Array.isArray(args.domain) || args.domain.length === 0) {
    throw new Error("domain must be a non-empty array.");
  }
  for (const d of args.domain) {
    if (!VALID_DOMAINS.has(d)) {
      throw new Error(
        `Invalid domain value: "${d}". Valid: ${[...VALID_DOMAINS].join(", ")}`,
      );
    }
  }

  // 2. LIBRARIAN-090: directory = slug
  const bookDir = assertSafePath(deps.corpusDir, args.slug);
  if (await pathExists(bookDir)) {
    throw new Error(`Book already exists: ${args.slug}`);
  }

  // 3. Create directory structure
  const chaptersDir = path.join(bookDir, "chapters");
  await fs.mkdir(chaptersDir, { recursive: true });

  // 4. Write book.json
  const manifest = {
    slug: args.slug,
    title: args.title,
    number: args.number,
    sortOrder: args.sortOrder,
    domain: args.domain,
    ...(args.tags ? { tags: args.tags } : {}),
  };
  await fs.writeFile(
    path.join(bookDir, "book.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  // 5. Write chapters (if provided)
  let chaptersWritten = 0;
  if (args.chapters) {
    for (const ch of args.chapters) {
      assertValidSlug(ch.slug);
      const chapterPath = assertSafePath(chaptersDir, `${ch.slug}.md`);
      await fs.writeFile(chapterPath, ch.content);
      chaptersWritten++;
    }
  }

  // 6. LIBRARIAN-050: clear caches after successful mutation
  deps.clearCaches();

  return {
    slug: args.slug,
    title: args.title,
    directory: `_corpus/${args.slug}`,
    chaptersWritten,
    indexed: false,
    hint: "Run rebuild_index to make this book searchable.",
  };
}

// ---------------------------------------------------------------------------
// librarian_add_chapter
// ---------------------------------------------------------------------------

export async function librarianAddChapter(
  deps: LibrarianToolDeps,
  args: { book_slug: string; chapter_slug: string; content: string },
) {
  assertValidSlug(args.book_slug);
  assertValidSlug(args.chapter_slug);

  if (!args.content || args.content.length === 0) {
    throw new Error("Chapter content must not be empty.");
  }

  const bookDir = assertSafePath(deps.corpusDir, args.book_slug);
  if (!(await pathExists(bookDir))) {
    throw new Error(`Book not found: "${args.book_slug}".`);
  }

  const chaptersDir = path.join(bookDir, "chapters");
  await fs.mkdir(chaptersDir, { recursive: true });

  const chapterPath = assertSafePath(chaptersDir, `${args.chapter_slug}.md`);
  await fs.writeFile(chapterPath, args.content);

  // LIBRARIAN-050: clear caches after mutation
  deps.clearCaches();

  return {
    book_slug: args.book_slug,
    chapter_slug: args.chapter_slug,
    written: true,
  };
}

// ---------------------------------------------------------------------------
// librarian_remove_book
// ---------------------------------------------------------------------------

export async function librarianRemoveBook(
  deps: LibrarianToolDeps,
  args: { slug: string },
) {
  assertValidSlug(args.slug);

  const bookDir = assertSafePath(deps.corpusDir, args.slug);
  if (!(await pathExists(bookDir))) {
    throw new Error(`Book not found: "${args.slug}".`);
  }

  // Enumerate chapters so we can clean up embeddings
  const chaptersDir = path.join(bookDir, "chapters");
  let chapterSlugs: string[] = [];
  try {
    const files = await fs.readdir(chaptersDir);
    chapterSlugs = files
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {
    // no chapters dir
  }

  // LIBRARIAN-060: delete embeddings for each chapter
  let embeddingsDeleted = 0;
  for (const cs of chapterSlugs) {
    const before = deps.vectorStore.count();
    deps.vectorStore.delete(`${args.slug}/${cs}`);
    embeddingsDeleted += before - deps.vectorStore.count();
  }

  // Remove entire book directory
  await fs.rm(bookDir, { recursive: true });

  // LIBRARIAN-050: clear caches
  deps.clearCaches();

  return {
    slug: args.slug,
    chaptersRemoved: chapterSlugs.length,
    embeddingsDeleted,
  };
}

// ---------------------------------------------------------------------------
// librarian_remove_chapter
// ---------------------------------------------------------------------------

export async function librarianRemoveChapter(
  deps: LibrarianToolDeps,
  args: { book_slug: string; chapter_slug: string },
) {
  assertValidSlug(args.book_slug);
  assertValidSlug(args.chapter_slug);

  const bookDir = assertSafePath(deps.corpusDir, args.book_slug);
  if (!(await pathExists(bookDir))) {
    throw new Error(`Book not found: "${args.book_slug}".`);
  }

  const chapterPath = assertSafePath(
    bookDir,
    "chapters",
    `${args.chapter_slug}.md`,
  );
  if (!(await pathExists(chapterPath))) {
    throw new Error(
      `Chapter not found: "${args.chapter_slug}" in book "${args.book_slug}".`,
    );
  }

  // LIBRARIAN-060: delete embeddings
  const before = deps.vectorStore.count();
  deps.vectorStore.delete(`${args.book_slug}/${args.chapter_slug}`);
  const embeddingsDeleted = before - deps.vectorStore.count();

  // Remove the file
  await fs.unlink(chapterPath);

  // LIBRARIAN-050: clear caches
  deps.clearCaches();

  return {
    book_slug: args.book_slug,
    chapter_slug: args.chapter_slug,
    embeddingsDeleted,
  };
}
