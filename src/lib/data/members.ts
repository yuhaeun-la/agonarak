import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const getMembers = unstable_cache(
  async () => {
    const now = new Date()

    const pastMeetingsCount = await prisma.meeting.count({
      where: {
        date: {
          lt: now
        }
      }
    })

    const members = await prisma.member.findMany({
      include: {
        attendances: {
          include: {
            meeting: {
              select: {
                date: true
              }
            }
          }
        }
      },
      orderBy: {
        nickname: 'asc'
      }
    })

    return members.map(member => {
      const attendedMeetings = member.attendances.filter(
        attendance => attendance.status === 'ATTENDING' &&
        new Date(attendance.meeting.date) < now
      ).length

      const attendanceRate = pastMeetingsCount > 0 ? (attendedMeetings / pastMeetingsCount) * 100 : 0

      return {
        ...member,
        attendanceStats: {
          totalMeetings: pastMeetingsCount,
          attendedMeetings,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        },
        attendances: undefined
      }
    })
  },
  ['members-data'],
  {
    revalidate: 60,
    tags: ['members']
  }
)
