import { queryOptions } from '@tanstack/react-query'
import { fetchBooks, fetchBook, type Book } from '../api/books'

export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (filters?: any) => [...bookKeys.lists(), filters] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
}

export const bookQueries = {
  all: () =>
    queryOptions({
      queryKey: bookKeys.lists(),
      queryFn: fetchBooks,
      staleTime: 1000 * 60 * 5, // 5분
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: bookKeys.detail(id),
      queryFn: () => fetchBook(id),
      staleTime: 1000 * 60 * 5, // 5분
    }),
}
