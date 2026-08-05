import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

// 캐시된 책 상세 조회 함수
const getCachedBook = (id: string) =>
  unstable_cache(
    async () => {
      const book = await prisma.book.findUnique({
        where: { id },
        include: {
          addedBy: { select: { id: true, nickname: true, avatarUrl: true } },
          genres: { include: { genre: { select: { name: true } } } },
        },
      })

      if (!book) return null

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        notes: book.notes || '',
        notesLikes: book.notesLikes || 0,
        rating: book.rating || 0,
        thumbnail: book.thumbnail || null,
        registeredDate: book.registeredDate.toISOString(),
        createdAt: book.createdAt.toISOString(),
        genres: book.genres.map((bg) => bg.genre.name),
        addedBy: book.addedBy?.nickname || 'Unknown',
        addedByAvatarUrl: book.addedBy?.avatarUrl || null,
        addedById: book.addedById || null,
      }
    },
    [`book-${id}`],
    {
      revalidate: 60,
      tags: ['books', `book-${id}`]
    }
  )()

// GET - 책 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const book = await getCachedBook(id)

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Failed to fetch book:', error)
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 })
  }
}

// DELETE - 책 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 책이 존재하는지 확인
    const existingBook = await prisma.book.findUnique({
      where: { id }
    })

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // 책 삭제 (Cascade로 관련 데이터도 자동 삭제됨)
    await prisma.book.delete({
      where: { id }
    })

    // 캐시 무효화
    revalidatePath('/api/books')
    revalidatePath(`/api/books/${id}`)

    return NextResponse.json(
      { message: 'Book deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Failed to delete book:', error)
    
    // Prisma 에러 처리
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    )
  }
}

// PUT - 책 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, author, genres, notes, registeredDate, addedById, rating, thumbnail } = body

    // 입력 검증
    if (!title || !author) {
      return NextResponse.json(
        { error: 'Title and author are required' },
        { status: 400 }
      )
    }

    // 책이 존재하는지 확인
    const existingBook = await prisma.book.findUnique({
      where: { id }
    })

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // 트랜잭션으로 책 정보 수정 및 장르 업데이트
    const updatedBook = await prisma.$transaction(async (tx) => {
      // 책 정보 업데이트
      const book = await tx.book.update({
        where: { id },
        data: {
          title: title.trim(),
          author: author.trim(),
          notes: notes || '',
          rating: rating ?? 0,
          thumbnail: thumbnail ?? undefined,
          registeredDate: new Date(registeredDate),
          addedById: addedById || null
        }
      })

      // 기존 장르 연결 삭제
      await tx.bookGenre.deleteMany({
        where: { bookId: id }
      })

      // 새로운 장르 추가 (제공된 경우)
      if (genres && genres.length > 0) {
        // 장르가 존재하지 않으면 생성
        for (const genreName of genres) {
          let genre = await tx.genre.findFirst({
            where: {
              name: genreName,
              clubId: book.clubId
            }
          })

          if (!genre) {
            genre = await tx.genre.create({
              data: {
                name: genreName,
                clubId: book.clubId
              }
            })
          }

          // 책-장르 연결 생성
          await tx.bookGenre.create({
            data: {
              bookId: book.id,
              genreId: genre.id
            }
          })
        }
      }

      return book
    })

    // 캐시 무효화
    revalidatePath('/api/books')
    revalidatePath(`/api/books/${id}`)

    return NextResponse.json(updatedBook, { status: 200 })
  } catch (error: unknown) {
    console.error('Failed to update book:', error)
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    )
  }
}
