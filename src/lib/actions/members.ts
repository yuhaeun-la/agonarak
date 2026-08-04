'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function createMemberAction(formData: {
  nickname: string
  role?: 'LEADER' | 'MEMBER'
  contact?: string
  avatarUrl?: string | null
}) {
  try {
    let club = await prisma.club.findFirst()
    if (!club) {
      club = await prisma.club.create({
        data: {
          name: '아고나락',
          description: '아고나락'
        }
      })
    }

    await prisma.member.create({
      data: {
        nickname: formData.nickname,
        role: formData.role || 'MEMBER',
        contact: formData.contact || '',
        avatarUrl: formData.avatarUrl || null,
        clubId: club.id
      }
    })

    revalidatePath('/api/members')
    revalidatePath('/members')
    return { success: true }
  } catch (error) {
    console.error('Failed to create member:', error)
    return { success: false, error: error instanceof Error ? error.message : '멤버 추가에 실패했습니다.' }
  }
}

export async function updateMemberAction(id: string, formData: {
  nickname: string
  role?: 'LEADER' | 'MEMBER'
  contact?: string
  avatarUrl?: string | null
}) {
  try {
    await prisma.member.update({
      where: { id },
      data: {
        nickname: formData.nickname,
        role: formData.role || 'MEMBER',
        contact: formData.contact || '',
        avatarUrl: formData.avatarUrl !== undefined ? (formData.avatarUrl || null) : undefined
      }
    })

    revalidatePath('/api/members')
    revalidatePath('/members')
    revalidatePath(`/members/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update member:', error)
    return { success: false, error: error instanceof Error ? error.message : '멤버 수정에 실패했습니다.' }
  }
}

export async function deleteMemberAction(id: string) {
  try {
    await prisma.member.delete({ where: { id } })

    revalidatePath('/api/members')
    revalidatePath('/members')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete member:', error)
    return { success: false, error: error instanceof Error ? error.message : '멤버 삭제에 실패했습니다.' }
  }
}
