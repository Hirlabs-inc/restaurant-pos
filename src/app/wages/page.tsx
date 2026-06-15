import prisma from '@/lib/prisma'
import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
import WageManagerClient from '../../components/WageManagerClient'

export default async function WagesPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || !user.tenantId) redirect('/login')
  
  const u = await prisma.user.findUnique({
    where: { id: user.id },
    include: { customRole: true }
  })
  if (!u || !u.tenantId) redirect('/login')
  
  const hasAccess = u.role === 'admin' || u.role === 'superadmin' || 
    (u.role === 'custom' && u.customRole?.modules && JSON.parse(u.customRole.modules).includes('/wages'))
    
  if (!hasAccess) redirect('/')

  // Fetch employees with their recent wage payments and assigned jobs (for context)
  const employees = await prisma.employee.findMany({
    where: { tenantId: u.tenantId as string, status: 'Active' },
    orderBy: { name: 'asc' },
    include: {
      wagePayments: {
        orderBy: { date: 'desc' }
      },
      assignedJobs: {
        where: {
          status: { not: 'DRAFT' }
        },
        select: {
          id: true,
          createdAt: true
        }
      },
      _count: {
        select: { assignedJobs: true }
      }
    }
  })

  // Fetch all recent wage payments for the history log
  const recentPayments = await prisma.wagePayment.findMany({
    where: { tenantId: u.tenantId as string },
    orderBy: { date: 'desc' },
    take: 50,
    include: { employee: true }
  })

  const tenant = await prisma.tenant.findUnique({ where: { id: u.tenantId as string } })

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Wage Payments</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Manage and record salary and wage payouts for your active employees.</p>
      </div>
      <WageManagerClient 
        employees={employees} 
        recentPayments={recentPayments} 
        currency={tenant?.currency || '$'} 
      />
    </div>
  )
}
