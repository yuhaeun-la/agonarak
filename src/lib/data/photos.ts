import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const getMeetingPhotos = (meetingId: string) =>
  unstable_cache(
    async () => {
      const photos = await prisma.meetingPhoto.findMany({
        where: { meetingId },
        orderBy: { order: 'asc' }
      })
      return photos
    },
    [`meeting-photos-${meetingId}`],
    {
      revalidate: 60,
      tags: ['photos', `meeting-photos-${meetingId}`]
    }
  )()

export const getAllMeetingsWithPhotos = unstable_cache(
  async () => {
    const meetings = await prisma.meeting.findMany({
      where: {
        date: { lte: new Date() }
      },
      include: {
        photos: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Filter only meetings that have photos
    return meetings.filter(m => m.photos.length > 0)
  },
  ['meetings-with-photos'],
  {
    revalidate: 60,
    tags: ['photos', 'meetings']
  }
)

export const getPastMeetings = unstable_cache(
  async () => {
    const meetings = await prisma.meeting.findMany({
      where: {
        date: { lte: new Date() }
      },
      orderBy: { date: 'asc' } // 오래된 순 정렬 (1차, 2차, 3차...)
    })
    return meetings
  },
  ['past-meetings'],
  {
    revalidate: 60,
    tags: ['meetings']
  }
)
