import { useQuery } from '@tanstack/react-query'
import { meetingQueries } from '@/lib/queries/meetings'

export function useMeetings() {
  return useQuery(meetingQueries.all())
}

export function useMeeting(id: string) {
  return useQuery(meetingQueries.detail(id))
}
