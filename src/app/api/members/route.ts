import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - 모든 멤버 조회
export async function GET() {
  try {
    const members = await prisma.member.findMany({
      include: {
        attendances: {
          include: {
            meeting: true
          }
        }
      },
      orderBy: {
        nickname: 'asc'
      }
    })

    // 참석률 통계 계산
    const membersWithStats = members.map(member => {
      const totalMeetings = member.attendances.length
      const attendedMeetings = member.attendances.filter(
        attendance => attendance.status === 'ATTENDING'
      ).length
      const attendanceRate = totalMeetings > 0 ? (attendedMeetings / totalMeetings) * 100 : 0

      return {
        ...member,
        attendanceStats: {
          totalMeetings,
          attendedMeetings,
          attendanceRate
        },
        attendances: undefined // 프론트엔드에 불필요한 데이터 제거
      }
    })
    
    return NextResponse.json(membersWithStats)
  } catch (error: any) {
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
    const { nickname, role, contact } = body

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
          name: '우리 북클럽',
          description: '기본 북클럽'
        }
      })
    }

    const member = await prisma.member.create({
      data: {
        nickname,
        role: role || 'MEMBER',
        contact: contact || '',
        clubId: club.id
      } as any
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create member:', error)
    
    // 중복 닉네임 에러 처리
    if (error.code === 'P2002') {
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
