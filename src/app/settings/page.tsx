import prisma from '@/lib/prisma';
import UpdateStoreForm from '@/components/UpdateStoreForm';
import PaymentMethodManager from '@/components/PaymentMethodManager';
import { auth } from '../../../auth';
import { UsersThree, Shield, Database } from '@phosphor-icons/react/dist/ssr';
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || (!user.tenantId && user.role !== 'superadmin')) return <div>No store assigned.</div>
  const tId = user.tenantId

  const tenants = await prisma.$queryRaw<any[]>`SELECT * FROM Tenant WHERE id = ${tId} LIMIT 1`;
  const tenant = tenants[0] || null;
  const paymentMethods = await prisma.paymentMethod.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });

  return (
    <div className="main-content">
      <h1 className="page-title">Settings</h1>
      <p style={{ color: 'var(--text-muted)' }}>Configure store details and taxes.</p>
      
      <div style={{ marginTop: '32px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <UpdateStoreForm tenant={tenant} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '280px' }}>
          <PaymentMethodManager initialMethods={paymentMethods} />

          {/* Backup & Data Manager */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginBottom: '8px' }}>Backup &amp; Data Manager</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Export store configurations, customer databases, and transactions to CSV, or bulk-import data.</p>
            <a href="/settings/data" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: 'var(--btn-dark)', color: 'var(--btn-dark-text)',
              borderRadius: 'var(--radius-full)', fontWeight: 600,
              fontSize: '14px', textDecoration: 'none',
            }}>
              <Database size={18} weight="bold" /> Manage CSV Data →
            </a>
          </div>

          {/* Staff Management */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginBottom: '8px' }}>Staff Management</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Manage admin and cashier accounts for your store.</p>
            <a href="/settings/users" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: 'var(--primary)', color: 'white',
              borderRadius: 'var(--radius-full)', fontWeight: 600,
              fontSize: '14px', textDecoration: 'none',
            }}>
              <UsersThree size={18} weight="bold" /> Manage Staff →
            </a>
          </div>

          {/* Role Management */}
          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginBottom: '8px' }}>Role Management</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Create custom roles and control which modules each role can access.</p>
            <a href="/settings/roles" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              background: 'var(--btn-dark)', color: 'var(--btn-dark-text)',
              borderRadius: 'var(--radius-full)', fontWeight: 600,
              fontSize: '14px', textDecoration: 'none',
            }}>
              <Shield size={18} weight="bold" /> Manage Roles →
            </a>
          </div>

          <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ marginBottom: '16px' }}>Printer Configuration</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Connect to your thermal receipt printer.</p>
            <button style={{ padding: '10px 16px', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>Connect Printer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

