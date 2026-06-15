import prisma from '@/lib/prisma'
import SuperAdminClient from '@/components/SuperAdminClient'
import { auth } from '../../../auth'
export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const session = await auth()
  const me = session?.user as any

  if (!me || me.role !== 'superadmin') {
    return (
      <div className="main-content">
        <h1 className="page-title">Unauthorized</h1>
        <p>Only system administrators can access this page.</p>
      </div>
    )
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: { select: { users: true, orders: true, customers: true } },
      users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const plans = await prisma.plan.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="main-content">
      <h1 className="page-title">🌐 Super Admin</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Manage all tenants, users, and system-wide settings.
      </p>
      <SuperAdminClient initialTenants={tenants} initialPlans={plans} currentUserId={me?.id} />
    </div>
  )
}
