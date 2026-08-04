'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BookOpen, Calendar, Users, BarChart3, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '대시보드', icon: BarChart3 },
  { href: '/meetings', label: '모임 일정', icon: Calendar },
  { href: '/books', label: '책 관리', icon: BookOpen },
  { href: '/gallery', label: '갤러리', icon: ImageIcon },
  { href: '/members', label: '멤버 관리', icon: Users },
]

function isActiveRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-14 items-center">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="flex items-center h-8">
                <Image
                  src="/agonarak-logo.png"
                  alt="아고나락"
                  width={96}
                  height={32}
                  className="object-contain h-full w-auto"
                  priority
                />
              </Link>
            </div>
            <div className="hidden sm:flex sm:space-x-6 sm:ml-6">
                {navItems.map((item) => {
                  const isActive = isActiveRoute(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 text-sm border-b-2",
                        isActive
                          ? "border-foreground text-foreground font-medium"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive = isActiveRoute(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full text-xs gap-0.5",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
