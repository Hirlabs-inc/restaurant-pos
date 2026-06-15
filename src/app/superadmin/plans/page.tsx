import prisma from '@/lib/prisma'
import { auth } from '../../../../auth'
import { redirect } from 'next/navigation'
import PlanManagerClient from '@/components/PlanManagerClient'
export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  const session = await auth()
  const user = session?.user as any

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="main-content">
        <h1 className="page-title">Unauthorized</h1>
        <p>Only system administrators can access this page.</p>
      </div>
    )
  }

  const plans = await prisma.plan.findMany({
    orderBy: { price: 'asc' }
  })

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">💰 Plan Management</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Define subscription plans and resource limits for store tenants.
        </p>
      </div>
      
      <PlanManagerClient initialPlans={plans} />
    </div>
  )
}
