export interface Meeting {
  id: string
  title: string
  date: string
  location: string
  memo: string
  books: Array<{
    id: string
    title: string
    author: string
  }>
  attendances: Array<{
    member: {
      id: string
      nickname: string
      avatarUrl: string | null
    }
    status: 'ATTENDING' | 'NOT_ATTENDING' | 'UNDECIDED'
  }>
  createdAt: string
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const response = await fetch('/api/meetings')
  if (!response.ok) throw new Error('Failed to fetch meetings')
  return response.json()
}

export async function fetchMeeting(id: string): Promise<Meeting> {
  const response = await fetch(`/api/meetings/${id}`)
  if (!response.ok) throw new Error('Failed to fetch meeting')
  return response.json()
}

export async function createMeeting(data: Partial<Meeting>): Promise<Meeting> {
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create meeting')
  return response.json()
}

export async function updateMeeting(id: string, data: Partial<Meeting>): Promise<Meeting> {
  const response = await fetch(`/api/meetings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update meeting')
  return response.json()
}

export async function deleteMeeting(id: string): Promise<void> {
  const response = await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete meeting')
}
