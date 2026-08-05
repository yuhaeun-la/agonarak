'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MeetingEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meetingId?: string
}

export function MeetingEditDialog({ open, onOpenChange, meetingId }: MeetingEditDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    title: ''
  })

  useEffect(() => {
    if (open && meetingId) {
      loadMeetingData()
    }
  }, [open, meetingId])

  const loadMeetingData = async () => {
    if (!meetingId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/meetings/${meetingId}`)
      if (response.ok) {
        const meeting = await response.json()
        const meetingDate = new Date(meeting.date)
        const dateStr = meetingDate.toISOString().split('T')[0]
        const timeStr = meetingDate.toTimeString().slice(0, 5)

        setFormData({
          date: dateStr,
          time: timeStr,
          location: meeting.location || '',
          title: meeting.title || '모임'
        })
      }
    } catch (error) {
      console.error('Failed to load meeting:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingId) return

    if (!formData.date || !formData.time) {
      setError('날짜와 시간을 입력해주세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          time: formData.time,
          location: formData.location,
          title: formData.title
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '수정에 실패했습니다.')
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error('Update error:', err)
      const errorMessage = err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>모임 정보 수정</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="모임 제목"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">시간</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="모임 장소"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                수정
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
