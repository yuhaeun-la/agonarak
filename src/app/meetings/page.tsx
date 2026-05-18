'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { CalendarDays, MapPin, Clock, Plus, Search, Edit, Trash2, MoreHorizontal, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Meeting {
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

export default function Meetings() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [members, setMembers] = useState<{id: string; nickname: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)

  const LOCATION_PRESETS = ['디스코드', '오프라인'] as const

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '디스코드',
    memo: '',
    attendees: [] as string[]
  })

  const locationType = LOCATION_PRESETS.includes(formData.location as typeof LOCATION_PRESETS[number])
    ? formData.location
    : '기타'

  useEffect(() => {
    Promise.all([fetchMeetings(), fetchMembers()])
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meetings')
      if (!response.ok) throw new Error('Failed to fetch meetings')
      const data = await response.json()
      setMeetings(data)
      setError('')
    } catch (error) {
      console.error('Error fetching meetings:', error)
      setError('모임 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (!response.ok) throw new Error('Failed to fetch members')
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const filteredMeetings = meetings.filter(meeting => {
    const searchLower = searchTerm.toLowerCase()
    return meeting.location.toLowerCase().includes(searchLower) ||
           meeting.memo.toLowerCase().includes(searchLower) ||
           meeting.title.toLowerCase().includes(searchLower) ||
           meeting.books.some(book =>
             book.title.toLowerCase().includes(searchLower) ||
             book.author.toLowerCase().includes(searchLower)
           )
  })

  const handleAddMeeting = async () => {
    if (!formData.date.trim() || !formData.time.trim()) {
      setError('날짜와 시간은 필수입니다.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          date: formData.date,
          time: formData.time,
          location: formData.location.trim(),
          memo: formData.memo.trim(),
          attendees: formData.attendees
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add meeting')
      }

      await fetchMeetings()
      setFormData({ title: '', date: '', time: '', location: '디스코드', memo: '', attendees: [] })
      setIsAddDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error adding meeting:', error)
      setError(error instanceof Error ? error.message : '모임 추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('정말로 이 모임을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete meeting')
      }
      await fetchMeetings()
      setError('')
    } catch (error: unknown) {
      console.error('Error deleting meeting:', error)
      setError(error instanceof Error ? error.message : '모임 삭제에 실패했습니다.')
    }
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setEditingMeeting(meeting)
    const meetingDate = new Date(meeting.date)
    const year = meetingDate.getFullYear()
    const month = String(meetingDate.getMonth() + 1).padStart(2, '0')
    const day = String(meetingDate.getDate()).padStart(2, '0')
    const hours = String(meetingDate.getHours()).padStart(2, '0')
    const minutes = String(meetingDate.getMinutes()).padStart(2, '0')

    setFormData({
      title: meeting.title,
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      location: meeting.location || '',
      memo: meeting.memo || '',
      attendees: meeting.attendances.map(attendance => attendance.member.id)
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateMeeting = async () => {
    if (!editingMeeting) return
    if (!formData.title.trim()) { setError('모임 제목을 입력해주세요.'); return }
    if (!formData.date || !formData.time) { setError('날짜와 시간을 입력해주세요.'); return }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/meetings/${editingMeeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          date: formData.date,
          time: formData.time,
          location: formData.location.trim(),
          memo: formData.memo.trim(),
          attendees: formData.attendees
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update meeting')
      }

      await fetchMeetings()
      resetForm()
      setEditingMeeting(null)
      setIsEditDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error updating meeting:', error)
      setError(error instanceof Error ? error.message : '모임 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const getNextMeetingTitle = () => {
    const nextNumber = meetings.length + 1
    return `아고나락 모임 ${nextNumber}차`
  }

  const resetForm = () => {
    setFormData({ title: getNextMeetingTitle(), date: '', time: '', location: '디스코드', memo: '', attendees: [] })
    setError('')
  }

  const handleAttendeeChange = (memberId: string, isChecked: boolean) => {
    if (isChecked) {
      setFormData(prev => ({ ...prev, attendees: [...prev.attendees, memberId] }))
    } else {
      setFormData(prev => ({ ...prev, attendees: prev.attendees.filter(id => id !== memberId) }))
    }
  }

  const formatDateLarge = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('ko-KR', {
        month: 'long', day: 'numeric', weekday: 'long'
      }),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const formatDateCompact = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('ko-KR', {
        month: 'short', day: 'numeric', weekday: 'short'
      }),
      time: date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const now = new Date()
  const upcomingMeetings = filteredMeetings
    .filter(meeting => new Date(meeting.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const pastMeetings = filteredMeetings
    .filter(meeting => new Date(meeting.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const nextMeeting = upcomingMeetings[0] || null
  const restUpcoming = upcomingMeetings.slice(1)

  // 지난 모임 연도별 그룹핑
  const pastByYear = pastMeetings.reduce((acc, meeting) => {
    const year = new Date(meeting.date).getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(meeting)
    return acc
  }, {} as Record<string, Meeting[]>)

  const getAttendingCount = (meeting: Meeting) =>
    meeting.attendances.filter(a => a.status === 'ATTENDING').length

  const getAttendingMembers = (meeting: Meeting) =>
    meeting.attendances.filter(a => a.status === 'ATTENDING')

  // 다이얼로그 폼 렌더링
  const renderFormFields = (prefix: string) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-title`} className="text-right">제목</Label>
        <Input id={`${prefix}-title`} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="col-span-3" placeholder="모임 제목을 입력하세요" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-date`} className="text-right">날짜 *</Label>
        <Input id={`${prefix}-date`} type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-time`} className="text-right">시간 *</Label>
        <Input id={`${prefix}-time`} type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">장소</Label>
        <div className="col-span-3 space-y-2">
          <Select
            value={locationType}
            onValueChange={(value) => {
              setFormData({ ...formData, location: value === '기타' ? '' : value })
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="디스코드">디스코드</SelectItem>
              <SelectItem value="오프라인">오프라인</SelectItem>
              <SelectItem value="기타">기타</SelectItem>
            </SelectContent>
          </Select>
          {locationType === '기타' && (
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="장소를 입력하세요"
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor={`${prefix}-memo`} className="text-right pt-2">메모</Label>
        <Textarea id={`${prefix}-memo`} value={formData.memo} onChange={(e) => setFormData({ ...formData, memo: e.target.value })} className="col-span-3" placeholder="모임에 대한 메모를 작성하세요..." rows={3} />
      </div>
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">참석자</Label>
        <div className="col-span-3">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 멤버가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox id={`${prefix}-attendee-${member.id}`} checked={formData.attendees.includes(member.id)} onCheckedChange={(checked) => handleAttendeeChange(member.id, checked as boolean)} />
                  <Label htmlFor={`${prefix}-attendee-${member.id}`} className="text-sm font-normal cursor-pointer">{member.nickname}</Label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-heading)]">모임 일정</h1>
            <p className="text-sm text-muted-foreground mt-1">
              전체 {meetings.length}회 · 예정 {upcomingMeetings.length}회
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-1" />
                모임 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>새 모임 추가</DialogTitle>
                <DialogDescription>새로운 모임의 정보를 입력해주세요.</DialogDescription>
              </DialogHeader>
              {renderFormFields('add')}
              <DialogFooter>
                <Button type="submit" onClick={handleAddMeeting} disabled={submitting}>
                  {submitting ? '추가 중...' : '모임 추가'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 검색 */}
        <div className="mb-8">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="모임 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground">모임 데이터를 불러오는 중...</div>
          </div>
        ) : filteredMeetings.length === 0 && !searchTerm ? (
          <div className="text-center py-16">
            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-2">등록된 모임이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">새로운 모임을 추가해보세요.</p>
          </div>
        ) : (
          <>
            {/* 다음 모임 하이라이트 */}
            {nextMeeting && (
              <div className="mb-10">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">NEXT</p>
                <Card>
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-1">
                          <h2 className="text-xl lg:text-2xl font-semibold text-foreground font-[family-name:var(--font-heading)]">
                            {formatDateLarge(nextMeeting.date).date}
                          </h2>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            {formatDateLarge(nextMeeting.date).time}
                          </div>
                        </div>

                        {nextMeeting.title && (
                          <p className="text-sm font-medium text-foreground mt-2">{nextMeeting.title}</p>
                        )}

                        <div className="flex items-center text-sm text-muted-foreground mt-2">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {nextMeeting.location || '장소 미정'}
                        </div>

                        {getAttendingMembers(nextMeeting).length > 0 && (
                          <div className="flex items-center gap-2 mt-4">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <div className="flex -space-x-1.5">
                              {getAttendingMembers(nextMeeting).slice(0, 6).map((a) => (
                                <Avatar key={a.member.id} className="h-7 w-7 border-2 border-card" title={a.member.nickname}>
                                  <AvatarImage src={a.member.avatarUrl || ''} alt={a.member.nickname} />
                                  <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                    {a.member.nickname.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getAttendingCount(nextMeeting)}명 참석
                            </span>
                          </div>
                        )}

                        {nextMeeting.memo && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{nextMeeting.memo}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditMeeting(nextMeeting)}>
                          <Edit className="h-3.5 w-3.5 mr-1" />
                          수정
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteMeeting(nextMeeting.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 예정된 모임 (나머지) */}
            {restUpcoming.length > 0 && (
              <div className="mb-10">
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">예정된 모임</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {restUpcoming.map((meeting) => {
                    const { date, time } = formatDateCompact(meeting.date)
                    return (
                      <Card key={meeting.id}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{date}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-0.5" />
                                  {time}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-0.5" />
                                  {meeting.location || '미정'}
                                </span>
                              </div>
                              {meeting.title && (
                                <p className="text-xs text-muted-foreground mt-2 truncate">{meeting.title}</p>
                              )}
                              {getAttendingMembers(meeting).length > 0 && (
                                <div className="flex items-center gap-1.5 mt-3">
                                  <div className="flex -space-x-1">
                                    {getAttendingMembers(meeting).slice(0, 4).map((a) => (
                                      <Avatar key={a.member.id} className="h-5 w-5 border-2 border-card" title={a.member.nickname}>
                                        <AvatarImage src={a.member.avatarUrl || ''} alt={a.member.nickname} />
                                        <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                                          {a.member.nickname.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{getAttendingCount(meeting)}명</span>
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditMeeting(meeting)}>
                                  <Edit className="h-3.5 w-3.5 mr-2" />
                                  수정
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteMeeting(meeting.id)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 지난 모임 타임라인 */}
            {pastMeetings.length > 0 && (
              <div>
                <p className="text-xs tracking-widest uppercase text-muted-foreground mb-4">지난 모임</p>
                <div className="space-y-6">
                  {Object.entries(pastByYear)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([year, yearMeetings]) => (
                      <div key={year}>
                        <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{year}</p>
                        <div className="space-y-1 border-l border-border pl-4">
                          {yearMeetings.map((meeting) => {
                            const date = new Date(meeting.date)
                            const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                            const attending = getAttendingCount(meeting)
                            return (
                              <div key={meeting.id} className="flex items-center gap-3 py-2 group">
                                <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{dateStr}</span>
                                <span className="text-sm text-foreground truncate flex-1">
                                  {meeting.title || meeting.location || '모임'}
                                </span>
                                <span className="flex items-center text-xs text-muted-foreground flex-shrink-0">
                                  <MapPin className="h-3 w-3 mr-0.5" />
                                  {meeting.location || '미정'}
                                </span>
                                {attending > 0 && (
                                  <span className="text-xs text-muted-foreground flex-shrink-0">{attending}명</span>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditMeeting(meeting)}>
                                      <Edit className="h-3.5 w-3.5 mr-2" />
                                      수정
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteMeeting(meeting.id)} className="text-destructive focus:text-destructive">
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      삭제
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {filteredMeetings.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <Search className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">검색 결과가 없습니다</p>
              </div>
            )}
          </>
        )}

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>모임 수정</DialogTitle>
              <DialogDescription>모임의 정보를 수정해주세요.</DialogDescription>
            </DialogHeader>
            {renderFormFields('edit')}
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateMeeting} disabled={submitting}>
                {submitting ? '수정 중...' : '수정 완료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
