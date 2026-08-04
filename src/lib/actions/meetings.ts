'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function createMeetingAction(formData: {
  date: string
  time: string
  location: string
  memo?: string
  title?: string
  attendees?: string[]
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

    const dateTime = new Date(`${formData.date}T${formData.time}`)

    await prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          title: formData.title || '모임',
          date: dateTime,
          location: formData.location,
          memo: formData.memo || '',
          clubId: club.id
        }
      })

      if (formData.attendees && formData.attendees.length > 0) {
        for (const memberId of formData.attendees) {
          await tx.attendance.create({
            data: {
              meetingId: meeting.id,
              memberId,
              status: 'ATTENDING'
            }
          })
        }
      }
    })

    revalidatePath('/api/meetings')
    revalidatePath('/meetings')
    return { success: true }
  } catch (error) {
    console.error('Failed to create meeting:', error)
    return { success: false, error: error instanceof Error ? error.message : '모임 추가에 실패했습니다.' }
  }
}

export async function updateMeetingAction(id: string, formData: {
  date: string
  time: string
  location: string
  memo?: string
  title?: string
  attendees?: string[]
}) {
  try {
    const dateTime = new Date(`${formData.date}T${formData.time}`)

    await prisma.$transaction(async (tx) => {
      await tx.meeting.update({
        where: { id },
        data: {
          title: formData.title || '모임',
          date: dateTime,
          location: formData.location,
          memo: formData.memo || ''
        }
      })

      await tx.attendance.deleteMany({ where: { meetingId: id } })

      if (formData.attendees && formData.attendees.length > 0) {
        for (const memberId of formData.attendees) {
          await tx.attendance.create({
            data: {
              meetingId: id,
              memberId,
              status: 'ATTENDING'
            }
          })
        }
      }
    })

    revalidatePath('/api/meetings')
    revalidatePath('/meetings')
    return { success: true }
  } catch (error) {
    console.error('Failed to update meeting:', error)
    return { success: false, error: error instanceof Error ? error.message : '모임 수정에 실패했습니다.' }
  }
}

export async function deleteMeetingAction(id: string) {
  try {
    await prisma.meeting.delete({ where: { id } })

    revalidatePath('/api/meetings')
    revalidatePath('/meetings')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete meeting:', error)
    return { success: false, error: error instanceof Error ? error.message : '모임 삭제에 실패했습니다.' }
  }
}
