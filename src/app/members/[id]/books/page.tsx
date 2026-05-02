'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, BookOpen, Search, Calendar, User, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  notes: string
  rating: number
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push('/books')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            책 관리로 돌아가기
          </Button>

          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member?.avatarUrl || ''} alt={member?.nickname || ''} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {member?.nickname?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-medium text-foreground font-[family-name:var(--font-heading)] mb-1">
                {member?.nickname}님의 독서 내역
              </h1>
              <p className="text-sm text-muted-foreground">
                총 {uniqueBooks.size}권의 책을 읽었습니다. (전체 등록 {books.length}회)
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 등록 도서</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-normal font-[family-name:var(--font-heading)]">{uniqueBooks.size}</div>
              <p className="text-xs text-muted-foreground">책 수 (전체 {books.length}회)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">선호 장르</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-normal font-[family-name:var(--font-heading)]">{topGenres.length > 0 ? topGenres[0][0] : '-'}</div>
              <p className="text-xs text-muted-foreground">{topGenres.length > 0 ? `${topGenres[0][1]}권` : '데이터 없음'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">장르 다양성</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-normal font-[family-name:var(--font-heading)]">{Object.keys(genreStats).length}</div>
              <p className="text-xs text-muted-foreground">다룬 장르 수</p>
            </CardContent>
          </Card>
        </div>

        {/* 장르별 통계 */}
        {topGenres.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>선호 장르 TOP 5</CardTitle>
              <CardDescription>가장 많이 등록한 장르들입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topGenres.map(([genre, count]) => (
                  <div key={genre} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{genre}</span>
                    <span className="text-xs text-muted-foreground">{count as number}권</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 검색 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input placeholder="책 제목, 저자, 장르로 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* 책 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>등록한 책 목록</CardTitle>
            <CardDescription>현재 {filteredBooks.length}권의 책이 표시되고 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">책 데이터를 불러오는 중...</div>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '등록한 책이 없습니다'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? '다른 검색어로 시도해보세요.' : '아직 등록한 책이 없습니다.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>저자</TableHead>
                    <TableHead>장르</TableHead>
                    <TableHead>별점</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>메모</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {book.genres.length > 0 ? book.genres.join(' · ') : '장르 없음'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {book.rating > 0 ? (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: book.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-foreground text-foreground" />
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(book.registeredDate)}</div>
                      </TableCell>
                      <TableCell>
                        {book.notes ? (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{book.notes}</div>
                        ) : (
                          <span className="text-sm text-muted-foreground">메모 없음</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
