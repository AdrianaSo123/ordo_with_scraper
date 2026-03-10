import { UseCase } from "../common/UseCase";
import { BookRepository } from "./BookRepository";
import { Practitioner } from "../entities/library";

export interface PractitionerRequest {
  query?: string;
}

export class PractitionerInteractor implements UseCase<PractitionerRequest, Practitioner[]> {
  constructor(private bookRepository: BookRepository) {}

  async execute(request: PractitionerRequest): Promise<Practitioner[]> {
    const chapters = await this.bookRepository.getAllChapters();
    const books = await this.bookRepository.getAllBooks();
    
    const practitionerMap = new Map<string, { books: Set<string>; chapters: Set<string>; bookData: any[] }>();

    for (const chapter of chapters) {
      for (const name of chapter.practitioners) {
        const key = name.toLowerCase();
        if (request.query && !key.includes(request.query.toLowerCase())) continue;

        let record = practitionerMap.get(key);
        if (!record) {
          record = { books: new Set(), chapters: new Set(), bookData: [] };
          practitionerMap.set(key, record);
        }
        
        const book = books.find(b => b.slug === chapter.bookSlug);
        if (book) {
          record.books.add(book.slug);
          if (!record.bookData.find(b => b.slug === book.slug)) {
            record.bookData.push(book);
          }
        }
        // Store chapter details
        record.chapters.add(JSON.stringify({ slug: chapter.chapterSlug, title: chapter.title }));
      }
    }

    return Array.from(practitionerMap.entries())
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        books: value.bookData,
        chapters: Array.from(value.chapters).map(s => JSON.parse(s)),
      }))
      .sort((a, b) => b.chapters.length - a.chapters.length);
  }
}
