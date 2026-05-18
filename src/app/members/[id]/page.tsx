'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Star, MapPin, CalendarDays, BarChart3 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  rating: number
  thumbnail: string | null
  registeredDate: string
  addedById: string | null
}

interface Member {
  id: string
  nickname: string
  role: 'LEADER' | 'MEMBER'
  contact: string
  avatarUrl: string | null
  attendanceStats?: {
    totalMeetings: number
    attendedMeetings: number
    attendanceRate: number
  }
}

interface Meeting {
  id: string
  date: string
  location: string
  title: string
  attendances: Array<{
    member: { id: string; nickname: string }
    status: 'ATTENDING' | 'NOT_ATTENDING' | 'UNDECIDED'
  }>
}

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (memberId) {
      Promise.all([fetchMember(), fetchBooks(), fetchMeetings()]).finally(() => setLoading(false))
    }
  }, [memberId])

  const fetchMember = async () => {
    try {
      const response = await fetch('/api/members')
      if (!response.ok) return
      const members = await response.json()
      const found = members.find((m: Member) => m.id === memberId)
      if (found) setMember(found)
    } catch (error) {
      console.error('Error fetching member:', error)
    }
  }

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books')
      if (!response.ok) return
      const allBooks = await response.json()
      setBooks(allBooks.filter((b: Book) => b.addedById === memberId))
    } catch (error) {
      console.error('Error fetching books:', error)
    }
  }

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/meetings')
      if (!response.ok) return
      const allMeetings = await response.json()
      setMeetings(allMeetings)
    } catch (error) {
      console.error('Error fetching meetings:', error)
    }
  }

  // 고유 도서
  const uniqueBooks = new Map<string, Book>()
  books.forEach(book => {
    const key = `${book.title}-${book.author}`
    if (!uniqueBooks.has(key)) uniqueBooks.set(key, book)
  })

  // 장르 통계
  const genreStats: Record<string, number> = {}
  Array.from(uniqueBooks.values()).forEach(book => {
    book.genres?.forEach(g => { genreStats[g] = (genreStats[g] || 0) + 1 })
  })
  const topGenres = Object.entries(genreStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
  const maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 0

  // 참석한 모임
  const attendedMeetings = meetings
    .filter(m => m.attendances.some(a => a.member.id === memberId && a.status === 'ATTENDING'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // 최근 책 5권
  const recentBooks = [...books]
    .sort((a, b) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="text-center py-16">
            <div className="text-muted-foreground">데이터를 불러오는 중...</div>
          </div>
        </main>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="text-center py-16">
            <div className="text-muted-foreground">멤버를 찾을 수 없습니다.</div>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/members')}>
              멤버 목록으로
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/members')} className="mb-6 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          멤버 관리
        </Button>

        {/* 프로필 히어로 */}
        <div className="flex flex-col items-center text-center mb-10">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={member.avatarUrl || ''} alt={member.nickname} />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
              {member.nickname.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold text-foreground font-[family-name:var(--font-heading)]">
              {member.nickname}
            </h1>
            {member.role === 'LEADER' && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">리더</Badge>
            )}
          </div>
          {member.contact && (
            <p className="text-sm text-muted-foreground">{member.contact}</p>
          )}
        </div>

        {/* 활동 요약 3카드 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">등록 도서</p>
              <p className="text-2xl font-normal font-[family-name:var(--font-heading)]">{uniqueBooks.size}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">참석률</p>
              <p className="text-2xl font-normal font-[family-name:var(--font-heading)]">
                {member.attendanceStats && member.attendanceStats.totalMeetings > 0
                  ? `${member.attendanceStats.attendanceRate.toFixed(0)}%`
                  : '-'
                }
              </p>
              {member.attendanceStats && member.attendanceStats.totalMeetings > 0 && (
                <p className="text-[10px] text-muted-foreground/60">
                  {member.attendanceStats.attendedMeetings}/{member.attendanceStats.totalMeetings}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">장르 수</p>
              <p className="text-2xl font-normal font-[family-name:var(--font-heading)]">{Object.keys(genreStats).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* 장르 분포 + 최근 참석 모임 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          {/* 장르 분포 */}
          {topGenres.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  선호 장르
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topGenres.map(([genre, count]) => (
                    <div key={genre}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{genre}</span>
                        <span className="text-xs text-muted-foreground">{count}권</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxGenreCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 최근 참석 모임 */}
          {attendedMeetings.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  최근 참석 모임
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 border-l border-border pl-4">
                  {attendedMeetings.map((meeting) => {
                    const date = new Date(meeting.date)
                    const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                    return (
                      <div key={meeting.id} className="flex items-center gap-3 py-2">
                        <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{dateStr}</span>
                        <span className="text-sm text-foreground truncate flex-1">
                          {meeting.title || '모임'}
                        </span>
                        <span className="flex items-center text-xs text-muted-foreground flex-shrink-0">
                          <MapPin className="h-3 w-3 mr-0.5" />
                          {meeting.location || '미정'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 최근 등록한 책 */}
        {recentBooks.length > 0 && (
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">최근 등록한 책</p>
            <div className="border rounded-lg divide-y mb-4">
              {recentBooks.map((book) => (
                <div key={book.id} className="flex items-center gap-3 p-3">
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
                  <div className="flex-shrink-0 hidden sm:block">
                    {book.rating > 0 ? (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: book.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-foreground text-foreground" />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block w-16 truncate text-right">
                    {book.genres?.[0] || ''}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/members/${memberId}/books`}>전체 서재 보기</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
