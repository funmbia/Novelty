import { dummyBooks } from "../data/dummyBooks";

export function validateInventory(cart) {
  for (const item of cart) {
    const book = dummyBooks.find((b) => b.bookId === item.bookId);

    if (!book) return `Book ${item.title} not found`;
    if (item.quantity > book.quantity)
      return `Only ${book.quantity} copies of ${book.title} left`;
  }

  return null; // no errors
}