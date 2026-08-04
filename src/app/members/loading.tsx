import { Navbar } from '@/components/layout/navbar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function MembersLoading() {
  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>

        {/* 멤버 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Skeleton className="h-16 w-16 rounded-full mb-3" />
                <Skeleton className="h-5 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t">
                  <div>
                    <Skeleton className="h-3 w-12 mx-auto mb-1" />
                    <Skeleton className="h-6 w-8 mx-auto" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-12 mx-auto mb-1" />
                    <Skeleton className="h-6 w-12 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
