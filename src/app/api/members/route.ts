import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Member } from '@prisma/client'

// GET - 모든 멤버 조회
export async function GET() {
  try {
    const now = new Date()
    
    // 현재 시점 기준으로 이미 지난 모임 수만 조회
    const pastMeetingsCount = await prisma.meeting.count({
      where: {
        date: {
          lt: now // 현재 시점보다 이전 모임만
        }
      }
    })
    
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

    // 참석률 통계 계산 (지난 모임 기준)
    const membersWithStats = members.map(member => {
      // 지난 모임 중에서 참석한 모임만 카운트
      const attendedMeetings = member.attendances.filter(
        attendance => attendance.status === 'ATTENDING' && 
        new Date(attendance.meeting.date) < now // 지난 모임만
      ).length
      
      const attendanceRate = pastMeetingsCount > 0 ? (attendedMeetings / pastMeetingsCount) * 100 : 0

      return {
        ...member,
        attendanceStats: {
          totalMeetings: pastMeetingsCount, // 지난 모임 수
          attendedMeetings, // 실제 참석한 모임 수 (지난 모임 중)
          attendanceRate: Math.round(attendanceRate * 100) / 100 // 소수점 2자리까지
        },
        attendances: undefined // 프론트엔드에 불필요한 데이터 제거
      }
    })
    
    return NextResponse.json(membersWithStats)
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

    const member: Member = await prisma.member.create({
      data: {
        nickname,
        role: role || 'MEMBER',
        contact: contact || '',
        clubId: club.id
      }
    })

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
