import React from 'react'
import { Navbar } from '@/components/layout/navbar'
import { PasswordProtectedGallery } from '@/components/gallery/password-protected-gallery'
import { getAllMeetingsWithPhotos, getPastMeetings } from '@/lib/data/photos'

export const revalidate = 60 // 60초 캐싱

export default async function GalleryPage() {
  const [meetingsWithPhotos, allPastMeetings] = await Promise.all([
    getAllMeetingsWithPhotos(),
    getPastMeetings()
  ])

  // 모임 차수 계산 (2025년 5월 24일 = 36차부터 시작)
  const meetingsWithNumber = meetingsWithPhotos.map((meeting) => {
    const index = allPastMeetings.findIndex(m => m.id === meeting.id)
    return {
      ...meeting,
      meetingNumber: index + 36 // 첫 등록 모임 = 36차
    }
  })

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />
      <PasswordProtectedGallery
        meetingsWithNumber={meetingsWithNumber}
        allPastMeetings={allPastMeetings}
      />
    </div>
  )
}
