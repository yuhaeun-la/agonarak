'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ImageIcon, Trash2, Loader2 } from 'lucide-react'
import { PhotoUploadDialog } from '@/components/gallery/photo-upload-dialog'
import { deleteMeetingPhoto } from '@/lib/actions/photos'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Meeting {
  id: string
  date: Date | string
  location: string | null
  title: string
  photos: Array<{
    id: string
    imageUrl: string
    caption: string | null
  }>
  meetingNumber?: number
}

interface PhotoGalleryContentProps {
  meetingsWithNumber: Meeting[]
  allPastMeetings: Array<{ id: string; date: Date | string; location: string | null }>
}

export function PhotoGalleryContent({
  meetingsWithNumber,
  allPastMeetings
}: PhotoGalleryContentProps) {
  const router = useRouter()
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>()
  const [isAddingToExisting, setIsAddingToExisting] = useState(false)
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleUploadClick = (meetingId?: string) => {
    setSelectedMeetingId(meetingId)
    // meetingId가 있고 meetingsWithNumber에 있으면 기존 앨범에 추가
    const hasPhotos = meetingId ? meetingsWithNumber.some(m => m.id === meetingId) : false
    setIsAddingToExisting(hasPhotos)
    setUploadDialogOpen(true)
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('사진을 삭제하시겠습니까?')) return

    setDeletingPhotoId(photoId)
    setDeleteMessage(null)

    try {
      const result = await deleteMeetingPhoto(photoId)
      if (result.success) {
        setDeleteMessage({ type: 'success', text: '사진이 삭제되었습니다' })
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setDeleteMessage({ type: 'error', text: result.error || '삭제에 실패했습니다' })
        setDeletingPhotoId(null)
      }
    } catch (error) {
      setDeleteMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다' })
      setDeletingPhotoId(null)
    }
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground font-[family-name:var(--font-heading)]">
            갤러리
          </h1>
          <Button onClick={() => handleUploadClick()}>
            <Plus className="h-4 w-4 mr-2" />
            앨범 추가
          </Button>
        </div>

        {/* 삭제 메시지 */}
        {deleteMessage && (
          <div className={`mb-6 p-3 rounded-md ${
            deleteMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm font-medium">
              {deleteMessage.type === 'success' ? '✓' : '✗'} {deleteMessage.text}
            </p>
          </div>
        )}

        {/* 모임 앨범 그리드 */}
        {meetingsWithNumber.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-2">
              아직 사진이 없습니다
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {allPastMeetings.length === 0
                ? '모임 일정을 먼저 등록해주세요.'
                : '첫 모임 사진을 업로드해보세요.'}
            </p>
            {allPastMeetings.length === 0 ? (
              <Button variant="outline" asChild>
                <Link href="/meetings">모임 일정으로</Link>
              </Button>
            ) : (
              <Button onClick={() => handleUploadClick()}>
                <Plus className="h-4 w-4 mr-2" />
                앨범 추가
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {meetingsWithNumber.map((meeting) => {
              const meetingDate = new Date(meeting.date)
              const dateStr = `${meetingDate.getMonth() + 1}월 ${meetingDate.getDate()}일`
              const canAddMore = meeting.photos.length < 5

              return (
                <Card key={meeting.id} className="overflow-hidden hover:border-muted-foreground/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-medium text-foreground">
                          {dateStr} 아고나락 모임 {meeting.meetingNumber}차
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {meeting.location || '장소 미정'}
                        </p>
                      </div>
                      {canAddMore && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUploadClick(meeting.id)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          사진 추가
                        </Button>
                      )}
                    </div>

                    {/* 사진 썸네일 영역 */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {meeting.photos.map((photo) => (
                        <div key={photo.id} className="relative flex-shrink-0 w-24 h-24 group">
                          <Image
                            src={photo.imageUrl}
                            alt={photo.caption || '모임 사진'}
                            fill
                            className="object-cover rounded"
                          />
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={deletingPhotoId === photo.id}
                            className="absolute top-1 right-1 bg-destructive/80 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          >
                            {deletingPhotoId === photo.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      ))}
                      {canAddMore && (
                        <button
                          onClick={() => handleUploadClick(meeting.id)}
                          className="flex-shrink-0 w-24 h-24 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-muted-foreground/50 transition-colors"
                        >
                          <Plus className="h-6 w-6 text-muted-foreground/30" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <PhotoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        meetings={allPastMeetings}
        preselectedMeetingId={selectedMeetingId}
        isAddingToExistingAlbum={isAddingToExisting}
      />
    </>
  )
}
