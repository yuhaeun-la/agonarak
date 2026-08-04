import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const getBooks = unstable_cache(
  async () => {
    const books = await prisma.book.findMany({
      include: {
        addedBy: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true
          }
        },
        genres: {
          include: {
            genre: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return books.map((book) => ({
      ...book,
      genres: book.genres?.map((bg) => bg.genre.name) || [],
      addedBy: book.addedBy?.nickname || 'Unknown',
      addedByAvatarUrl: book.addedBy?.avatarUrl || null
    }))
  },
  ['books-data'],
  {
    revalidate: 60,
    tags: ['books']
  }
)

export const getBook = (id: string) =>
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
