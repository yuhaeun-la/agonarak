import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  BookOpen,
  Users,
  Clock,
  MapPin,
  Star,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { prisma } from '@/lib/prisma'

const START_DATE = new Date('2022-03-19')

const emptyData = {
  stats: { daysSinceStart: 0, totalBooks: 0, totalMeetings: 0, totalMembers: 0 },
  upcomingMeetings: [] as Array<{ id: string; date: string; location: string; memo: string; books: Array<{ id: string; title: string; author: string }> }>,
  recentBooks: [] as Array<{ id: string; title: string; author: string; thumbnail: string | null; genres: string[]; addedBy: string; addedByAvatarUrl: string | null; createdAt: string }>,
  topRatedBook: null as { title: string; author: string; rating: number; addedBy: string; addedByAvatarUrl: string | null } | null
}

async function getDashboardData() {
  try {
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - START_DATE.getTime()) / 86400000)

    const [members, upcomingMeetingsRaw, totalMeetings, books, topRatedBookRaw] = await Promise.all([
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
      prisma.meeting.count(),
      prisma.book.findMany({
        include: {
          addedBy: { select: { nickname: true, avatarUrl: true } },
          genres: { include: { genre: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.book.findFirst({
        where: { rating: { gt: 0 } },
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        include: {
          addedBy: { select: { nickname: true, avatarUrl: true } },
        }
      })
    ])

    const uniqueBooks = new Set<string>()
    books.forEach((book) => {
      uniqueBooks.add(`${book.title}-${book.author}`)
    })

    const upcomingMeetings = upcomingMeetingsRaw.map((m) => ({
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
      thumbnail: b.thumbnail || null,
      genres: b.genres.map((bg) => bg.genre.name),
      addedBy: b.addedBy?.nickname || 'Unknown',
      addedByAvatarUrl: b.addedBy?.avatarUrl || null,
      createdAt: b.createdAt.toISOString()
    }))

    const topRatedBook = topRatedBookRaw ? {
      title: topRatedBookRaw.title,
      author: topRatedBookRaw.author,
      rating: topRatedBookRaw.rating || 0,
      addedBy: topRatedBookRaw.addedBy?.nickname || 'Unknown',
      addedByAvatarUrl: topRatedBookRaw.addedBy?.avatarUrl || null,
    } : null

    return {
      stats: {
        daysSinceStart,
        totalBooks: uniqueBooks.size,
        totalMeetings,
        totalMembers: members.length,
      },
      upcomingMeetings,
      recentBooks,
      topRatedBook,
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
  const { stats, upcomingMeetings, recentBooks, topRatedBook } = await getDashboardData()

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-2xl font-medium text-foreground font-[family-name:var(--font-heading)]">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            독서 모임 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 벤토 그리드 */}
        <div className="grid grid-cols-3 gap-5">

          {/* D+ 히어로 카드 */}
          <Card className="col-span-3 lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <CardContent className="flex flex-col justify-center h-full p-8 lg:py-12">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">아고나락</p>
              <div className="text-5xl lg:text-6xl font-normal font-[family-name:var(--font-heading)] tracking-tight leading-none">
                D+{stats.daysSinceStart}
              </div>
              <p className="text-sm text-muted-foreground mt-4">2022. 3. 19 ~</p>
            </CardContent>
          </Card>

          {/* 전체 책 */}
          <Card className="lg:col-start-2 lg:row-start-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">전체 책</p>
                <BookOpen className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="text-3xl font-normal font-[family-name:var(--font-heading)]">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground mt-1">누적 고유 권수</p>
            </CardContent>
          </Card>

          {/* 전체 모임 */}
          <Card className="lg:col-start-3 lg:row-start-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">전체 모임</p>
                <Calendar className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="text-3xl font-normal font-[family-name:var(--font-heading)]">{stats.totalMeetings}</div>
              <p className="text-xs text-muted-foreground mt-1">총 모임 횟수</p>
            </CardContent>
          </Card>

          {/* 전체 멤버 */}
          <Card className="lg:col-start-2 lg:row-start-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">전체 멤버</p>
                <Users className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="text-3xl font-normal font-[family-name:var(--font-heading)]">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">활성 멤버 수</p>
            </CardContent>
          </Card>

          {/* 최고 평점 */}
          <Card className="col-span-3 lg:col-span-1 lg:col-start-3 lg:row-start-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">최고 평점</p>
                <Star className="h-4 w-4 text-muted-foreground/50" />
              </div>
              {topRatedBook ? (
                <div>
                  <p className="text-sm font-medium text-foreground truncate">{topRatedBook.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{topRatedBook.author}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: topRatedBook.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-foreground text-foreground" />
                      ))}
                    </div>
                    <Avatar className="h-4 w-4" title={topRatedBook.addedBy}>
                      <AvatarImage src={topRatedBook.addedByAvatarUrl || ''} alt={topRatedBook.addedBy} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                        {topRatedBook.addedBy.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">아직 평점 없음</p>
              )}
            </CardContent>
          </Card>

          {/* 다가오는 모임 */}
          <Card className="col-span-3 lg:col-span-1 lg:col-start-1 lg:row-start-3 mt-2">
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
          <Card className="col-span-3 lg:col-span-2 lg:col-start-2 lg:row-start-3 mt-2">
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
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="h-14 w-10 rounded object-cover bg-muted"
                          />
                        ) : (
                          <div className="flex h-14 w-10 items-center justify-center rounded bg-muted">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
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
      </main>
    </div>
  )
}
