import { auth } from '../../../../auth'
import prisma from '@/lib/prisma'
import RoleManagerClient from '../../../components/RoleManagerClient'
import { redirect } from 'next/navigation'

export default async function RolesPage() {
  const session = await auth()
  const u = session?.user as any
  if (!u || u.role !== 'admin') redirect('/')

  const roles = await prisma.role.findMany({ where: { tenantId: u.tenantId } })

  return (
    <div className="main-content">
      <h1 className="page-title">Role Management</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Create custom roles and specify which modules they have access to.
      </p>
      <RoleManagerClient initialRoles={roles} tenantId={u.tenantId} />
    </div>
  )
}
