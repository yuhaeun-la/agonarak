'use client'

import { useState, useEffect } from 'react'
import { PhotoGalleryContent } from './photo-gallery-content'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'

const CORRECT_PASSWORD = '0319'
const STORAGE_KEY = 'gallery_auth'

interface Meeting {
  id: string
  date: Date | string
  location: string | null
  title: string
  photos: Array<{
    id: string
    imageUrl: string
    caption: string | null
  }>
  meetingNumber?: number
}

interface PasswordProtectedGalleryProps {
  meetingsWithNumber: Meeting[]
  allPastMeetings: Array<{ id: string; date: Date | string; location: string | null }>
}

export function PasswordProtectedGallery({ meetingsWithNumber, allPastMeetings }: PasswordProtectedGalleryProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const authStatus = sessionStorage.getItem(STORAGE_KEY)
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      sessionStorage.setItem(STORAGE_KEY, 'true')
      setError('')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
      setPassword('')
    }
  }

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-3">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold">갤러리 접근</h2>
                  <p className="text-sm text-muted-foreground">
                    갤러리를 보려면 비밀번호를 입력하세요
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full">
                    확인
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <PhotoGalleryContent
      meetingsWithNumber={meetingsWithNumber}
      allPastMeetings={allPastMeetings}
    />
  )
}
