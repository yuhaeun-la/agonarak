'use client'

import React, { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, UserPlus, Search, Edit, Trash2, X, MoreHorizontal } from 'lucide-react'
import { resizeImage } from '@/lib/resizeImage'
import { useRouter } from 'next/navigation'

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

export default function Members() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nickname: '',
    role: 'MEMBER' as 'LEADER' | 'MEMBER',
    contact: '',
    avatarUrl: null as string | null
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/members')
      if (!response.ok) throw new Error('Failed to fetch members')
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    try {
      const dataUrl = await resizeImage(file, 100, 0.7)
      setAvatarPreview(dataUrl)
      setFormData(prev => ({ ...prev, avatarUrl: dataUrl }))
    } catch {
      setError('이미지 처리에 실패했습니다.')
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setFormData(prev => ({ ...prev, avatarUrl: null }))
  }

  const handleAddMember = async () => {
    if (!formData.nickname.trim()) { setError('닉네임은 필수입니다.'); return }

    try {
      setSubmitting(true)
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
          role: formData.role,
          contact: formData.contact.trim(),
          avatarUrl: formData.avatarUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member')
      }

      await fetchMembers()
      resetForm()
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
    setFormData({ nickname: member.nickname, role: member.role, contact: member.contact || '', avatarUrl: member.avatarUrl })
    setAvatarPreview(member.avatarUrl)
    setIsEditDialogOpen(true)
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return
    if (!formData.nickname.trim()) { setError('닉네임은 필수입니다.'); return }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
          role: formData.role,
          contact: formData.contact.trim(),
          avatarUrl: formData.avatarUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update member')
      }

      await fetchMembers()
      resetForm()
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
      const response = await fetch(`/api/members/${memberId}`, { method: 'DELETE' })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete member')
      }
      await fetchMembers()
      setError('')
    } catch (error: unknown) {
      console.error('Error deleting member:', error)
      setError(error instanceof Error ? error.message : '멤버 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({ nickname: '', role: 'MEMBER', contact: '', avatarUrl: null })
    setAvatarPreview(null)
    setError('')
  }

  // 다이얼로그 폼
  const renderFormFields = (prefix: string) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-nickname`} className="text-right">닉네임</Label>
        <Input id={`${prefix}-nickname`} value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} className="col-span-3" placeholder="닉네임을 입력하세요" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">프로필 사진</Label>
        <div className="col-span-3 flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarPreview || ''} alt="미리보기" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {formData.nickname ? formData.nickname.charAt(0) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center gap-2">
            <Input type="file" accept="image/*" onChange={handleAvatarChange} className="flex-1 text-sm" />
            {avatarPreview && (
              <Button type="button" variant="outline" size="icon" onClick={handleRemoveAvatar} className="h-8 w-8 shrink-0">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={`${prefix}-role`} className="text-right">역할</Label>
        <Select value={formData.role} onValueChange={(value: 'LEADER' | 'MEMBER') => setFormData({ ...formData, role: value })}>
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
        <Label htmlFor={`${prefix}-contact`} className="text-right">연락처</Label>
        <Input id={`${prefix}-contact`} value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className="col-span-3" placeholder="010-1234-5678" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-heading)]">멤버 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">{members.length}명의 멤버</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <UserPlus className="h-4 w-4 mr-1" />
                멤버 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>새 멤버 추가</DialogTitle>
                <DialogDescription>새로운 멤버의 정보를 입력해주세요.</DialogDescription>
              </DialogHeader>
              {renderFormFields('add')}
              <DialogFooter>
                <Button type="submit" onClick={handleAddMember} disabled={submitting}>
                  {submitting ? '추가 중...' : '멤버 추가'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 검색 */}
        {members.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="멤버 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* 멤버 카드 그리드 */}
        {loading ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground">멤버 데이터를 불러오는 중...</div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '등록된 멤버가 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? '다른 검색어로 시도해보세요.' : '새로운 멤버를 추가해보세요.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="cursor-pointer hover:border-muted-foreground/30 transition-colors"
                onClick={() => router.push(`/members/${member.id}`)}
              >
                <CardContent className="p-5 relative">
                  {/* 더보기 메뉴 */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditMember(member) }}>
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id) }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* 프로필 */}
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-14 w-14 mb-3">
                      <AvatarImage src={member.avatarUrl || ''} alt={member.nickname} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                        {member.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-sm font-medium text-foreground">{member.nickname}</p>
                      {member.role === 'LEADER' && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">리더</Badge>
                      )}
                    </div>

                    {member.attendanceStats && member.attendanceStats.totalMeetings > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          참석률 {member.attendanceStats.attendanceRate.toFixed(0)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {member.attendanceStats.attendedMeetings}/{member.attendanceStats.totalMeetings}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>멤버 정보 수정</DialogTitle>
              <DialogDescription>멤버의 정보를 수정해주세요.</DialogDescription>
            </DialogHeader>
            {renderFormFields('edit')}
            <DialogFooter>
              <Button type="submit" onClick={handleUpdateMember} disabled={submitting}>
                {submitting ? '수정 중...' : '수정 완료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
