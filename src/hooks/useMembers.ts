import { useQuery } from '@tanstack/react-query'
import { memberQueries } from '@/lib/queries/members'

export function useMembers() {
  return useQuery(memberQueries.all())
}

export function useMember(id: string) {
  return useQuery(memberQueries.detail(id))
}
