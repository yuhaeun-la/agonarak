'use client'

import React from 'react'
import { Star, StarHalf } from 'lucide-react'

/** 별점 표시 (읽기 전용) */
export function StarRatingDisplay({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' | 'md' }) {
  const sizeClass = size === 'xs' ? 'h-2.5 w-2.5' : size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className={`${sizeClass} fill-foreground text-foreground`} />
      ))}
      {hasHalf && <StarHalf key="half" className={`${sizeClass} fill-foreground text-foreground`} />}
    </div>
  )
}

/** 별점 입력 (클릭 가능, 0.5 단위) */
export function StarRatingInput({ rating, onChange }: { rating: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative h-5 w-5">
          {/* 왼쪽 반: N-0.5 */}
          <button
            type="button"
            className="absolute inset-y-0 left-0 w-1/2 z-10"
            onClick={() => onChange(rating === star - 0.5 ? 0 : star - 0.5)}
          />
          {/* 오른쪽 반: N */}
          <button
            type="button"
            className="absolute inset-y-0 right-0 w-1/2 z-10"
            onClick={() => onChange(rating === star ? 0 : star)}
          />
          {/* 별 아이콘 렌더링 */}
          {rating >= star ? (
            <Star className="h-5 w-5 fill-foreground text-foreground" />
          ) : rating >= star - 0.5 ? (
            <StarHalf className="h-5 w-5 fill-foreground text-foreground" />
          ) : (
            <Star className="h-5 w-5 text-muted-foreground/30" />
          )}
        </div>
      ))}
      {rating > 0 && (
        <span className="text-xs text-muted-foreground ml-2">{rating}점</span>
      )}
    </div>
  )
}
