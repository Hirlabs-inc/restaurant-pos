'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { auth } from '../../auth'

// ── TENANT ACTIONS ───────────────────────────────────────────

export async function createTenantAction(formData: FormData) {
  try {
    const name = formData.get('tenantName') as string
    const adminName = formData.get('adminName') as string
    const adminEmail = formData.get('adminEmail') as string
    const adminPassword = formData.get('adminPassword') as string
    const planId = formData.get('planId') as string

    if (!name || !adminEmail || !adminPassword) return { success: false, error: 'Missing required fields.' }

    let planName = 'Trial'
    if (planId) {
      const p = await prisma.plan.findUnique({ where: { id: planId } })
      planName = p?.name || 'Trial'
    }

    const tenant = await prisma.tenant.create({ data: { name, planId: planId || null, plan: planName } })

    const hashed = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: { tenantId: tenant.id, name: adminName || 'Admin', email: adminEmail, password: hashed, role: 'admin' }
    })

    revalidatePath('/superadmin')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Email already in use.' }
    return { success: false, error: e.message }
  }
}

export async function deleteTenantAction(tenantId: string) {
  try {
    // Cascade delete everything owned by this tenant
    await prisma.$transaction([
      prisma.transfer.deleteMany({ where: { tenantId } }),
      prisma.paymentMethod.deleteMany({ where: { tenantId } }),
      prisma.expense.deleteMany({ where: { tenantId } }),
      prisma.orderItem.deleteMany({ where: { tenantId } }),
      prisma.order.deleteMany({ where: { tenantId } }),
      prisma.customer.deleteMany({ where: { tenantId } }),
      prisma.menuItem.deleteMany({ where: { tenantId } }),
      prisma.category.deleteMany({ where: { tenantId } }),
      prisma.fulfillmentOption.deleteMany({ where: { tenantId } }),
      prisma.user.deleteMany({ where: { tenantId } }),
      prisma.tenant.delete({ where: { id: tenantId } }),
    ])
    revalidatePath('/superadmin')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function toggleTenantStatusAction(tenantId: string, currentStatus: string) {
  try {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    await prisma.tenant.update({ where: { id: tenantId }, data: { status: newStatus } })
    revalidatePath('/superadmin')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateTenantAction(tenantId: string, formData: FormData) {
  try {
    const name = formData.get('name') as string
    const planId = formData.get('planId') as string
    const status = formData.get('status') as string
    const currency = formData.get('currency') as string
    const taxRate = parseFloat(formData.get('taxRate') as string) || 0

    let planName = ''
    if (planId) {
      const p = await prisma.plan.findUnique({ where: { id: planId } })
      planName = p?.name || ''
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name, planId: planId || null, plan: planName, status, currency, taxRate }
    })

    revalidatePath('/superadmin')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ── USER ACTIONS ─────────────────────────────────────────────

export async function createUserAction(formData: FormData) {
  try {
    const session = await auth()
    const me = session?.user as any
    if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) {
      return { success: false, error: 'Unauthorized.' }
    }

    const tenantId = formData.get('tenantId') as string
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const roleInput = formData.get('role') as string
    
    let role = roleInput
    let roleId = null
    if (roleInput !== 'admin' && roleInput !== 'cashier') {
      roleId = roleInput
      role = 'custom'
    }

    if (!email || !password || !name) return { success: false, error: 'Missing required fields.' }

    // Enforce Plan Limits
    if (tenantId && tenantId !== 'null') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { planObj: true, _count: { select: { users: true } } }
      })

      if (tenant?.planObj) {
        if (tenant._count.users >= tenant.planObj.maxUsers) {
          return { success: false, error: `Plan limit reached: This store is limited to ${tenant.planObj.maxUsers} users. Please upgrade the plan.` }
        }
      }
    }

    const hashed = await bcrypt.hash(password, 12)
    const finalTenantId = (tenantId && tenantId !== 'null') ? tenantId : null
    await prisma.user.create({ data: { tenantId: finalTenantId, name, email, password: hashed, role, roleId } })

    revalidatePath('/superadmin')
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, error: 'Email already in use.' }
    return { success: false, error: e.message }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const session = await auth()
    const me = session?.user as any

    if (!me) return { success: false, error: 'Unauthorized.' }
    
    // Prevent self-deletion
    if (me.id === userId) {
      return { success: false, error: 'You cannot remove your own account.' }
    }

    // Role check: Only admin or superadmin can delete users
    if (me.role !== 'admin' && me.role !== 'superadmin') {
      return { success: false, error: 'Unauthorized: Only administrators can remove users.' }
    }

    await prisma.user.delete({ where: { id: userId } })
    revalidatePath('/superadmin')
    revalidatePath('/settings/users')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  try {
    const session = await auth()
    const me = session?.user as any
    if (!me || (me.role !== 'admin' && me.role !== 'superadmin')) {
      return { success: false, error: 'Unauthorized.' }
    }

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ── PLAN ACTIONS ─────────────────────────────────────────────

export async function createPlanAction(formData: FormData) {
  try {
    const name = formData.get('name') as string
    const maxUsers = parseInt(formData.get('maxUsers') as string) || 5
    const maxOrders = parseInt(formData.get('maxOrders') as string) || 1000
    const price = parseFloat(formData.get('price') as string) || 0
    const description = formData.get('description') as string

    await prisma.plan.create({ data: { name, maxUsers, maxOrders, price, description } })
    revalidatePath('/superadmin/plans')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updatePlanAction(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string
    const maxUsers = parseInt(formData.get('maxUsers') as string) || 5
    const maxOrders = parseInt(formData.get('maxOrders') as string) || 1000
    const price = parseFloat(formData.get('price') as string) || 0
    const description = formData.get('description') as string

    await prisma.plan.update({
      where: { id },
      data: { name, maxUsers, maxOrders, price, description }
    })
    revalidatePath('/superadmin/plans')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deletePlanAction(id: string) {
  try {
    const usage = await prisma.tenant.count({ where: { planId: id } })
    if (usage > 0) return { success: false, error: 'Cannot delete plan: It is currently assigned to stores.' }

    await prisma.plan.delete({ where: { id } })
    revalidatePath('/superadmin/plans')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

