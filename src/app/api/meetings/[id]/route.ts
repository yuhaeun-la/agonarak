import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE - 모임 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 모임이 존재하는지 확인
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // 모임 삭제 (Cascade로 관련 데이터도 자동 삭제됨)
    await prisma.meeting.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Meeting deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Failed to delete meeting:', error)
    
    // Prisma 에러 처리
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete meeting' },
      { status: 500 }
    )
  }
}

// PUT - 모임 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, date, time, location, memo, attendees } = body

    // 입력 검증
    if (!title || !date || !time) {
      return NextResponse.json(
        { error: 'Title, date and time are required' },
        { status: 400 }
      )
    }

    // 모임이 존재하는지 확인
    const existingMeeting = await prisma.meeting.findUnique({
      where: { id }
    })

    if (!existingMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // 날짜와 시간을 합쳐서 DateTime으로 변환 (로컬 시간으로 처리)
    const meetingDateTime = new Date(`${date}T${time}:00.000+09:00`)

    // 트랜잭션으로 모임 정보 수정 및 참석자 업데이트
    const updatedMeeting = await prisma.$transaction(async (tx) => {
      // 모임 정보 업데이트
      const meeting = await tx.meeting.update({
        where: { id },
        data: {
          title,
          date: meetingDateTime,
          location: location || '',
          memo: memo || ''
        }
      })

      // 기존 참석 기록 삭제
      await tx.attendance.deleteMany({
        where: { meetingId: id }
      })

      // 새로운 참석자 추가 (제공된 경우)
      if (attendees && attendees.length > 0) {
        await tx.attendance.createMany({
          data: attendees.map((memberId: string) => ({
            meetingId: id,
            memberId,
            status: 'ATTENDING'
          }))
        })
      }

      return meeting
    })

    return NextResponse.json(updatedMeeting, { status: 200 })
  } catch (error: unknown) {
    console.error('Failed to update meeting:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    )
  }
}
