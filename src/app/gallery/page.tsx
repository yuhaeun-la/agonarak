import React from 'react'
import { Navbar } from '@/components/layout/navbar'
import { PhotoGalleryContent } from '@/components/gallery/photo-gallery-content'
import { getAllMeetingsWithPhotos, getPastMeetings } from '@/lib/data/photos'

export const revalidate = 60 // 60초 캐싱

export default async function GalleryPage() {
  const [meetingsWithPhotos, allPastMeetings] = await Promise.all([
    getAllMeetingsWithPhotos(),
    getPastMeetings()
  ])

  // 모임 차수 계산 (첫 모임 = 1차, 시간순)
  const meetingsWithNumber = meetingsWithPhotos.map((meeting) => {
    const index = allPastMeetings.findIndex(m => m.id === meeting.id)
    return {
      ...meeting,
      meetingNumber: index + 1 // 첫 모임(index 0) = 1차
    }
  })

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />
      <PhotoGalleryContent
        meetingsWithNumber={meetingsWithNumber}
        allPastMeetings={allPastMeetings}
      />
    </div>
  )
}
