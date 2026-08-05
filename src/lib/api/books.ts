export interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  notes: string
  notesLikes: number
  rating: number
  thumbnail: string | null
  registeredDate: string
  addedBy: string
  addedByAvatarUrl: string | null
  addedById: string
  createdAt: string
}

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch('/api/books')
  if (!response.ok) throw new Error('Failed to fetch books')
  return response.json()
}

export async function fetchBook(id: string): Promise<Book> {
  const response = await fetch(`/api/books/${id}`)
  if (!response.ok) throw new Error('Failed to fetch book')
  return response.json()
}

export async function createBook(data: Partial<Book>): Promise<Book> {
  const response = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create book')
  return response.json()
}

export async function updateBook(id: string, data: Partial<Book>): Promise<Book> {
  const response = await fetch(`/api/books/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update book')
  return response.json()
}

export async function deleteBook(id: string): Promise<void> {
  const response = await fetch(`/api/books/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete book')
}
