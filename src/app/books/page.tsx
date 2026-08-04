'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useBooks } from '@/hooks/useBooks'
import { useMembers } from '@/hooks/useMembers'
import { Skeleton } from '@/components/ui/skeleton'
import { bookQueries } from '@/lib/queries/books'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { BookOpen, Plus, Search, Filter, User, Edit, Trash2, Loader2, MoreHorizontal } from 'lucide-react'
import { StarRatingDisplay, StarRatingInput } from '@/components/ui/star-rating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  notes: string
  rating: number
  thumbnail: string | null
  registeredDate: string
  addedBy: string
  addedByAvatarUrl: string | null
  addedById: string
  createdAt: string
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

const genres = [
  'all',
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
  '기타 (만화, 에세이집 등)'
]

export default function Books() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // React Query로 데이터 가져오기 (자동 캐싱)
  const { data: books = [], isLoading: booksLoading, error: booksError, refetch: refetchBooks } = useBooks()
  const { data: members = [], isLoading: membersLoading } = useMembers()

  const loading = booksLoading || membersLoading
  const dataError = booksError ? '책 데이터를 불러오는데 실패했습니다.' : ''

  // 책 상세 프리페치 (호버 시)
  const prefetchBook = (bookId: string) => {
    queryClient.prefetchQuery(bookQueries.detail(bookId))
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [error, setError] = useState('')

  const [bookSearchQuery, setBookSearchQuery] = useState('')
  const [bookSearchResults, setBookSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    registeredDate: '',
    genres: [] as string[],
    notes: '',
    rating: 0,
    thumbnail: '',
    addedByIds: [] as string[]
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchBooks(value)
    }, 300)
  }

  const handleSelectSearchResult = (result: SearchResult) => {
    setFormData(prev => ({
      ...prev,
      title: result.title,
      author: result.author,
      thumbnail: result.thumbnail || '',
    }))
    setBookSearchQuery(result.title)
    setShowSearchResults(false)
    setBookSearchResults([])
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === 'all' ||
                        (book.genres && book.genres.includes(selectedGenre))
    return matchesSearch && matchesGenre
  })

  const handleAddBook = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      setError('제목과 저자는 필수입니다.')
      return
    }
    if (!formData.registeredDate) {
      setError('등록일을 선택해주세요.')
      return
    }
    if (formData.addedByIds.length === 0) {
      setError('추가자를 최소 한 명은 선택해주세요.')
      return
    }

    try {
      setSubmitting(true)

      for (const addedById of formData.addedByIds) {
        const response = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title.trim(),
            author: formData.author.trim(),
            registeredDate: formData.registeredDate,
            genres: formData.genres,
            notes: formData.notes.trim(),
            rating: formData.rating,
            thumbnail: formData.thumbnail || null,
            addedById: addedById
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add book')
        }
      }

      await refetchBooks()
      resetForm()
      setIsAddDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error adding book:', error)
      setError(error instanceof Error ? error.message : '책 추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      registeredDate: book.registeredDate.split('T')[0],
      genres: book.genres,
      notes: book.notes || '',
      rating: book.rating || 0,
      thumbnail: book.thumbnail || '',
      addedByIds: [book.addedById]
    })
    setBookSearchQuery(book.title)
    setIsEditDialogOpen(true)
  }

  const handleUpdateBook = async () => {
    if (!editingBook) return
    if (!formData.title.trim() || !formData.author.trim()) {
      setError('제목과 저자는 필수입니다.')
      return
    }
    if (!formData.registeredDate) {
      setError('등록일을 선택해주세요.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/books/${editingBook.id}`, {
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
          addedById: formData.addedByIds[0] || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update book')
      }

      await refetchBooks()
      resetForm()
      setEditingBook(null)
      setIsEditDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error updating book:', error)
      setError(error instanceof Error ? error.message : '책 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('정말로 이 책을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/books/${bookId}`, { method: 'DELETE' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete book')
      }
      await refetchBooks()
      setError('')
    } catch (error: unknown) {
      console.error('Error deleting book:', error)
      setError(error instanceof Error ? error.message : '책 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', author: '', registeredDate: '', genres: [], notes: '', rating: 0, thumbnail: '', addedByIds: [] })
    setBookSearchQuery('')
    setBookSearchResults([])
    setShowSearchResults(false)
    setError('')
  }

  const handleGenreChange = (genreName: string, checked: boolean | string | undefined) => {
    const isChecked = checked === true || checked === 'true'
    if (isChecked) {
      setFormData(prev => ({ ...prev, genres: [...prev.genres, genreName] }))
    } else {
      setFormData(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genreName) }))
    }
  }

  // 멤버별 통계
  const memberStats = members.map(member => {
    const memberBooks = books.filter(book => book.addedBy === member.nickname)
    const uniqueBooks = new Map()
    memberBooks.forEach(book => {
      const bookKey = `${book.title}-${book.author}`
      if (!uniqueBooks.has(bookKey)) uniqueBooks.set(bookKey, book)
    })

    const genreCount: { [key: string]: number } = {}
    Array.from(uniqueBooks.values()).forEach((book: Book) => {
      if (book.genres && book.genres.length > 0) {
        book.genres.forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        })
      }
    })

    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([genre]) => genre)

    return {
      memberId: member.id,
      nickname: member.nickname,
      avatarUrl: member.avatarUrl,
      totalBooks: uniqueBooks.size,
      topGenres,
    }
  }).filter(stat => stat.totalBooks > 0)

  // 책 검색 입력
  const renderBookSearchInput = (id: string) => (
    <div ref={searchContainerRef} className="col-span-3 relative">
      <div className="relative">
        <Input
          id={id}
          value={bookSearchQuery}
          onChange={(e) => handleBookSearchChange(e.target.value)}
          onFocus={() => {
            if (bookSearchResults.length > 0) setShowSearchResults(true)
          }}
          placeholder="책 제목을 입력하면 자동으로 검색됩니다"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSearchResults && bookSearchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-lg max-h-60 overflow-y-auto">
          {bookSearchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-accent border-b last:border-b-0 flex items-start gap-3"
              onClick={() => handleSelectSearchResult(result)}
            >
              {result.thumbnail && (
                <img
                  src={result.thumbnail}
                  alt=""
                  className="w-8 h-11 object-cover rounded-sm flex-shrink-0 mt-0.5"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                <p className="text-xs text-muted-foreground">{result.author}</p>
                {result.publisher && (
                  <p className="text-xs text-muted-foreground">{result.publisher}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-heading)]">책 관리</h1>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm} disabled={members.length === 0}>
                <Plus className="h-4 w-4 mr-1" />
                책 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 책 추가</DialogTitle>
                <DialogDescription>새로운 책의 정보를 입력해주세요. 제목을 입력하면 자동으로 검색됩니다.</DialogDescription>
              </DialogHeader>

              {members.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-sm font-medium text-foreground mb-2">멤버가 등록되지 않았습니다</h3>
                  <p className="text-sm text-muted-foreground">책을 추가하려면 먼저 멤버 관리에서 멤버를 등록해주세요.</p>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">제목 *</Label>
                    {renderBookSearchInput("title")}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="author" className="text-right">저자 *</Label>
                    <Input id="author" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} className="col-span-3" placeholder="저자를 입력하세요" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="registeredDate" className="text-right">등록일 *</Label>
                    <Input id="registeredDate" type="date" value={formData.registeredDate} onChange={(e) => setFormData({ ...formData, registeredDate: e.target.value })} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">추가자 *</Label>
                    <div className="col-span-3 space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">여러 명을 선택할 수 있습니다. (각각 별도의 책으로 등록됩니다)</p>
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={formData.addedByIds.includes(member.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({ ...prev, addedByIds: [...prev.addedByIds, member.id] }))
                              } else {
                                setFormData(prev => ({ ...prev, addedByIds: prev.addedByIds.filter(id => id !== member.id) }))
                              }
                            }}
                          />
                          <Label htmlFor={`member-${member.id}`} className="text-sm">{member.nickname}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">장르</Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {genres.slice(1).map((genre) => (
                        <div key={genre} className="flex items-center space-x-2">
                          <Checkbox id={genre} checked={formData.genres.includes(genre)} onCheckedChange={(checked) => handleGenreChange(genre, checked)} />
                          <Label htmlFor={genre} className="text-sm font-normal cursor-pointer">{genre}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">별점</Label>
                    <div className="col-span-3">
                      <StarRatingInput rating={formData.rating} onChange={(value) => setFormData(prev => ({ ...prev, rating: value }))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">독서 노트</Label>
                    <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="col-span-3" placeholder="책에 대한 메모나 감상을 적어보세요..." rows={3} />
                  </div>
                </div>
              )}

              <DialogFooter>
                {members.length > 0 && (
                  <Button type="submit" onClick={handleAddBook} disabled={submitting}>
                    {submitting ? '추가 중...' : '책 추가'}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <>
            {/* 검색 + 필터 스켈레톤 */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Skeleton className="h-10 flex-1 max-w-sm" />
              <Skeleton className="h-10 w-full sm:w-[180px]" />
            </div>

            {/* 책 카드 그리드 스켈레톤 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      <Skeleton className="h-24 w-16 rounded flex-shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-4 w-20 mt-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 멤버별 독서 현황 */}
            {memberStats.length > 0 && (
              <div className="mb-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {memberStats.map((stat) => (
                    <Card
                      key={stat.memberId}
                      className="cursor-pointer hover:border-muted-foreground/30 transition-colors"
                      onClick={() => router.push(`/members/${stat.memberId}/books`)}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <Avatar className="h-12 w-12 mb-2">
                          <AvatarImage src={stat.avatarUrl || ''} alt={stat.nickname} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                            {stat.nickname.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium text-foreground">{stat.nickname}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.topGenres.length > 0
                            ? stat.topGenres.join(' · ')
                            : '장르 없음'
                          }
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{stat.totalBooks}권</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 검색 + 필터 */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="책 제목이나 저자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="장르 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 장르</SelectItem>
                  {genres.slice(1).map((genre) => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 책 카드 그리드 */}
            {filteredBooks.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {searchTerm || selectedGenre !== 'all' ? '검색 결과가 없습니다' : '등록된 책이 없습니다'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || selectedGenre !== 'all'
                    ? '다른 검색어나 필터를 시도해보세요.'
                    : members.length === 0
                      ? '멤버를 먼저 등록한 후 책을 추가해보세요.'
                      : '새로운 책을 추가해보세요.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBooks.map((book) => (
                  <Card
                    key={book.id}
                    className="overflow-hidden cursor-pointer hover:border-muted-foreground/30 transition-colors group"
                    onClick={() => router.push(`/books/${book.id}`)}
                    onMouseEnter={() => prefetchBook(book.id)}
                  >
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
                          <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{book.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>

                          {book.rating > 0 && (
                            <div className="mt-2">
                              <StarRatingDisplay rating={book.rating} />
                            </div>
                          )}

                          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground truncate flex-1">
                              {book.genres.slice(0, 2).join(' · ')}
                              {book.genres.length > 2 && ` +${book.genres.length - 2}`}
                            </p>
                            <Avatar className="h-5 w-5 flex-shrink-0" title={book.addedBy}>
                              <AvatarImage src={book.addedByAvatarUrl || ''} alt={book.addedBy} />
                              <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                                {book.addedBy.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>
                      {book.notes && (
                        <div className="px-4 pb-3 pt-0">
                          <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2">{book.notes}</p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-background/80 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditBook(book) }}>
                              <Edit className="h-3.5 w-3.5 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id) }} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm() }}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>책 정보 수정</DialogTitle>
              <DialogDescription>책의 정보를 수정해주세요.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">제목 *</Label>
                {renderBookSearchInput("edit-title")}
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
                <Select value={formData.addedByIds[0] || ''} onValueChange={(value) => setFormData({ ...formData, addedByIds: [value] })}>
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
                    {genres.slice(1).map((genre) => (
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
                <div className="col-span-3">
                  <StarRatingInput rating={formData.rating} onChange={(value) => setFormData(prev => ({ ...prev, rating: value }))} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-notes" className="text-right pt-2">메모</Label>
                <Textarea id="edit-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="col-span-3" placeholder="책에 대한 메모를 작성해주세요" rows={3} />
              </div>
            </div>

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
