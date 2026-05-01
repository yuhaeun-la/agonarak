import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  MapPin,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { prisma } from '@/lib/prisma'

const emptyData = {
  stats: { totalMembers: 0, upcomingMeetings: 0, booksThisMonth: 0, totalBooks: 0 },
  upcomingMeetings: [] as Array<{ id: string; date: string; location: string; memo: string; books: Array<{ id: string; title: string; author: string }> }>,
  recentBooks: [] as Array<{ id: string; title: string; author: string; genres: string[]; addedBy: string; addedByAvatarUrl: string | null; createdAt: string }>
}

async function getDashboardData() {
  try {
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [members, meetings, books] = await Promise.all([
      prisma.member.findMany({ select: { id: true } }),
      prisma.meeting.findMany({
        where: { date: { gte: now } },
        include: {
          books: {
            include: {
              book: { select: { id: true, title: true, author: true } }
            }
          }
        },
        orderBy: { date: 'asc' },
        take: 3
      }),
      prisma.book.findMany({
        include: {
          addedBy: { select: { nickname: true, avatarUrl: true } },
          genres: { include: { genre: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ])

    const uniqueBooks = new Set<string>()
    const uniqueBooksThisMonth = new Set<string>()

    books.forEach((book) => {
      const bookKey = `${book.title}-${book.author}`
      uniqueBooks.add(bookKey)
      if (book.createdAt >= thisMonth) {
        uniqueBooksThisMonth.add(bookKey)
      }
    })

    const upcomingMeetings = meetings.map((m) => ({
      id: m.id,
      date: m.date.toISOString(),
      location: m.location || '',
      memo: m.memo || '',
      books: m.books.map((mb) => mb.book)
    }))

    const recentBooks = books.slice(0, 5).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      genres: b.genres.map((bg) => bg.genre.name),
      addedBy: b.addedBy?.nickname || 'Unknown',
      addedByAvatarUrl: b.addedBy?.avatarUrl || null,
      createdAt: b.createdAt.toISOString()
    }))

    return {
      stats: {
        totalMembers: members.length,
        upcomingMeetings: upcomingMeetings.length,
        booksThisMonth: uniqueBooksThisMonth.size,
        totalBooks: uniqueBooks.size
      },
      upcomingMeetings,
      recentBooks
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return emptyData
  }
}

function formatDateTime(dateString: string) {
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { stats, upcomingMeetings, recentBooks } = await getDashboardData()

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-foreground font-[family-name:var(--font-heading)]">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            독서 모임 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 카드 - 하나의 카드 안에서 디바이더로 4등분 */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">전체 멤버</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-normal font-[family-name:var(--font-heading)]">{stats.totalMembers}</div>
                <p className="text-xs text-muted-foreground mt-1">활성 멤버 수</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">예정된 모임</p>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-normal font-[family-name:var(--font-heading)]">{stats.upcomingMeetings}</div>
                <p className="text-xs text-muted-foreground mt-1">다가오는 모임</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">이번 달 책</p>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-normal font-[family-name:var(--font-heading)]">{stats.booksThisMonth}</div>
                <p className="text-xs text-muted-foreground mt-1">이번 달 추가된 책</p>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">전체 책</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-normal font-[family-name:var(--font-heading)]">{stats.totalBooks}</div>
                <p className="text-xs text-muted-foreground mt-1">총 등록된 책</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          {/* 다가오는 모임 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
                <Calendar className="h-5 w-5" />
                다가오는 모임
              </CardTitle>
              <CardDescription>예정된 모임 일정을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-sm font-medium text-foreground mb-2">예정된 모임이 없습니다</h3>
                  <p className="text-sm text-muted-foreground mb-4">새로운 모임을 추가해보세요.</p>
                  <Button asChild>
                    <Link href="/meetings">
                      <Calendar className="h-4 w-4 mr-2" />
                      모임 추가하기
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map((meeting) => {
                    const { date, time } = formatDateTime(meeting.date)
                    return (
                      <div key={meeting.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{date}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {time}
                            </div>
                          </div>
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{meeting.location || '장소 미정'}</p>
                          </div>
                          {meeting.books.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-muted-foreground">
                                {meeting.books.map(book => book.title).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/meetings">모든 모임 보기</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 최근 추가된 책 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-medium">
                <BookOpen className="h-5 w-5" />
                최근 추가된 책
              </CardTitle>
              <CardDescription>최근에 등록된 책들을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {recentBooks.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-sm font-medium text-foreground mb-2">등록된 책이 없습니다</h3>
                  <p className="text-sm text-muted-foreground mb-4">첫 번째 책을 추가해보세요.</p>
                  <Button asChild>
                    <Link href="/books">
                      <BookOpen className="h-4 w-4 mr-2" />
                      책 추가하기
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBooks.map((book) => (
                    <div key={book.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(book.createdAt)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {book.genres.slice(0, 2).join(' · ')}
                            {book.genres.length > 2 && ` +${book.genres.length - 2}`}
                          </p>
                          <Avatar className="h-4 w-4" title={book.addedBy}>
                            <AvatarImage src={book.addedByAvatarUrl || ''} alt={book.addedBy} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                              {book.addedBy.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/books">모든 책 보기</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 빠른 액션 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-medium">빠른 시작</CardTitle>
            <CardDescription>자주 사용하는 기능들에 빠르게 접근하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button className="h-20 flex-col space-y-2" asChild>
                <Link href="/members">
                  <Users className="h-6 w-6" />
                  <span>멤버 관리</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <Link href="/meetings">
                  <Calendar className="h-6 w-6" />
                  <span>모임 일정</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <Link href="/books">
                  <BookOpen className="h-6 w-6" />
                  <span>책 관리</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
                <Link href="/books">
                  <TrendingUp className="h-6 w-6" />
                  <span>통계 보기</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
