'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function addMeetingPhoto(data: {
  meetingId: string
  imageUrl: string
  publicId: string
  caption?: string
  uploadedBy?: string
}) {
  try {
    // Get current photo count for this meeting
    const photoCount = await prisma.meetingPhoto.count({
      where: { meetingId: data.meetingId }
    })

    // Limit to 5 photos per meeting
    if (photoCount >= 5) {
      return { error: '모임당 최대 5장의 사진만 업로드할 수 있습니다.' }
    }

    const photo = await prisma.meetingPhoto.create({
      data: {
        meetingId: data.meetingId,
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        caption: data.caption,
        uploadedBy: data.uploadedBy,
        order: photoCount
      }
    })

    revalidatePath('/gallery')
    revalidateTag('photos')
    revalidateTag('meetings')
    return { success: true, photo }
  } catch (error) {
    console.error('Failed to add photo:', error)
    return { error: '사진 추가에 실패했습니다.' }
  }
}

export async function deleteMeetingPhoto(photoId: string) {
  try {
    await prisma.meetingPhoto.delete({
      where: { id: photoId }
    })

    revalidatePath('/gallery')
    revalidateTag('photos')
    revalidateTag('meetings')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete photo:', error)
    return { error: '사진 삭제에 실패했습니다.' }
  }
}

// Moved to /lib/data/photos.ts for caching
