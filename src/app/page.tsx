'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock,
  MapPin,
  User
} from 'lucide-react'

interface Stats {
  totalMembers: number
  upcomingMeetings: number
  booksThisMonth: number
  totalBooks: number
}

interface Meeting {
  id: string
  date: string
  location: string
  memo: string
  books: Array<{
    id: string
    title: string
    author: string
  }>
}

interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  addedBy: string
  createdAt: string
}

export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    upcomingMeetings: 0,
    booksThisMonth: 0,
    totalBooks: 0
  })
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([])
  const [recentBooks, setRecentBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 병렬로 데이터 가져오기
      const [membersRes, meetingsRes, booksRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/meetings'),
        fetch('/api/books')
      ])

      const members = membersRes.ok ? await membersRes.json() : []
      const meetings = meetingsRes.ok ? await meetingsRes.json() : []
      const books = booksRes.ok ? await booksRes.json() : []

      // 통계 계산
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const upcomingMeetingsList = meetings.filter((meeting: Meeting) => 
        new Date(meeting.date) >= now
      ).slice(0, 3)
      
      const booksThisMonth = books.filter((book: Book) => 
        new Date(book.createdAt) >= thisMonth
      ).length

      setStats({
        totalMembers: members.length,
        upcomingMeetings: upcomingMeetingsList.length,
        booksThisMonth,
        totalBooks: books.length
      })

      setUpcomingMeetings(upcomingMeetingsList)
      setRecentBooks(books.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }),
      time: date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-gray-500">데이터를 불러오는 중...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-sm text-gray-600">
            독서 모임 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 멤버</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                활성 멤버 수
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">예정된 모임</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingMeetings}</div>
              <p className="text-xs text-muted-foreground">
                다가오는 모임
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번 달 책</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.booksThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                이번 달 추가된 책
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 책</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground">
                총 등록된 책
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 다가오는 모임 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                다가오는 모임
              </CardTitle>
              <CardDescription>
                예정된 모임 일정을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    예정된 모임이 없습니다
                  </h3>
                  <p className="text-gray-500 mb-4">
                    새로운 모임을 추가해보세요.
                  </p>
                  <Button onClick={() => router.push('/meetings')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    모임 추가하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => {
                    const { date, time } = formatDateTime(meeting.date)
                    return (
                      <div key={meeting.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {date}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </div>
                          </div>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            <p className="text-sm text-gray-500">
                              {meeting.location || '장소 미정'}
                            </p>
                          </div>
                          {meeting.books.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-600">
                                📚 {meeting.books.map(book => book.title).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm" onClick={() => router.push('/meetings')}>
                      모든 모임 보기
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 추가된 책 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                최근 추가된 책
              </CardTitle>
              <CardDescription>
                최근에 등록된 책들을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentBooks.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    등록된 책이 없습니다
                  </h3>
                  <p className="text-gray-500 mb-4">
                    첫 번째 책을 추가해보세요.
                  </p>
                  <Button onClick={() => router.push('/books')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    책 추가하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBooks.map((book) => (
                    <div key={book.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                          <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {book.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(book.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">{book.author}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex flex-wrap gap-1">
                            {book.genres && book.genres.length > 0 ? (
                              book.genres.slice(0, 2).map((genre) => (
                                <Badge key={genre} variant="outline" className="text-xs">
                                  {genre}
                                </Badge>
                              ))
                            ) : null}
                            {book.genres && book.genres.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{book.genres.length - 2}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="h-3 w-3 mr-1" />
                            {book.addedBy}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm" onClick={() => router.push('/books')}>
                      모든 책 보기
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 빠른 액션 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>빠른 시작</CardTitle>
            <CardDescription>
              자주 사용하는 기능들에 빠르게 접근하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button 
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/members')}
              >
                <Users className="h-6 w-6" />
                <span>멤버 관리</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/meetings')}
              >
                <Calendar className="h-6 w-6" />
                <span>모임 일정</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/books')}
              >
                <BookOpen className="h-6 w-6" />
                <span>책 관리</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/books')}
              >
                <TrendingUp className="h-6 w-6" />
                <span>통계 보기</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}