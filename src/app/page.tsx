import Link from 'next/link'
import { Suspense } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  BookOpen,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRatingDisplay } from '@/components/ui/star-rating'
import {
  getDashboardStats,
  getUpcomingMeeting,
  getTopRatedBook,
  getRecentBooks
} from '@/lib/data/dashboard'

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

// Stats component - loads first (fastest query)
async function StatsSection() {
  const stats = await getDashboardStats()

  return (
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
  )
}

// Upcoming meetings component
async function UpcomingMeetingsSection() {
  const nextMeeting = await getUpcomingMeeting()

  return (
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
  )
}

// Top rated book component
async function TopRatedBookSection() {
  const topRatedBook = await getTopRatedBook()

  if (!topRatedBook) return null

  return (
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
  )
}

// Recent books component
async function RecentBooksSection() {
  const recentBooks = await getRecentBooks()

  return (
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
  )
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export const revalidate = 60 // 60초 동안 캐시

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* D+ 히어로 - 가장 빠름 */}
        <Suspense fallback={<LoadingFallback />}>
          <StatsSection />
        </Suspense>

        {/* 다가오는 모임 */}
        <Suspense fallback={<LoadingFallback />}>
          <UpcomingMeetingsSection />
        </Suspense>

        {/* 최고 평점 */}
        <Suspense fallback={<LoadingFallback />}>
          <TopRatedBookSection />
        </Suspense>

        {/* 최근 추가된 책 */}
        <Suspense fallback={<LoadingFallback />}>
          <RecentBooksSection />
        </Suspense>
      </div>
    </div>
  )
}
