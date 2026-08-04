'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X, Loader2 } from 'lucide-react'
import { addMeetingPhoto } from '@/lib/actions/photos'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Meeting {
  id: string
  date: Date | string
  location?: string | null
}

interface PhotoUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meetings: Meeting[]
  preselectedMeetingId?: string
}

export function PhotoUploadDialog({
  open,
  onOpenChange,
  meetings,
  preselectedMeetingId
}: PhotoUploadDialogProps) {
  const router = useRouter()
  const [selectedMeetingId, setSelectedMeetingId] = useState(preselectedMeetingId || '')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Sort meetings by date (most recent first)
  const sortedMeetings = [...meetings].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    if (files.length + selectedFiles.length > 5) {
      setError('최대 5장까지 업로드 가능합니다.')
      return
    }

    setError('')
    setUploadSuccess(false)
    setFiles(prev => [...prev, ...selectedFiles])

    // Create previews
    selectedFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!selectedMeetingId) {
      setError('모임을 선택해주세요.')
      return
    }

    if (files.length === 0) {
      setError('사진을 선택해주세요.')
      return
    }

    setUploading(true)
    setError('')

    try {
      for (const file of files) {
        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)

        console.log('Uploading file:', file.name, file.size, 'bytes')

        const uploadRes = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        })

        console.log('Upload response status:', uploadRes.status)

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json()
          console.error('Upload failed:', errorData)
          throw new Error(errorData.error || '업로드 실패')
        }

        const { imageUrl, publicId } = await uploadRes.json()
        console.log('Upload successful:', imageUrl)

        // Save to database
        console.log('Saving to database...')
        const result = await addMeetingPhoto({
          meetingId: selectedMeetingId,
          imageUrl,
          publicId,
        })

        console.log('Database save result:', result)

        if (result.error) {
          setError(result.error)
          break
        }
      }

      // Show success state
      setUploadSuccess(true)

      // Wait a moment to show success message, then close and refresh
      setTimeout(() => {
        setFiles([])
        setPreviews([])
        setSelectedMeetingId('')
        setUploadSuccess(false)
        onOpenChange(false)
        router.refresh()
      }, 1000)
    } catch (err) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>앨범 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meeting Selection */}
          <div className="space-y-2">
            <Label>모임 선택</Label>
            <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
              <SelectTrigger>
                <SelectValue placeholder="모임을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {sortedMeetings.map((meeting) => {
                  const meetingDate = new Date(meeting.date)
                  const dateStr = `${meetingDate.getFullYear()}년 ${meetingDate.getMonth() + 1}월 ${meetingDate.getDate()}일`
                  return (
                    <SelectItem key={meeting.id} value={meeting.id}>
                      {dateStr} - {meeting.location || '장소 미정'}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>사진 선택 (최대 5장)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="photo-upload"
                disabled={files.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo-upload')?.click()}
                disabled={files.length >= 5}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                사진 선택 ({files.length}/5)
              </Button>
            </div>
          </div>

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover rounded"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">✓ 업로드 완료!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading || uploadSuccess}
          >
            취소
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || uploadSuccess || files.length === 0 || !selectedMeetingId}
          >
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploadSuccess ? '완료' : '업로드'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
