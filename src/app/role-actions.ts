'use server'

import prisma from '@/lib/prisma'
import { auth } from '../../auth'
import { revalidatePath } from 'next/cache'

export async function createRoleAction(formData: FormData) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'admin') return { success: false, error: 'Unauthorized' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const modules = formData.getAll('modules') as string[]

  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
        modules: JSON.stringify(modules),
        tenantId: user.tenantId,
      }
    })
    revalidatePath('/settings/roles')
    return { success: true, role }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function deleteRoleAction(roleId: string) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'admin') return { success: false, error: 'Unauthorized' }

  try {
    const count = await prisma.user.count({ where: { roleId } })
    if (count > 0) return { success: false, error: 'Cannot delete a role that is assigned to users.' }
    await prisma.role.delete({ where: { id: roleId, tenantId: user.tenantId } })
    revalidatePath('/settings/roles')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function updateRoleAction(roleId: string, formData: FormData) {
  const session = await auth()
  const user = session?.user as any
  if (!user || user.role !== 'admin') return { success: false, error: 'Unauthorized' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const modules = formData.getAll('modules') as string[]

  try {
    const role = await prisma.role.update({
      where: { id: roleId, tenantId: user.tenantId },
      data: {
        name,
        description,
        modules: JSON.stringify(modules),
      }
    })
    revalidatePath('/settings/roles')
    return { success: true, role }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

