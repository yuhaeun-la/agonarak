import { useQuery } from '@tanstack/react-query'
import { bookQueries } from '@/lib/queries/books'

export function useBooks() {
  return useQuery(bookQueries.all())
}

export function useBook(id: string) {
  return useQuery(bookQueries.detail(id))
}
