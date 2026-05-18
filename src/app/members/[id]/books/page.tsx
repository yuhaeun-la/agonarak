'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, BookOpen, Search, Star, Hash, BarChart3 } from 'lucide-react'
import { StarRatingDisplay } from '@/components/ui/star-rating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  notes: string
  rating: number
  thumbnail: string | null
  registeredDate: string
  createdAt: string
  addedById: string | null
}

interface Member {
  id: string
  nickname: string
  role: 'LEADER' | 'MEMBER'
  contact: string
  avatarUrl: string | null
}

export default function MemberBooksPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (memberId) {
      Promise.all([fetchMember(), fetchMemberBooks()])
    }
  }, [memberId])

  const fetchMember = async () => {
    try {
      const response = await fetch('/api/members')
      if (!response.ok) throw new Error('Failed to fetch members')
      const members = await response.json()
      const foundMember = members.find((m: Member) => m.id === memberId)
      if (!foundMember) throw new Error('Member not found')
      setMember(foundMember)
    } catch (error) {
      console.error('Error fetching member:', error)
      setError('멤버 정보를 불러오는데 실패했습니다.')
    }
  }

  const fetchMemberBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/books')
      if (!response.ok) throw new Error('Failed to fetch books')
      const allBooks = await response.json()
      const memberBooks = allBooks.filter((book: Book) => book.addedById === memberId)
      setBooks(memberBooks)
      setError('')
    } catch (error) {
      console.error('Error fetching member books:', error)
      setError('책 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.genres.some(genre => genre.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const uniqueBooks = new Map()
  books.forEach(book => {
    const bookKey = `${book.title}-${book.author}`
    if (!uniqueBooks.has(bookKey)) {
      uniqueBooks.set(bookKey, book)
    }
  })

  const genreStats = Array.from(uniqueBooks.values()).reduce((acc, book: Book) => {
    book.genres.forEach((genre: string) => {
      acc[genre] = (acc[genre] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const topGenres = Object.entries(genreStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)

  const maxGenreCount = topGenres.length > 0 ? (topGenres[0][1] as number) : 0

  const topRatedBook = books
    .filter(b => b.rating > 0)
    .sort((a, b) => b.rating - a.rating)[0] || null

  // 타임라인: 등록일 기준 연도-월 그룹핑
  const timelineGroups = [...books]
    .sort((a, b) => new Date(b.registeredDate).getTime() - new Date(a.registeredDate).getTime())
    .reduce((acc, book) => {
      const date = new Date(book.registeredDate)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}`
      if (!acc[key]) acc[key] = []
      acc[key].push({ ...book, month })
      return acc
    }, {} as Record<string, (Book & { month: number })[]>)

  if (loading && !member) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-muted-foreground">데이터를 불러오는 중...</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/books')} className="mb-6 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          책 관리
        </Button>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 프로필 히어로 */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member?.avatarUrl || ''} alt={member?.nickname || ''} />
              <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                {member?.nickname?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-heading)]">
                {member?.nickname}님의 서재
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                총 {uniqueBooks.size}권 · {Object.keys(genreStats).length}개 장르
              </p>
            </div>
          </div>
        </div>

        {/* 통계 카드 4개 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">총 도서</p>
                <BookOpen className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="text-3xl font-normal font-[family-name:var(--font-heading)]">{uniqueBooks.size}</div>
              <p className="text-xs text-muted-foreground mt-1">전체 {books.length}회 등록</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">선호 장르</p>
                <Hash className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="text-3xl font-normal font-[family-name:var(--font-heading)] truncate">
                {topGenres.length > 0 ? topGenres[0][0] : '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {topGenres.length > 0 ? `${topGenres[0][1]}권` : '데이터 없음'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">장르 수</p>
                <BarChart3 className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <div className="text-3xl font-normal font-[family-name:var(--font-heading)]">{Object.keys(genreStats).length}</div>
              <p className="text-xs text-muted-foreground mt-1">다룬 장르</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs tracking-widest uppercase text-muted-foreground">최고 평점</p>
                <Star className="h-4 w-4 text-muted-foreground/50" />
              </div>
              {topRatedBook ? (
                <>
                  <p className="text-sm font-medium text-foreground truncate">{topRatedBook.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{topRatedBook.author}</p>
                  <div className="mt-1.5">
                    <StarRatingDisplay rating={topRatedBook.rating} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">평가 없음</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 장르 분포 + 독서 타임라인 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">

          {/* 장르 분포 바 차트 */}
          {topGenres.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium">장르 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topGenres.map(([genre, count]) => (
                    <div key={genre}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{genre}</span>
                        <span className="text-xs text-muted-foreground">{count as number}권</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground rounded-full transition-all duration-500"
                          style={{ width: `${((count as number) / maxGenreCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 독서 타임라인 */}
          {Object.keys(timelineGroups).length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-medium">독서 타임라인</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {Object.entries(timelineGroups).map(([year, yearBooks]) => (
                    <div key={year}>
                      <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">{year}</p>
                      <div className="space-y-2 border-l border-border pl-4">
                        {yearBooks.map((book) => (
                          <div key={book.id} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-8 flex-shrink-0">{book.month}월</span>
                            <span className="text-sm text-foreground truncate flex-1">{book.title}</span>
                            {book.rating > 0 && (
                              <div className="flex-shrink-0">
                                <StarRatingDisplay rating={book.rating} size="xs" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="책 제목, 저자, 장르로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 책 카드 그리드 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">책 데이터를 불러오는 중...</div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '등록한 책이 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? '다른 검색어로 시도해보세요.' : '아직 등록한 책이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="h-24 w-16 rounded object-cover bg-muted flex-shrink-0"
                      />
                    ) : (
                      <div className="h-24 w-16 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 flex flex-col">
                      <p className="text-sm font-medium text-foreground leading-tight truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>

                      {book.rating > 0 && (
                        <div className="mt-2">
                          <StarRatingDisplay rating={book.rating} />
                        </div>
                      )}

                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {book.genres.slice(0, 2).join(' · ')}
                          {book.genres.length > 2 && ` +${book.genres.length - 2}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(book.registeredDate).toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  {book.notes && (
                    <div className="px-4 pb-3 pt-0">
                      <p className="text-xs text-muted-foreground truncate border-t border-border pt-2">{book.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
