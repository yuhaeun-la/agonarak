'use client'

import Link from 'next/link'
import { BookOpen, Calendar, Users, BarChart3 } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                아고나락
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                대시보드
              </Link>
              <Link
                href="/meetings"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <Calendar className="mr-2 h-4 w-4" />
                모임 일정
              </Link>
              <Link
                href="/books"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                책 관리
              </Link>
              <Link
                href="/members"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <Users className="mr-2 h-4 w-4" />
                멤버 관리
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
