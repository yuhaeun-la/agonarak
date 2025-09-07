'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { CalendarDays, MapPin, Clock, Plus, Search, Users, Calendar } from 'lucide-react'

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
    }
    status: 'ATTENDING' | 'NOT_ATTENDING' | 'UNDECIDED'
  }>
  createdAt: string
}

export default function Meetings() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [members, setMembers] = useState<{id: string; nickname: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    memo: '',
    attendees: [] as string[] // 참석자 ID 배열
  })

  // 데이터 로드
  useEffect(() => {
    Promise.all([fetchMeetings(), fetchMembers()])
  }, [])

  const fetchMeetings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/meetings')
      if (!response.ok) {
        throw new Error('Failed to fetch meetings')
      }
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
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
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
           meeting.books.some(book => 
             book.title.toLowerCase().includes(searchLower) ||
             book.author.toLowerCase().includes(searchLower)
           )
  })

  const handleAddMeeting = async () => {
    // 폼 검증
    if (!formData.date.trim() || !formData.time.trim()) {
      setError('날짜와 시간은 필수입니다.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // 모임 목록 새로고침
      await fetchMeetings()
      
      // 폼 초기화
      setFormData({
        title: '',
        date: '',
        time: '',
        location: '',
        memo: '',
        attendees: []
      })

      // 다이얼로그 닫기
      setIsAddDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error adding meeting:', error)
      setError(error instanceof Error ? error.message : '모임 추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      memo: '',
      attendees: []
    })
    setError('')
  }

  const handleAttendeeChange = (memberId: string, isChecked: boolean) => {
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, memberId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        attendees: prev.attendees.filter(id => id !== memberId)
      }))
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }),
      time: date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ATTENDING':
        return <Badge className="bg-green-100 text-green-800">참석</Badge>
      case 'NOT_ATTENDING':
        return <Badge className="bg-red-100 text-red-800">불참</Badge>
      case 'UNDECIDED':
        return <Badge className="bg-yellow-100 text-yellow-800">미정</Badge>
      default:
        return <Badge variant="outline">미정</Badge>
    }
  }


  // 다가오는 모임과 지난 모임 분리
  const now = new Date()
  const upcomingMeetings = filteredMeetings.filter(meeting => new Date(meeting.date) >= now)
  const pastMeetings = filteredMeetings.filter(meeting => new Date(meeting.date) < now)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">모임 일정</h1>
          <p className="text-gray-600">북클럽 모임 일정을 관리하고 참석 현황을 확인하세요.</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 모임</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
              <p className="text-xs text-muted-foreground">
                총 모임 수
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">예정된 모임</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
              <p className="text-xs text-muted-foreground">
                다가오는 모임
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">지난 모임</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastMeetings.length}</div>
              <p className="text-xs text-muted-foreground">
                완료된 모임
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 추가 버튼 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="모임 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                모임 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>새 모임 추가</DialogTitle>
                <DialogDescription>
                  새로운 모임의 정보를 입력해주세요.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    제목
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="col-span-3"
                    placeholder="모임 제목을 입력하세요"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    날짜 *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    시간 *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    장소
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="col-span-3"
                    placeholder="모임 장소를 입력하세요"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="memo" className="text-right pt-2">
                    메모
                  </Label>
                  <Textarea
                    id="memo"
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    className="col-span-3"
                    placeholder="모임에 대한 메모를 작성하세요..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">
                    참석자
                  </Label>
                  <div className="col-span-3">
                    {members.length === 0 ? (
                      <p className="text-sm text-gray-500">등록된 멤버가 없습니다.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`attendee-${member.id}`}
                              checked={formData.attendees.includes(member.id)}
                              onCheckedChange={(checked) => handleAttendeeChange(member.id, checked as boolean)}
                            />
                            <Label
                              htmlFor={`attendee-${member.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {member.nickname}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleAddMeeting}
                  disabled={submitting}
                >
                  {submitting ? '추가 중...' : '모임 추가'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 예정된 모임 */}
        {upcomingMeetings.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                예정된 모임
              </CardTitle>
              <CardDescription>
                다가오는 {upcomingMeetings.length}개의 모임이 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>일시</TableHead>
                    <TableHead>장소</TableHead>
                    <TableHead>책</TableHead>
                    <TableHead>참석 현황</TableHead>
                    <TableHead>메모</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingMeetings.map((meeting) => {
                    const { date, time } = formatDateTime(meeting.date)
                    return (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {meeting.location || '장소 미정'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {meeting.books.length > 0 ? (
                            <div className="space-y-1">
                              {meeting.books.map((book) => (
                                <div key={book.id} className="text-sm">
                                  <div className="font-medium">{book.title}</div>
                                  <div className="text-gray-500">{book.author}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">책 미정</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {meeting.attendances.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {meeting.attendances.slice(0, 3).map((attendance) => (
                                <div key={attendance.member.id} className="text-xs">
                                  {getStatusBadge(attendance.status)}
                                </div>
                              ))}
                              {meeting.attendances.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{meeting.attendances.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">참석 현황 없음</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {meeting.memo ? (
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {meeting.memo}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">메모 없음</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* 전체 모임 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>모든 모임</CardTitle>
            <CardDescription>
              현재 {filteredMeetings.length}개의 모임이 등록되어 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">모임 데이터를 불러오는 중...</div>
              </div>
            ) : filteredMeetings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '등록된 모임이 없습니다'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? '다른 검색어로 시도해보세요.' : '새로운 모임을 추가해보세요.'}
                </p>
                {!searchTerm && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        첫 번째 모임 추가
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>일시</TableHead>
                    <TableHead>장소</TableHead>
                    <TableHead>책</TableHead>
                    <TableHead>참석 현황</TableHead>
                    <TableHead>메모</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeetings.map((meeting) => {
                    const { date, time } = formatDateTime(meeting.date)
                    const isPast = new Date(meeting.date) < now
                    return (
                      <TableRow key={meeting.id} className={isPast ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                              {isPast && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  완료
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {meeting.location || '장소 미정'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {meeting.books.length > 0 ? (
                            <div className="space-y-1">
                              {meeting.books.map((book) => (
                                <div key={book.id} className="text-sm">
                                  <div className="font-medium">{book.title}</div>
                                  <div className="text-gray-500">{book.author}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">책 미정</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {meeting.attendances.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {meeting.attendances.slice(0, 3).map((attendance) => (
                                <div key={attendance.member.id} className="text-xs">
                                  {getStatusBadge(attendance.status)}
                                </div>
                              ))}
                              {meeting.attendances.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{meeting.attendances.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">참석 현황 없음</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {meeting.memo ? (
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {meeting.memo}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">메모 없음</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}