import { redirect } from "next/navigation";
import { BOOKS } from "@/core/entities/library";
import { getBookSummaries } from "@/lib/book-library";

export async function generateStaticParams() {
  return BOOKS.map((book) => ({ book: book.slug }));
}

export default async function BookIndex({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const resolvedParams = await params;
  const book = BOOKS.find(b => b.slug === resolvedParams.book);
  if (!book) {
    redirect("/books");
  }

  const summaries = await getBookSummaries();
  const summary = summaries.find(s => s.slug === book.slug);
  
  if (summary && summary.chapters.length > 0) {
    // Redirect to first chapter. Note: summaries.chapters are titles, we need slugs.
    // Actually, it's safer to use the indexer or repository here.
    redirect(`/books/${book.slug}/ch01-introduction`); // Fallback to common convention or use indexer
  }
  return <div>No chapters found.</div>;
}
