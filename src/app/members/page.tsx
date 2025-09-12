'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Phone, Users, UserPlus, Search, Edit, Trash2 } from 'lucide-react'

interface Member {
  id: string
  nickname: string
  role: 'LEADER' | 'MEMBER'
  contact: string
  attendanceStats?: {
    totalMeetings: number
    attendedMeetings: number
    attendanceRate: number
  }
}

export default function Members() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // 폼 상태
  const [formData, setFormData] = useState({
    nickname: '',
    role: 'MEMBER' as 'LEADER' | 'MEMBER',
    contact: ''
  })

  // 멤버 데이터 로드
  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/members')
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      setMembers(data)
      setError('')
    } catch (error) {
      console.error('Error fetching members:', error)
      setError('멤버 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMember = async () => {
    // 폼 검증
    if (!formData.nickname.trim()) {
      setError('닉네임은 필수입니다.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
          role: formData.role,
          contact: formData.contact.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member')
      }

      // 멤버 목록 새로고침
      await fetchMembers()
      
      // 폼 초기화
      setFormData({
        nickname: '',
        role: 'MEMBER',
        contact: ''
      })

      // 다이얼로그 닫기
      setIsAddDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error adding member:', error)
      setError(error instanceof Error ? error.message : '멤버 추가에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setFormData({
      nickname: member.nickname,
      role: member.role,
      contact: member.contact || ''
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return

    // 폼 검증
    if (!formData.nickname.trim()) {
      setError('닉네임은 필수입니다.')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
          role: formData.role,
          contact: formData.contact.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update member')
      }

      // 멤버 목록 새로고침
      await fetchMembers()
      
      // 상태 초기화
      setFormData({
        nickname: '',
        role: 'MEMBER',
        contact: ''
      })
      setEditingMember(null)
      setIsEditDialogOpen(false)
      setError('')
    } catch (error: unknown) {
      console.error('Error updating member:', error)
      setError(error instanceof Error ? error.message : '멤버 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('정말로 이 멤버를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete member')
      }

      // 멤버 목록 새로고침
      await fetchMembers()
      setError('')
    } catch (error: unknown) {
      console.error('Error deleting member:', error)
      setError(error instanceof Error ? error.message : '멤버 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({
      nickname: '',
      role: 'MEMBER',
      contact: ''
    })
    setError('')
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">멤버 관리</h1>
          <p className="text-gray-600">아고나락 멤버들을 관리하고 정보를 확인하세요.</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 멤버</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">
                활성 멤버 수
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">리더</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'LEADER').length}
              </div>
              <p className="text-xs text-muted-foreground">
                리더 역할 멤버
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">일반 멤버</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {members.filter(m => m.role === 'MEMBER').length}
              </div>
              <p className="text-xs text-muted-foreground">
                일반 멤버
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 추가 버튼 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="멤버 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <UserPlus className="h-4 w-4 mr-2" />
                멤버 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>새 멤버 추가</DialogTitle>
                <DialogDescription>
                  새로운 멤버의 정보를 입력해주세요.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nickname" className="text-right">
                    닉네임
                  </Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="col-span-3"
                    placeholder="닉네임을 입력하세요"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    역할
                  </Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: 'LEADER' | 'MEMBER') => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="역할을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">일반 멤버</SelectItem>
                      <SelectItem value="LEADER">리더</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contact" className="text-right">
                    연락처
                  </Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="col-span-3"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleAddMember}
                  disabled={submitting}
                >
                  {submitting ? '추가 중...' : '멤버 추가'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 멤버 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>멤버 목록</CardTitle>
            <CardDescription>
              현재 {filteredMembers.length}명의 멤버가 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">멤버 데이터를 불러오는 중...</div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '등록된 멤버가 없습니다'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? '다른 검색어로 시도해보세요.' : '새로운 멤버를 추가해보세요.'}
                </p>
                {!searchTerm && (
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        첫 번째 멤버 추가
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>멤버</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>참석률</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt={member.nickname} />
                            <AvatarFallback>
                              {member.nickname.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.nickname}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.role === 'LEADER' ? 'default' : 'secondary'}>
                          {member.role === 'LEADER' ? '리더' : '멤버'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          {member.contact || '연락처 없음'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {member.attendanceStats ? (
                            <div>
                              <div className="font-medium">
                                {member.attendanceStats.attendanceRate.toFixed(1)}%
                              </div>
                              <div className="text-gray-500 text-xs">
                                {member.attendanceStats.attendedMeetings}/{member.attendanceStats.totalMeetings}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">데이터 없음</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            수정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
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

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>멤버 정보 수정</DialogTitle>
              <DialogDescription>
                멤버의 정보를 수정해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
    
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-nickname" className="text-right">
                  닉네임
                </Label>
                <Input
                  id="edit-nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="col-span-3"
                  placeholder="닉네임을 입력하세요"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  역할
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: 'LEADER' | 'MEMBER') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">일반 멤버</SelectItem>
                    <SelectItem value="LEADER">리더</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contact" className="text-right">
                  연락처
                </Label>
                <Input
                  id="edit-contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="col-span-3"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleUpdateMember}
                disabled={submitting}
              >
                {submitting ? '수정 중...' : '수정 완료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}