'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { BookOpen, Plus, Search, Filter, Star, User, Calendar, BookMarked } from 'lucide-react'

interface Book {
  id: string
  title: string
  author: string
  genres: string[]
  notes: string
  registeredDate: string
  addedBy: string
  createdAt: string
}

interface Member {
  id: string
  nickname: string
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    registeredDate: '',
    genres: [] as string[],
    notes: '',
    addedById: ''
  })

  // 데이터 로드
  useEffect(() => {
    Promise.all([fetchBooks(), fetchMembers()])
  }, [])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/books')
      if (!response.ok) {
        throw new Error('Failed to fetch books')
      }
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
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = selectedGenre === 'all' || 
                        (book.genres && book.genres.includes(selectedGenre))
    return matchesSearch && matchesGenre
  })

  const handleAddBook = async () => {
    // 폼 검증
    if (!formData.title.trim() || !formData.author.trim()) {
      setError('제목과 저자는 필수입니다.')
      return
    }

    if (!formData.registeredDate) {
      setError('등록일을 선택해주세요.')
      return
    }

    if (!formData.addedById) {
      setError('추가자를 선택해주세요.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          author: formData.author.trim(),
          registeredDate: formData.registeredDate,
          genres: formData.genres,
          notes: formData.notes.trim(),
          addedById: formData.addedById
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add book')
      }

      // 책 목록 새로고침
      await fetchBooks()
      
      // 폼 초기화
      setFormData({
        title: '',
        author: '',
        registeredDate: '',
        genres: [],
        notes: '',
        addedById: ''
      })

      // 다이얼로그 닫기
      setIsAddDialogOpen(false)
      setError('')
    } catch (error: any) {
      console.error('Error adding book:', error)
      setError(error.message || '책 추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenreChange = (genreName: string, checked: boolean | string | undefined) => {
    const isChecked = checked === true || checked === 'true'
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, genreName]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        genres: prev.genres.filter(g => g !== genreName)
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      registeredDate: '',
      genres: [],
      notes: '',
      addedById: ''
    })
    setError('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 멤버별 장르 통계 계산
  const memberGenreStats = members.map(member => {
    const memberBooks = books.filter(book => book.addedBy === member.nickname)
    const genreCount: { [key: string]: number } = {}
    
    memberBooks.forEach(book => {
      if (book.genres && book.genres.length > 0) {
        book.genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        })
      }
    })

    return {
      member: member.nickname,
      totalBooks: memberBooks.length,
      genres: Object.entries(genreCount).map(([genre, count]) => ({
        genre,
        count
      })).sort((a, b) => b.count - a.count)
    }
  }).filter(stat => stat.totalBooks > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">책 관리</h1>
          <p className="text-gray-600">북클럽에서 읽은 책들을 관리하고 기록을 남기세요.</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 멤버별 장르 통계 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">멤버별 장르 통계</h2>
          {memberGenreStats.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookMarked className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  장르 통계가 없습니다
                </h3>
                <p className="text-gray-500 mb-4">
                  {members.length === 0 
                    ? '먼저 멤버를 추가한 후 책을 등록해보세요.' 
                    : '책을 추가하면 멤버별 장르 통계를 확인할 수 있습니다.'
                  }
                </p>
                {members.length === 0 && (
                  <p className="text-sm text-gray-400">
                    멤버 관리 페이지에서 멤버를 먼저 등록해주세요.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {memberGenreStats.map((memberStat) => (
                <Card key={memberStat.member}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      {memberStat.member}
                    </CardTitle>
                    <CardDescription>
                      총 {memberStat.totalBooks}권 추가
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {memberStat.genres && memberStat.genres.length > 0 ? (
                        memberStat.genres.slice(0, 3).map((genreStat) => (
                          <div key={genreStat.genre} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                              {genreStat.genre}
                            </span>
                            <Badge variant="outline">
                              {genreStat.count}권
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">장르 정보 없음</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 검색, 필터 및 추가 버튼 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="책 제목이나 저자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="장르 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 장르</SelectItem>
                {genres.slice(1).map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetForm}
                disabled={members.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                책 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 책 추가</DialogTitle>
                <DialogDescription>
                  새로운 책의 정보를 입력해주세요.
                </DialogDescription>
              </DialogHeader>
              
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    멤버가 등록되지 않았습니다
                  </h3>
                  <p className="text-gray-500">
                    책을 추가하려면 먼저 멤버 관리에서 멤버를 등록해주세요.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      제목 *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="col-span-3"
                      placeholder="책 제목을 입력하세요"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="author" className="text-right">
                      저자 *
                    </Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="col-span-3"
                      placeholder="저자를 입력하세요"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="registeredDate" className="text-right">
                      등록일 *
                    </Label>
                    <Input
                      id="registeredDate"
                      type="date"
                      value={formData.registeredDate}
                      onChange={(e) => setFormData({ ...formData, registeredDate: e.target.value })}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="addedBy" className="text-right pt-2">
                      추가자 *
                    </Label>
                    <Select 
                      value={formData.addedById} 
                      onValueChange={(value) => setFormData({ ...formData, addedById: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="추가자를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.nickname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">
                      장르
                    </Label>
                    <div className="col-span-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {genres.slice(1).map((genre) => (
                        <div key={genre} className="flex items-center space-x-2">
                          <Checkbox
                            id={genre}
                            checked={formData.genres.includes(genre)}
                            onCheckedChange={(checked) => handleGenreChange(genre, checked)}
                          />
                          <Label
                            htmlFor={genre}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {genre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="notes" className="text-right pt-2">
                      독서 노트
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="col-span-3"
                      placeholder="책에 대한 메모나 감상을 적어보세요..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
              
              <DialogFooter>
                {members.length > 0 && (
                  <Button 
                    type="submit" 
                    onClick={handleAddBook}
                    disabled={submitting}
                  >
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
            <CardDescription>
              현재 {filteredBooks.length}권의 책이 등록되어 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">책 데이터를 불러오는 중...</div>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedGenre !== 'all' 
                    ? '검색 결과가 없습니다' 
                    : '등록된 책이 없습니다'
                  }
                </h3>
                <p className="text-gray-500 mb-4">
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
                    <TableHead>추가자</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead>노트</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-gray-500">{book.author}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {book.genres && book.genres.length > 0 ? (
                            book.genres.map((genre) => (
                              <Badge key={genre} variant="outline" className="text-xs">
                                {genre}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">장르 없음</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-3 w-3 mr-1" />
                          {book.addedBy}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(book.registeredDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {book.notes ? (
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {book.notes}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">노트 없음</span>
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