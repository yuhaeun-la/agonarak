import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRatingDisplay } from '@/components/ui/star-rating'
import { prisma } from '@/lib/prisma'

const START_DATE = new Date('2022-03-19')

const emptyData = {
  stats: { daysSinceStart: 0, totalBooks: 0, totalMeetings: 0, totalMembers: 0 },
  upcomingMeetings: [] as Array<{ id: string; date: string; location: string; memo: string; title: string; books: Array<{ id: string; title: string; author: string }> }>,
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
      title: m.title || '',
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
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }),
    time: date.toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { stats, upcomingMeetings, recentBooks, topRatedBook } = await getDashboardData()

  const nextMeeting = upcomingMeetings[0] || null

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* D+ 히어로 */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">아고나락</p>
          <div className="text-5xl sm:text-6xl font-normal font-[family-name:var(--font-heading)] tracking-tight leading-none">
            D+{stats.daysSinceStart}
          </div>
          <p className="text-sm text-muted-foreground mt-3">2022. 3. 19 ~</p>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalBooks}권 · {stats.totalMeetings}회 모임 · {stats.totalMembers}명
          </p>
        </div>

        {/* 다가오는 모임 */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">다가오는 모임</p>
          {nextMeeting ? (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-medium font-[family-name:var(--font-heading)]">
                      {formatDateTime(nextMeeting.date).date}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(nextMeeting.date).time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {nextMeeting.location || '장소 미정'}
                      </span>
                    </div>
                    {nextMeeting.title && (
                      <p className="text-sm text-foreground mt-2">{nextMeeting.title}</p>
                    )}
                    {nextMeeting.books.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {nextMeeting.books.map(b => b.title).join(', ')}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild className="flex-shrink-0 text-muted-foreground">
                    <Link href="/meetings">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-10 border rounded-lg">
              <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">예정된 모임이 없습니다</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/meetings">모임 추가하기</Link>
              </Button>
            </div>
          )}
        </div>

        {/* 최고 평점 */}
        {topRatedBook && (
          <div className="mb-10">
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">최고 평점</p>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground truncate">{topRatedBook.title}</p>
                  <p className="text-xs text-muted-foreground">{topRatedBook.author}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StarRatingDisplay rating={topRatedBook.rating} />
                <Avatar className="h-5 w-5" title={topRatedBook.addedBy}>
                  <AvatarImage src={topRatedBook.addedByAvatarUrl || ''} alt={topRatedBook.addedBy} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                    {topRatedBook.addedBy.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        )}

        {/* 최근 추가된 책 */}
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">최근 추가된 책</p>
          {recentBooks.length === 0 ? (
            <div className="text-center py-10 border rounded-lg">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">등록된 책이 없습니다</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/books">책 추가하기</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg divide-y">
                {recentBooks.map((book) => (
                  <Link key={book.id} href={`/books/${book.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="h-12 w-9 rounded object-cover bg-muted flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-9 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                    <div className="flex-shrink-0 hidden sm:flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {book.genres.slice(0, 2).join(' · ')}
                      </p>
                      <Avatar className="h-5 w-5" title={book.addedBy}>
                        <AvatarImage src={book.addedByAvatarUrl || ''} alt={book.addedBy} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                          {book.addedBy.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/books">모든 책 보기</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
