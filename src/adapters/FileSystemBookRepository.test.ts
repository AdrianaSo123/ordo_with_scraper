import { describe, it, expect } from "vitest";
import { FileSystemBookRepository } from "./FileSystemBookRepository";
import { ResourceNotFoundError } from "../core/entities/errors";


describe("FileSystemBookRepository", () => {
  it("should instantiate successfully", () => {
    const repo = new FileSystemBookRepository();
    expect(repo).toBeDefined();
  });

  it("should return all books", async () => {
    const repo = new FileSystemBookRepository();
    const books = await repo.getAllBooks();
    expect(books.length).toBe(10);
    expect(books[0].title).toBe("Software Engineering");
  });

  it("should throw ResourceNotFoundError when getting chapters for non-existent book", async () => {
    const repo = new FileSystemBookRepository();
    await expect(repo.getChaptersByBook("non-existent-book")).rejects.toThrow(ResourceNotFoundError);
  });

  it("should throw ResourceNotFoundError when getting non-existent chapter", async () => {
    const repo = new FileSystemBookRepository();
    await expect(repo.getChapter("book-1", "non-existent-chapter")).rejects.toThrow(ResourceNotFoundError);
  });
});
