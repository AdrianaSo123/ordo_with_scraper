"use server";

import { getChapterFull } from "./book-library";

/**
 * Server action to fetch chapter content.
 */
export async function getChapter(bookSlug: string, chapterSlug: string) {
  const result = await getChapterFull(bookSlug, chapterSlug);
  return {
    content: result?.content || "",
  };
}
