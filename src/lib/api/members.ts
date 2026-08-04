export interface Member {
  id: string
  nickname: string
  role?: string
  contact?: string
  avatarUrl: string | null
  attendanceStats?: {
    totalMeetings: number
    attendedMeetings: number
    attendanceRate: number
  }
}

export async function fetchMembers(): Promise<Member[]> {
  const response = await fetch('/api/members')
  if (!response.ok) throw new Error('Failed to fetch members')
  return response.json()
}

export async function fetchMember(id: string): Promise<Member> {
  const response = await fetch(`/api/members/${id}`)
  if (!response.ok) throw new Error('Failed to fetch member')
  return response.json()
}

export async function createMember(data: Partial<Member>): Promise<Member> {
  const response = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create member')
  return response.json()
}

export async function updateMember(id: string, data: Partial<Member>): Promise<Member> {
  const response = await fetch(`/api/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update member')
  return response.json()
}

export async function deleteMember(id: string): Promise<void> {
  const response = await fetch(`/api/members/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete member')
}
