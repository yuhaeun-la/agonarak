import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { Member } from '@prisma/client'

// 캐시된 멤버 조회 함수
const getCachedMembers = unstable_cache(
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
  ['members'],
  {
    revalidate: 60,
    tags: ['members']
  }
)

// GET - 모든 멤버 조회
export async function GET() {
  try {
    const members = await getCachedMembers()
    return NextResponse.json(members)
  } catch (error: unknown) {
    console.error('Failed to fetch members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST - 새 멤버 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nickname, role, contact, avatarUrl } = body

    // 입력 검증
    if (!nickname) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      )
    }

    // 기본 클럽 ID (실제로는 클럽 선택 로직이 필요하지만 일단 하나의 클럽으로 가정)
    let club = await prisma.club.findFirst()
    if (!club) {
      // 기본 클럽이 없으면 생성
      club = await prisma.club.create({
        data: {
          name: '아고나락',
          description: '기본 아고나락'
        }
      })
    }

    const member: Member = await prisma.member.create({
      data: {
        nickname,
        role: role || 'MEMBER',
        contact: contact || '',
        avatarUrl: avatarUrl || null,
        clubId: club.id
      }
    })

    // 캐시 무효화
    revalidatePath('/api/members')

    return NextResponse.json(member, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create member:', error)
    
    // 중복 닉네임 에러 처리
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nickname already exists in this club' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
