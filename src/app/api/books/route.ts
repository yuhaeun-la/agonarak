/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - 모든 책 조회
export async function GET() {
  try {
    const books = await prisma.book.findMany({
      include: {
        addedBy: {
          select: {
            id: true,
            nickname: true
          }
        },
        genres: {
          include: {
            genre: true
          }
        }
      } as any,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 데이터 구조 변환 (프론트엔드에서 사용하기 쉽게)
    const transformedBooks = books.map((book: any) => ({
      ...book,
      genres: book.genres?.map((bg: any) => bg.genre.name) || [],
      addedBy: book.addedBy?.nickname || 'Unknown'
    }))
    
    return NextResponse.json(transformedBooks)
  } catch (error: unknown) {
    console.error('Failed to fetch books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

// POST - 새 책 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, registeredDate, genres, notes, addedById } = body

    // 입력 검증
    if (!title || !author || !registeredDate) {
      return NextResponse.json(
        { error: 'Title, author and registered date are required' },
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

    // 트랜잭션으로 책과 장르 관계 생성
    const result = await prisma.$transaction(async (tx) => {
      // 책 생성 (이제 같은 책도 멤버별로 별도 등록 가능)
      const book = await tx.book.create({
        data: {
          title,
          author,
          notes: notes || '',
          registeredDate: new Date(registeredDate),
          clubId: club.id,
          addedById: addedById || null
        } as any
      })

      // 장르 관계 생성
      if (genres && genres.length > 0) {
        for (const genreName of genres) {
          // 장르가 없으면 생성, 있으면 찾기
          let genre = await tx.genre.findFirst({
            where: {
              name: genreName,
              clubId: club.id
            }
          })

          if (!genre) {
            genre = await tx.genre.create({
              data: {
                name: genreName,
                clubId: club.id
              }
            })
          }

          // 책-장르 관계 생성
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

    // 생성된 책을 관계 데이터와 함께 다시 조회
    const createdBook = await prisma.book.findUnique({
      where: { id: result.id },
      include: {
        addedBy: {
          select: {
            id: true,
            nickname: true
          }
        },
        genres: {
          include: {
            genre: true
          }
        }
      } as any
    })

    // 데이터 구조 변환
    if (!createdBook) {
      throw new Error('Failed to create book')
    }

    const transformedBook = {
      ...(createdBook as any),
      genres: (createdBook as any).genres?.map((bg: any) => bg.genre.name) || [],
      addedBy: (createdBook as any).addedBy?.nickname || 'Unknown'
    }

    return NextResponse.json(transformedBook, { status: 201 })
  } catch (error: unknown) {
    console.error('Failed to create book:', error)
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    )
  }
}
