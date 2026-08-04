import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const getMeetings = unstable_cache(
  async () => {
    const meetings = await prisma.meeting.findMany({
      include: {
        books: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true
              }
            }
          }
        },
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return meetings.map(meeting => ({
      ...meeting,
      books: meeting.books.map((mb) => mb.book),
      attendances: meeting.attendances.map((att) => ({
        member: att.member,
        status: att.status
      }))
    }))
  },
  ['meetings-data'],
  {
    revalidate: 60,
    tags: ['meetings']
  }
)
