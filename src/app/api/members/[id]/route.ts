import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - 멤버 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { nickname, role, contact } = body
    const { id } = params

    // 입력 검증
    if (!nickname) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      )
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        nickname,
        role: role || 'MEMBER',
        contact: contact || ''
      }
    })

    return NextResponse.json(member)
  } catch (error: any) {
    console.error('Failed to update member:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nickname already exists in this club' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE - 멤버 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.member.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Member deleted successfully' })
  } catch (error: any) {
    console.error('Failed to delete member:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
