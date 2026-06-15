import prisma from '@/lib/prisma'
import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import EmployeesPageClient from '../../components/EmployeesPageClient'

export default async function EmployeesPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || !user.tenantId) redirect('/login')

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    include: { customRole: true }
  })

  if (!u || !u.tenantId) redirect('/login')

  const hasAccess = u.role === 'admin' || u.role === 'superadmin' ||
    (u.role === 'custom' && u.customRole?.modules && JSON.parse(u.customRole.modules).includes('/employees'))

  if (!hasAccess) redirect('/')

  const tId = u.tenantId as string

  // --- Employees tab data ---
  const employees = await prisma.employee.findMany({
    where: { tenantId: tId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { assignedJobs: true } }
    }
  })

  // --- Wages tab data ---
  const wageEmployees = await prisma.employee.findMany({
    where: { tenantId: tId, status: 'Active' },
    orderBy: { name: 'asc' },
    include: {
      wagePayments: { orderBy: { date: 'desc' } },
      assignedJobs: {
        where: { status: { not: 'DRAFT' } },
        select: { id: true, createdAt: true }
      },
      _count: { select: { assignedJobs: true } }
    }
  })

  const recentPayments = await prisma.wagePayment.findMany({
    where: { tenantId: tId },
    orderBy: { date: 'desc' },
    take: 50,
    include: { employee: true }
  })

  const tenant = await prisma.tenant.findUnique({ where: { id: tId } })

  return (
    <div className="main-content">
      <div style={{ marginBottom: '8px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Employees</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Manage field workers and their wage payouts.
        </p>
      </div>
      <EmployeesPageClient
        employees={employees}
        wageEmployees={wageEmployees}
        recentPayments={recentPayments}
        currency={tenant?.currency || '$'}
      />
    </div>
  )
}
