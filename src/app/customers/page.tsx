import prisma from '@/lib/prisma';
import CustomerManager from '@/components/CustomerManager';
import { auth } from '../../../auth';
export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (!user.tenantId && user.role !== 'superadmin')) return <div>No store assigned.</div>
  const tId = user.tenantId

  // Fetch all customers with order aggregation
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: tId,
      name: { notIn: ['Walk-in', 'Walk in', 'walk-in', 'walk in', 'Walk In', 'Walkin', 'walkin'] }
    },  // hide all walk-in variants
    include: {
      orders: {
        select: {
          totalPrice: true,
          dueAmount: true,
          paidAmount: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
        }
      },
      _count: { select: { orders: true } }
    },
    orderBy: { name: 'asc' }
  });

  const tenant = await prisma.tenant.findUnique({ where: { id: tId } });
  const currency = tenant?.currency || '$';

  const totalReceivables = customers.reduce((sum, c) => {
    return sum + c.orders.reduce((s, o) => s + o.dueAmount, 0);
  }, 0);

  return (
    <div className="main-content">
      <h1 className="page-title">Customers</h1>
      <p style={{ color: 'var(--text-muted)' }}>Manage customer accounts and outstanding balances.</p>

      {/* Summary cards */}
      <div className="services-grid" style={{ marginTop: '24px', marginBottom: '32px' }}>
        <div className="service-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Customers</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px' }}>{customers.length}</div>
        </div>
        <div className="service-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Receivables</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#D97706' }}>{currency}{totalReceivables.toFixed(2)}</div>
        </div>
        <div className="service-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Customers with Balance</div>
          <div style={{ fontSize: '26px', fontWeight: 700, marginTop: '4px', color: '#DC2626' }}>
            {customers.filter(c => c.orders.some(o => o.dueAmount > 0)).length}
          </div>
        </div>
      </div>

      <CustomerManager initialCustomers={customers} currency={currency} userRole={user.role} />
    </div>
  );
}

