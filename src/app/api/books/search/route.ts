import { NextRequest, NextResponse } from 'next/server'

interface GoogleBooksItem {
  volumeInfo: {
    title?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json([])
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&langRestrict=ko&printType=books`,
      { next: { revalidate: 300 } }
    )

    if (!response.ok) {
      throw new Error('Google Books API request failed')
    }

    const data = await response.json()

    if (!data.items) {
      return NextResponse.json([])
    }

    const books = data.items.map((item: GoogleBooksItem) => {
      const info = item.volumeInfo
      const isbn = info.industryIdentifiers?.find(
        (id) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )

      return {
        title: info.title || '',
        author: info.authors?.join(', ') || '',
        publisher: info.publisher || '',
        publishedDate: info.publishedDate || '',
        isbn: isbn?.identifier || '',
        thumbnail: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      }
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('Book search error:', error)
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    )
  }
}
