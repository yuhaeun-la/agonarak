'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowLeft, BookOpen, Star, Edit, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

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
  addedBy: string
  addedByAvatarUrl: string | null
  addedById: string | null
}

interface Member {
  id: string
  nickname: string
  avatarUrl: string | null
}

interface SearchResult {
  title: string
  author: string
  publisher: string
  isbn: string
  thumbnail: string
}

const genreOptions = [
  '문학 (소설/시/에세이)',
  '인문/사회',
  '역사',
  '철학',
  '경제/경영',
  '과학/기술',
  '자기계발',
  '예술/문화',
  '여행',
  '아동/청소년',
  '기타 (만화, 에세이집 등)',
]

export default function BookDetailPage() {
  const router = useRouter()
  const params = useParams()
  const bookId = params.id as string

  const [book, setBook] = useState<Book | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // 수정 관련 상태
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    registeredDate: '',
    genres: [] as string[],
    notes: '',
    rating: 0,
    thumbnail: '',
    addedById: '',
  })

  // 책 검색 관련
  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [bookSearchResults, setBookSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bookId) {
      Promise.all([fetchBook(), fetchMembers()]).finally(() => setLoading(false))
    }
  }, [bookId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`)
      if (!response.ok) return
      const data = await response.json()
      setBook(data)
    } catch (error) {
      console.error('Error fetching book:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (!response.ok) return
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const searchBooks = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setBookSearchResults([])
      setShowSearchResults(false)
      return
    }
    setIsSearching(true)
    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const results = await response.json()
        setBookSearchResults(results)
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Book search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleBookSearchChange = (value: string) => {
    setBookSearchQuery(value)
    setFormData(prev => ({ ...prev, title: value }))
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => searchBooks(value), 300)
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    setFormData(prev => ({ ...prev, title: result.title, author: result.author, thumbnail: result.thumbnail || '' }))
    setBookSearchQuery(result.title)
    setShowSearchResults(false)
    setBookSearchResults([])
  }

  const handleGenreChange = (genreName: string, checked: boolean | string | undefined) => {
    const isChecked = checked === true || checked === 'true'
    if (isChecked) {
      setFormData(prev => ({ ...prev, genres: [...prev.genres, genreName] }))
    } else {
      setFormData(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genreName) }))
    }
  }

  const handleOpenEdit = () => {
    if (!book) return
    setFormData({
      title: book.title,
      author: book.author,
      registeredDate: book.registeredDate.split('T')[0],
      genres: book.genres,
      notes: book.notes || '',
      rating: book.rating || 0,
      thumbnail: book.thumbnail || '',
      addedById: book.addedById || '',
    })
    setBookSearchQuery(book.title)
    setError('')
    setIsEditDialogOpen(true)
  }

  const handleUpdateBook = async () => {
    if (!formData.title.trim() || !formData.author.trim()) { setError('제목과 저자는 필수입니다.'); return }
    if (!formData.registeredDate) { setError('등록일을 선택해주세요.'); return }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          author: formData.author.trim(),
          registeredDate: formData.registeredDate,
          genres: formData.genres,
          notes: formData.notes.trim(),
          rating: formData.rating,
          thumbnail: formData.thumbnail || null,
          addedById: formData.addedById || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update book')
      }

      await fetchBook()
      setIsEditDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error updating book:', error)
      setError(error instanceof Error ? error.message : '책 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="text-center py-16">
            <div className="text-muted-foreground">책을 찾을 수 없습니다.</div>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/books')}>
              책 관리로
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/books')} className="mb-6 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          책 관리
        </Button>

        {/* 책 히어로 */}
        <div className="flex gap-6 mb-10">
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              className="h-40 w-28 rounded object-cover bg-muted flex-shrink-0"
            />
          ) : (
            <div className="h-40 w-28 rounded bg-muted flex-shrink-0 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-foreground font-[family-name:var(--font-heading)] leading-tight">
              {book.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{book.author}</p>

            {book.rating > 0 && (
              <div className="flex items-center gap-0.5 mt-3">
                {Array.from({ length: book.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                ))}
              </div>
            )}

            {book.genres.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {book.genres.join(' · ')}
              </p>
            )}

            <Button variant="outline" size="sm" className="mt-4" onClick={handleOpenEdit}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              수정
            </Button>
          </div>
        </div>

        {/* 등록 정보 */}
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">등록 정보</p>
          <div className="border rounded-lg divide-y">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-muted-foreground">등록일</span>
              <span className="text-sm text-foreground">
                {new Date(book.registeredDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-muted-foreground">등록자</span>
              <Link href={`/members/${book.addedById}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <span className="text-sm text-foreground">{book.addedBy}</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={book.addedByAvatarUrl || ''} alt={book.addedBy} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-[9px]">
                    {book.addedBy.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>

        {/* 메모 */}
        {book.notes && (
          <div>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mb-3">메모</p>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{book.notes}</p>
            </div>
          </div>
        )}

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setError('') }}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>책 정보 수정</DialogTitle>
              <DialogDescription>책의 정보를 수정해주세요.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">제목 *</Label>
                <div ref={searchContainerRef} className="col-span-3 relative">
                  <div className="relative">
                    <Input
                      id="edit-title"
                      value={bookSearchQuery}
                      onChange={(e) => handleBookSearchChange(e.target.value)}
                      onFocus={() => { if (bookSearchResults.length > 0) setShowSearchResults(true) }}
                      placeholder="책 제목을 입력하면 자동으로 검색됩니다"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showSearchResults && bookSearchResults.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {bookSearchResults.map((result, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full flex items-center gap-3 p-2 hover:bg-muted text-left"
                          onClick={() => handleSelectSearchResult(result)}
                        >
                          {result.thumbnail ? (
                            <img src={result.thumbnail} alt={result.title} className="h-12 w-9 rounded object-cover bg-muted flex-shrink-0" />
                          ) : (
                            <div className="h-12 w-9 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                              <BookOpen className="h-3 w-3 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground">{result.author}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-author" className="text-right">저자 *</Label>
                <Input id="edit-author" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="col-span-3" placeholder="저자를 입력하세요" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-registeredDate" className="text-right">등록일 *</Label>
                <Input id="edit-registeredDate" type="date" value={formData.registeredDate} onChange={(e) => setFormData({ ...formData, registeredDate: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">추가자</Label>
                <Select value={formData.addedById} onValueChange={(value) => setFormData({ ...formData, addedById: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="추가자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.nickname}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">장르</Label>
                <div className="col-span-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {genreOptions.map((genre) => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox id={`edit-genre-${genre}`} checked={formData.genres.includes(genre)} onCheckedChange={(checked) => handleGenreChange(genre, checked)} />
                        <Label htmlFor={`edit-genre-${genre}`} className="text-sm">{genre}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">별점</Label>
                <div className="col-span-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, rating: prev.rating === star ? 0 : star }))}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-5 w-5 ${star <= formData.rating ? 'fill-foreground text-foreground' : 'text-muted-foreground/30'}`}
                      />
                    </button>
                  ))}
                  {formData.rating > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">{formData.rating}점</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-notes" className="text-right pt-2">메모</Label>
                <Textarea id="edit-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="col-span-3" placeholder="책에 대한 메모를 작성해주세요" rows={3} />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" onClick={handleUpdateBook} disabled={submitting}>
                {submitting ? '수정 중...' : '수정 완료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
