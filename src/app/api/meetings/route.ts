import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - 모든 모임 조회
export async function GET() {
  try {
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
                nickname: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // 데이터 구조 변환
    const transformedMeetings = meetings.map(meeting => ({
      ...meeting,
      books: meeting.books.map((mb: any) => mb.book),
      attendances: meeting.attendances.map((att: any) => ({
        member: att.member,
        status: att.status
      }))
    }))
    
    return NextResponse.json(transformedMeetings)
  } catch (error: any) {
    console.error('Failed to fetch meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

// POST - 새 모임 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, time, location, memo, title, attendees } = body

    // 입력 검증
    if (!date || !time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      )
    }

    // 기본 클럽 ID 가져오기
    let club = await prisma.club.findFirst()
    if (!club) {
      club = await prisma.club.create({
        data: {
          name: '우리 북클럽',
          description: '기본 북클럽'
        }
      })
    }

    // 날짜와 시간을 합쳐서 DateTime으로 변환
    const meetingDateTime = new Date(`${date}T${time}:00`)

    // 트랜잭션으로 모임과 참석 정보를 함께 생성
    const result = await prisma.$transaction(async (tx) => {
      // 모임 생성
      const meeting = await tx.meeting.create({
        data: {
          title: title || `${new Date(date).toLocaleDateString('ko-KR')} 모임`,
          date: meetingDateTime,
          location: location || '',
          memo: memo || '',
          clubId: club.id
        }
      })

      // 참석자 정보 생성
      if (attendees && attendees.length > 0) {
        const attendanceData = attendees.map((memberId: string) => ({
          meetingId: meeting.id,
          memberId: memberId,
          status: 'ATTENDING' as const
        }))

        await tx.attendance.createMany({
          data: attendanceData
        })
      }

      return meeting
    })

    // 생성된 모임을 관계 데이터와 함께 다시 조회
    const meeting = await prisma.meeting.findUnique({
      where: { id: result.id },
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
                nickname: true
              }
            }
          }
        }
      }
    })

    // 데이터 구조 변환
    const transformedMeeting = {
      ...meeting,
      books: meeting?.books.map((mb: any) => mb.book),
      attendances: meeting?.attendances.map((att: any) => ({
        member: att.member,
        status: att.status

      }))
    }

    return NextResponse.json(transformedMeeting, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
