import { Navbar } from '@/components/layout/navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BookOpen } from 'lucide-react'

export default function BookDetailLoading() {
  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          책 관리
        </Button>

        {/* 책 히어로 */}
        <div className="flex gap-6 mb-10">
          <Skeleton className="h-40 w-28 rounded flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-2/3 mb-4" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        {/* 등록 정보 */}
        <div className="mb-10">
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="border rounded-lg divide-y">
            <div className="flex items-center justify-between p-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between p-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div>
          <Skeleton className="h-4 w-16 mb-3" />
          <div className="border rounded-lg p-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
