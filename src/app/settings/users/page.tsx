import prisma from '@/lib/prisma'
import { auth } from '../../../../auth'
import UserManagerClient from '@/components/UserManagerClient'
export const dynamic = 'force-dynamic'

export default async function UsersSettingsPage() {
  const session = await auth()
  const me = session?.user as any

  const users = await prisma.user.findMany({
    where: { tenantId: me?.tenantId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, roleId: true, customRole: { select: { name: true } }, createdAt: true },
  })

  const roles = await prisma.role.findMany({ where: { tenantId: me?.tenantId } })

  return (
    <div className="main-content">
      <h1 className="page-title">User Management</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        Manage the staff accounts for your store.
      </p>
      <UserManagerClient initialUsers={users} tenantId={me?.tenantId} currentUserId={me?.id} roles={roles} />
    </div>
  )
}
