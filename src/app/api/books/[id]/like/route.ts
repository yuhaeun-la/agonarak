import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const book = await prisma.book.update({
      where: { id },
      data: {
        notesLikes: {
          increment: 1
        }
      },
      select: {
        notesLikes: true
      }
    })

    // 캐시 무효화
    revalidateTag(`book-${id}`, '')
    revalidateTag('books', '')

    return NextResponse.json({ notesLikes: book.notesLikes })
  } catch (error) {
    console.error('Failed to like book notes:', error)
    return NextResponse.json(
      { error: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
