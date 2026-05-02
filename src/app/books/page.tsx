'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { BookOpen, Plus, Search, Filter, User, Calendar, BookMarked, Edit, Trash2, Loader2, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  notes: string
  rating: number
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)

  // 책 검색 관련 상태
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
    addedByIds: [] as string[]
  })

  useEffect(() => {
    Promise.all([fetchBooks(), fetchMembers()])
  }, [])

  // 검색 결과 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/books')
      if (!response.ok) throw new Error('Failed to fetch books')
      const data = await response.json()
      setBooks(data)
      setError('')
    } catch (error) {
      console.error('Error fetching books:', error)
      setError('책 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (!response.ok) throw new Error('Failed to fetch members')
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  // 책 검색 (디바운스)
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
            addedById: addedById
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to add book')
        }
      }

      await fetchBooks()
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
          addedById: formData.addedByIds[0] || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update book')
      }

      await fetchBooks()
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
      await fetchBooks()
      setError('')
    } catch (error: unknown) {
      console.error('Error deleting book:', error)
      setError(error instanceof Error ? error.message : '책 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({ title: '', author: '', registeredDate: '', genres: [], notes: '', rating: 0, addedByIds: [] })
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const memberGenreStats = members.map(member => {
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

    return {
      member: member.nickname,
      totalBooks: uniqueBooks.size,
      genres: Object.entries(genreCount).map(([genre, count]) => ({ genre, count })).sort((a, b) => b.count - a.count)
    }
  }).filter(stat => stat.totalBooks > 0)

  // 책 검색 입력 + 드롭다운 (인라인 렌더링용)
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-foreground font-[family-name:var(--font-heading)] mb-1">책 관리</h1>
          <p className="text-sm text-muted-foreground">아고나락에서 읽은 책들을 관리하고 기록을 남기세요.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : (
        <>
        {/* 멤버별 장르 통계 */}
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3">멤버별 장르 통계</h2>
          {memberGenreStats.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookMarked className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">장르 통계가 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {members.length === 0
                    ? '먼저 멤버를 추가한 후 책을 등록해보세요.'
                    : '책을 추가하면 멤버별 장르 통계를 확인할 수 있습니다.'
                  }
                </p>
                {members.length === 0 && (
                  <p className="text-xs text-muted-foreground">멤버 관리 페이지에서 멤버를 먼저 등록해주세요.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberGenreStats.map((memberStat) => {
                const member = members.find(m => m.nickname === memberStat.member)
                return (
                  <Card
                    key={memberStat.member}
                    className="cursor-pointer hover:border-muted-foreground/30 transition-colors"
                    onClick={() => member && router.push(`/members/${member.id}/books`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={member?.avatarUrl || ''} alt={memberStat.member} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {memberStat.member.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        총 {memberStat.totalBooks}권 추가
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {memberStat.genres && memberStat.genres.length > 0 ? (
                          memberStat.genres.slice(0, 3).map((genreStat) => (
                            <div key={genreStat.genre} className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground truncate flex-1 mr-2">{genreStat.genre}</span>
                              <span className="text-xs text-muted-foreground">{genreStat.count}권</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">장르 정보 없음</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* 검색, 필터 및 추가 버튼 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="책 제목이나 저자 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-[200px]">
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

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} disabled={members.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
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

        {/* 책 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>책 목록</CardTitle>
            <CardDescription>현재 {filteredBooks.length}권의 책이 등록되어 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-sm font-medium text-foreground mb-2">
                  {searchTerm || selectedGenre !== 'all' ? '검색 결과가 없습니다' : '등록된 책이 없습니다'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || selectedGenre !== 'all'
                    ? '다른 검색어나 필터를 시도해보세요.'
                    : members.length === 0
                      ? '멤버를 먼저 등록한 후 책을 추가해보세요.'
                      : '새로운 책을 추가해보세요.'
                  }
                </p>
                {!searchTerm && selectedGenre === 'all' && members.length > 0 && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        첫 번째 책 추가
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>책 정보</TableHead>
                    <TableHead>장르</TableHead>
                    <TableHead>별점</TableHead>
                    <TableHead>추가자</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>노트</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-muted-foreground">{book.author}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {book.genres && book.genres.length > 0
                            ? book.genres.join(' · ')
                            : '장르 없음'}
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
                        <Avatar className="h-6 w-6" title={book.addedBy}>
                          <AvatarImage src={book.addedByAvatarUrl || ''} alt={book.addedBy} />
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                            {book.addedBy.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(book.registeredDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {book.notes ? (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">{book.notes}</div>
                        ) : (
                          <span className="text-sm text-muted-foreground">노트 없음</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditBook(book)}>
                            <Edit className="h-3 w-3 mr-1" />
                            수정
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteBook(book.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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
