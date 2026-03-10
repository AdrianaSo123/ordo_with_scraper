import type { Book, Chapter } from "../entities/library";

export interface BookQuery {
  getAllBooks(): Promise<Book[]>;
  getBook(slug: string): Promise<Book | null>;
}

export interface ChapterQuery {
  /**
   * @throws {ResourceNotFoundError} if book is not found
   */
  getChaptersByBook(bookSlug: string): Promise<Chapter[]>;
  getAllChapters(): Promise<Chapter[]>;
  /**
   * @throws {ResourceNotFoundError} if book or chapter is not found
   */
  getChapter(bookSlug: string, chapterSlug: string): Promise<Chapter>;
}

export interface BookRepository extends BookQuery, ChapterQuery {}
