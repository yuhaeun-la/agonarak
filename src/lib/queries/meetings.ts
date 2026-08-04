import { queryOptions } from '@tanstack/react-query'
import { fetchMeetings, fetchMeeting, type Meeting } from '../api/meetings'

export const meetingKeys = {
  all: ['meetings'] as const,
  lists: () => [...meetingKeys.all, 'list'] as const,
  list: (filters?: any) => [...meetingKeys.lists(), filters] as const,
  details: () => [...meetingKeys.all, 'detail'] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
}

export const meetingQueries = {
  all: () =>
    queryOptions({
      queryKey: meetingKeys.lists(),
      queryFn: fetchMeetings,
      staleTime: 1000 * 60 * 5, // 5분
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: meetingKeys.detail(id),
      queryFn: () => fetchMeeting(id),
      staleTime: 1000 * 60 * 5, // 5분
    }),
}
