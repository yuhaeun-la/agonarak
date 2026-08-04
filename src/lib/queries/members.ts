import { queryOptions } from '@tanstack/react-query'
import { fetchMembers, fetchMember, type Member } from '../api/members'

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (filters?: any) => [...memberKeys.lists(), filters] as const,
  details: () => [...memberKeys.all, 'detail'] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
}

export const memberQueries = {
  all: () =>
    queryOptions({
      queryKey: memberKeys.lists(),
      queryFn: fetchMembers,
      staleTime: 1000 * 60 * 5, // 5분
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: memberKeys.detail(id),
      queryFn: () => fetchMember(id),
      staleTime: 1000 * 60 * 5, // 5분
    }),
}
