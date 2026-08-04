import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

const START_DATE = new Date('2022-03-19')

export const getDashboardStats = unstable_cache(
  async () => {
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - START_DATE.getTime()) / 86400000)

    const [members, totalMeetings, books] = await Promise.all([
      prisma.member.findMany({ select: { id: true } }),
      prisma.meeting.count(),
      prisma.book.findMany({ select: { title: true, author: true } })
    ])

    const uniqueBooks = new Set<string>()
    books.forEach((book) => {
      uniqueBooks.add(`${book.title}-${book.author}`)
    })

    return {
      daysSinceStart,
      totalBooks: uniqueBooks.size,
      totalMeetings,
      totalMembers: members.length,
    }
  },
  ['dashboard-stats'],
  {
    revalidate: 60,
    tags: ['dashboard', 'members', 'meetings', 'books']
  }
)

export const getUpcomingMeeting = unstable_cache(
  async () => {
    const now = new Date()
    const meeting = await prisma.meeting.findFirst({
      where: { date: { gte: now } },
      include: {
        books: {
          include: {
            book: { select: { id: true, title: true, author: true } }
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    if (!meeting) return null

    return {
      id: meeting.id,
      date: meeting.date.toISOString(),
      location: meeting.location || '',
      memo: meeting.memo || '',
      title: meeting.title || '',
      books: meeting.books.map((mb) => mb.book)
    }
  },
  ['dashboard-upcoming-meeting'],
  {
    revalidate: 60,
    tags: ['dashboard', 'meetings']
  }
)

export const getTopRatedBook = unstable_cache(
  async () => {
    const book = await prisma.book.findFirst({
      where: { rating: { gt: 0 } },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      include: {
        addedBy: { select: { nickname: true, avatarUrl: true } },
      }
    })

    if (!book) return null

    return {
      title: book.title,
      author: book.author,
      rating: book.rating || 0,
      addedBy: book.addedBy?.nickname || 'Unknown',
      addedByAvatarUrl: book.addedBy?.avatarUrl || null,
    }
  },
  ['dashboard-top-rated-book'],
  {
    revalidate: 60,
    tags: ['dashboard', 'books']
  }
)

export const getRecentBooks = unstable_cache(
  async () => {
    const books = await prisma.book.findMany({
      include: {
        addedBy: { select: { nickname: true, avatarUrl: true } },
        genres: { include: { genre: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      thumbnail: b.thumbnail || null,
      genres: b.genres.map((bg) => bg.genre.name),
      addedBy: b.addedBy?.nickname || 'Unknown',
      addedByAvatarUrl: b.addedBy?.avatarUrl || null,
      createdAt: b.createdAt.toISOString()
    }))
  },
  ['dashboard-recent-books'],
  {
    revalidate: 60,
    tags: ['dashboard', 'books']
  }
)
