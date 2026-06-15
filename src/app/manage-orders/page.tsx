import prisma from '@/lib/prisma'
import { auth } from '../../../auth'
import OrderManagerClient from '@/components/OrderManagerClient'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'

export default async function ManageOrdersPage() {
  const session = await auth()
  const user = session?.user as any
  
  if (!user) {
    return redirect('/login')
  }

  const isSuperAdmin = user.role === 'superadmin'
  const isAdmin = user.role === 'admin'

  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="main-content">
        <h1 className="page-title">Unauthorized</h1>
        <p>Only administrators can access this page.</p>
      </div>
    )
  }

  // Isolation logic: 
  // - Superadmins see EVERYTHING if they want (or their tenant if they belong to one, but let's show everything for system-wide management).
  // - Admins see only their tenant.
  
  const tId = user.tenantId
  let ordersData = []
  let currency = '$'

  if (isSuperAdmin) {
    ordersData = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        customer: true,
        tenant: true,
        user: true,
        orderItems: {
          include: { menuItem: true }
        }
      }
    })
  } else {
    if (!tId) return redirect('/login')
    const tenant = await prisma.tenant.findUnique({ where: { id: tId } })
    currency = tenant?.currency || '$'

    ordersData = await prisma.order.findMany({
      where: { tenantId: tId },
      orderBy: { createdAt: 'desc' },
      include: { 
        customer: true,
        tenant: true,
        user: true,
        orderItems: {
          include: { menuItem: true }
        }
      }
    })
  }

  // Serialize dates for Client Component
  const orders = JSON.parse(JSON.stringify(ordersData))

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">{isSuperAdmin ? '🌐 System-wide Orders' : 'Manage Orders'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isSuperAdmin 
            ? 'Viewing all transactions across all store tenants.' 
            : 'Review and manage all store transactions. Admins can permanently remove orders.'}
        </p>
      </div>

      <OrderManagerClient 
        initialOrders={orders} 
        currency={currency} 
        isSuperAdmin={isSuperAdmin} 
      />
    </div>
  )
}
