'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function createBookAction(formData: {
  title: string
  author: string
  registeredDate: string
  genres: string[]
  notes?: string
  rating?: number
  thumbnail?: string | null
  addedByIds?: string[]
}) {
  try {
    // 기본 클럽 ID 가져오기
    let club = await prisma.club.findFirst()
    if (!club) {
      club = await prisma.club.create({
        data: {
          name: '아고나락',
          description: '아고나락'
        }
      })
    }

    // 여러 멤버가 추가한 경우 각각 별도 Book 생성
    const addedByIds = formData.addedByIds || []

    if (addedByIds.length === 0) {
      throw new Error('최소 한 명의 추가자를 선택해주세요.')
    }

    // 각 멤버별로 책 생성
    for (const addedById of addedByIds) {
      await prisma.$transaction(async (tx) => {
        const book = await tx.book.create({
          data: {
            title: formData.title,
            author: formData.author,
            notes: formData.notes || '',
            rating: formData.rating || 0,
            thumbnail: formData.thumbnail || null,
            registeredDate: new Date(formData.registeredDate),
            clubId: club.id,
            addedById
          }
        })

        // 장르 관계 생성
        if (formData.genres && formData.genres.length > 0) {
          for (const genreName of formData.genres) {
            let genre = await tx.genre.findFirst({
              where: { name: genreName, clubId: club.id }
            })

            if (!genre) {
              genre = await tx.genre.create({
                data: { name: genreName, clubId: club.id }
              })
            }

            await tx.bookGenre.create({
              data: { bookId: book.id, genreId: genre.id }
            })
          }
        }
      })
    }

    revalidatePath('/api/books')
    revalidatePath('/books')
    revalidateTag('books')
    revalidateTag('dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to create book:', error)
    return { success: false, error: error instanceof Error ? error.message : '책 추가에 실패했습니다.' }
  }
}

export async function updateBookAction(id: string, formData: {
  title: string
  author: string
  registeredDate: string
  genres: string[]
  notes?: string
  rating?: number
  thumbnail?: string | null
  addedById?: string | null
}) {
  try {
    const existingBook = await prisma.book.findUnique({ where: { id } })
    if (!existingBook) {
      return { success: false, error: '책을 찾을 수 없습니다.' }
    }

    await prisma.$transaction(async (tx) => {
      const book = await tx.book.update({
        where: { id },
        data: {
          title: formData.title,
          author: formData.author,
          notes: formData.notes || '',
          rating: formData.rating || 0,
          thumbnail: formData.thumbnail || null,
          registeredDate: new Date(formData.registeredDate),
          addedById: formData.addedById || null
        }
      })

      await tx.bookGenre.deleteMany({ where: { bookId: id } })

      if (formData.genres && formData.genres.length > 0) {
        for (const genreName of formData.genres) {
          let genre = await tx.genre.findFirst({
            where: { name: genreName, clubId: book.clubId }
          })

          if (!genre) {
            genre = await tx.genre.create({
              data: { name: genreName, clubId: book.clubId }
            })
          }

          await tx.bookGenre.create({
            data: { bookId: book.id, genreId: genre.id }
          })
        }
      }
    })

    revalidatePath('/api/books')
    revalidatePath(`/api/books/${id}`)
    revalidatePath('/books')
    revalidatePath(`/books/${id}`)
    revalidateTag('books')
    revalidateTag('dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to update book:', error)
    return { success: false, error: error instanceof Error ? error.message : '책 수정에 실패했습니다.' }
  }
}

export async function deleteBookAction(id: string) {
  try {
    const existingBook = await prisma.book.findUnique({ where: { id } })
    if (!existingBook) {
      return { success: false, error: '책을 찾을 수 없습니다.' }
    }

    await prisma.book.delete({ where: { id } })

    revalidatePath('/api/books')
    revalidatePath('/books')
    revalidateTag('books')
    revalidateTag('dashboard')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete book:', error)
    return { success: false, error: error instanceof Error ? error.message : '책 삭제에 실패했습니다.' }
  }
}
