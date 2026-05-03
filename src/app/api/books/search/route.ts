import { NextRequest, NextResponse } from 'next/server'

interface NaverBookItem {
  title: string
  author: string
  publisher: string
  isbn: string
  image: string
}

interface NaverBookResponse {
  items: NaverBookItem[]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.trim().length < 2) {
    return NextResponse.json([])
  }

  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Naver API credentials not configured')
    return NextResponse.json(
      { error: 'Search service not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=8`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Naver API request failed: ${response.status}`)
    }

    const data: NaverBookResponse = await response.json()

    if (!data.items) {
      return NextResponse.json([])
    }

    const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '')

    const books = data.items.map((item) => ({
      title: stripHtml(item.title),
      author: stripHtml(item.author),
      publisher: stripHtml(item.publisher),
      isbn: item.isbn?.split(' ').pop() || '',
      thumbnail: item.image || '',
    }))

    return NextResponse.json(books)
  } catch (error) {
    console.error('Book search error:', error)
    return NextResponse.json(
      { error: 'Failed to search books' },
      { status: 500 }
    )
  }
}
