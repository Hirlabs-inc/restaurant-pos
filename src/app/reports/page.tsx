import prisma from '@/lib/prisma'
import { auth } from '../../../auth'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'

export default async function ReportsPage(props: any) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === 'string' ? searchParams.q : '';

  const session = await auth()
  const user = session?.user as any
  if (!user) return redirect('/login')

  const isSuperAdmin = user.role === 'superadmin'
  const tId = user.tenantId
  
  if (!isSuperAdmin && !tId) return <div>No store assigned.</div>

  const tenants = tId ? await prisma.$queryRaw<any[]>`SELECT * FROM Tenant WHERE id = ${tId} LIMIT 1` : [];
  const tenant = tenants[0] || null;
  const currency = tenant?.currency || '$'

  const recentOrders = await prisma.order.findMany({
    where: { 
      ...(isSuperAdmin ? {} : { tenantId: tId }),
      ...(q ? { orderNumber: { contains: q } } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: q ? 50 : 10,
    include: { 
      customer: true, 
      tenant: true, 
      user: true,
      orderItems: {
        include: { menuItem: true }
      }
    }
  })

  return (
    <div className="main-content">
      <h1 className="page-title">Recent Transactions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>View your latest orders and sales performance.</p>
      
      <form action="/reports" method="GET" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          name="q" 
          defaultValue={q} 
          placeholder="Search by Order #..." 
          style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dark)', background: 'var(--bg-surface)', width: '300px', fontSize: '14px' }} 
          autoFocus
        />
        <button type="submit" style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Search
        </button>
        {q && (
          <a href="/reports" style={{ padding: '12px 24px', background: 'var(--bg-surface)', color: 'var(--text-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dark)', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>
            Clear
          </a>
        )}
      </form>

      <div style={{ marginTop: '12px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-main)' }}>
              {isSuperAdmin && <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Store</th>}
              <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Order #</th>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date</th>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Amount</th>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Payment</th>
              <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(o => {
              const subtotal = o.orderItems.reduce((acc, item) => acc + item.subtotal, 0);
              const taxAmount = o.totalPrice - subtotal - (o.deliveryFee || 0);
              const taxRate = subtotal > 0 ? Math.round((taxAmount / subtotal) * 100) : (o.tenant?.taxRate || 10);

              return (
              <tr key={o.id} className="table-row-hover">
                {isSuperAdmin && (
                  <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600 }}>
                    {o.tenant?.name}
                  </td>
                )}
                <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontWeight: 600, fontSize: '14px' }}>{o.orderNumber}</td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>{o.customer.name}</td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleString()}</td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>{o.tenant?.currency || currency}{o.totalPrice.toFixed(2)}</td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    background: o.paymentMethod === 'RECEIVABLE' ? '#FEF3C7' : '#DCFCE7',
                    color: o.paymentMethod === 'RECEIVABLE' ? '#92400E' : '#166534'
                  }}>
                    {o.paymentMethod === 'RECEIVABLE' ? 'LATER' : o.paymentMethod}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)' }}>
                  <PrintReceiptButton 
                    order={{
                      ...o,
                      subtotal,
                      taxAmount
                    }}
                    storeName={o.tenant?.name || tenant?.name || 'Restaurant Store'}
                    storeLogo={o.tenant?.logo || undefined}
                    storeAddress={o.tenant?.address || tenant?.address || undefined}
                    storePhone={o.tenant?.phone || tenant?.phone || undefined}
                    currency={o.tenant?.currency || currency}
                    taxRate={taxRate}
                  />
                </td>
              </tr>
            )})}
            {recentOrders.length === 0 && (
              <tr><td colSpan={isSuperAdmin ? 7 : 6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Add imports
import PrintReceiptButton from '@/components/PrintReceiptButton'

