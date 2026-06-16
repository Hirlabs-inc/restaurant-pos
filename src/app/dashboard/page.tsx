import prisma from '@/lib/prisma'
import { auth } from '../../../auth'
import { AssignJobWidget } from '../../components/AssignJobWidget'
import { CompleteJobWidget } from '../../components/CompleteJobWidget'
import { CurrencyDollar, ShoppingCart, Calendar, Users, Wallet, Coins, CreditCard, TrendUp, TrendDown } from '@phosphor-icons/react/dist/ssr'
export const dynamic = 'force-dynamic'

function formatCurrency(n: number, curr: string) {
  return curr + n.toFixed(2)
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || (!user.tenantId && user.role !== 'superadmin')) return <div>No store assigned.</div>
  const tId = user.tenantId

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const tenant = await prisma.tenant.findUnique({ where: { id: tId } })
  const storeName = tenant?.name || 'Restaurant'
  const currency = tenant?.currency || '$'

  const userModules = user?.modules ? JSON.parse(user.modules) as string[] : []
  const hasWidget = (key: string) => {
    if (user.role === 'admin' || user.role === 'superadmin') return true
    return userModules.includes(key)
  }

  // --- KPI data ---
  const [todayOrders, yesterdayOrders, weekOrders, monthOrders, allOrders, allCustomers, monthExpenseRecords, employees, unassignedOrders, assignedOrders] = await Promise.all([
    prisma.order.findMany({ where: { tenantId: tId, createdAt: { gte: todayStart } } }),
    prisma.order.findMany({ where: { tenantId: tId, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.order.findMany({ where: { tenantId: tId, createdAt: { gte: weekStart } } }),
    prisma.order.findMany({ where: { tenantId: tId, createdAt: { gte: monthStart } } }),
    prisma.order.findMany({ where: { tenantId: tId }, orderBy: { createdAt: 'desc' }, take: 8, include: { customer: true } }),
    prisma.customer.count({ where: { tenantId: tId, name: { not: 'Walk-in' } } }),
    prisma.expense.findMany({ where: { tenantId: tId, date: { gte: monthStart } } }),
    prisma.employee.findMany({
      where: { tenantId: tId, status: 'Active' },
      select: {
        id: true,
        name: true,
        role: true,
        assignedJobs: {
          where: { status: { notIn: ['COMPLETED', 'DRAFT'] } },
          select: { id: true }
        }
      }
    }),
    prisma.order.findMany({ where: { tenantId: tId, assignedToId: null, status: { in: ['PENDING', 'PROCESSING'] } }, include: { customer: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.order.findMany({
      where: {
        tenantId: tId,
        assignedToId: { not: null },
        status: { in: ['PENDING', 'PROCESSING', 'READY'] }
      },
      include: {
        customer: true,
        assignedTo: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
  ])

  const todayRevenue  = todayOrders.reduce((s, o) => s + o.paidAmount, 0)
  const yestRevenue   = yesterdayOrders.reduce((s, o) => s + o.paidAmount, 0)
  const weekRevenue   = weekOrders.reduce((s, o) => s + o.paidAmount, 0)
  const monthRevenue  = monthOrders.reduce((s, o) => s + o.paidAmount, 0)
  const monthExpenses = monthExpenseRecords.reduce((s, e) => s + e.amount, 0)
  const monthProfit   = monthRevenue - monthExpenses
  const todayTxCount  = todayOrders.length
  const yestTxCount   = yesterdayOrders.length

  // Receivables
  const receivableOrders = await prisma.order.findMany({
    where: { tenantId: tId, paymentMethod: 'RECEIVABLE', dueAmount: { gt: 0 } },
    include: { customer: true }
  })
  const totalReceivables = receivableOrders.reduce((s, o) => s + o.dueAmount, 0)

  // Top menu items
  const orderItems = await prisma.orderItem.findMany({
    include: { menuItem: true },
    where: { tenantId: tId, order: { createdAt: { gte: monthStart } } }
  })
  const menuItemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  for (const item of orderItems) {
    const key = item.menuItemId || 'unknown'
    if (!menuItemMap[key]) menuItemMap[key] = { name: item.menuItem?.name || 'Unknown', qty: 0, revenue: 0 }
    menuItemMap[key].qty += item.quantity
    menuItemMap[key].revenue += item.subtotal
  }
  const topMenuItems = Object.values(menuItemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // helpers
  const revDiff = todayRevenue - yestRevenue
  const txDiff  = todayTxCount - yestTxCount
  const trendColor = (n: number) => n >= 0 ? '#10B981' : '#EF4444'
  const trendArrow = (n: number) => n >= 0 ? '▲' : '▼'

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="main-content">

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">{greeting}, {user.name?.split(' ')[0] || storeName} 👋</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Here's what's happening at <strong>{storeName}</strong> today.
          </p>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginTop: '28px' }}>
        
        {/* Today Revenue */}
        {hasWidget('widget-revenue') && (
          <div className="kpi-card kpi-revenue">
            <div className="kpi-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                  {formatCurrency(todayRevenue, currency)}
                </div>
              </div>
              <div className="kpi-icon-wrapper">
                <CurrencyDollar size={22} weight="bold" />
              </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ 
                color: revDiff >= 0 ? '#10B981' : '#EF4444', 
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                background: revDiff >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '2px 6px',
                borderRadius: '6px'
              }}>
                {revDiff >= 0 ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
                {formatCurrency(Math.abs(revDiff), currency)}
              </span>
              <span>vs yesterday</span>
            </div>
          </div>
        )}

        {/* Today Orders */}
        {hasWidget('widget-orders') && (
          <div className="kpi-card kpi-orders">
            <div className="kpi-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Today's Orders</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                  {todayTxCount}
                </div>
              </div>
              <div className="kpi-icon-wrapper">
                <ShoppingCart size={22} weight="bold" />
              </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ 
                color: txDiff >= 0 ? '#10B981' : '#EF4444', 
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                background: txDiff >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '2px 6px',
                borderRadius: '6px'
              }}>
                {txDiff >= 0 ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
                {Math.abs(txDiff)}
              </span>
              <span>vs yesterday</span>
            </div>
          </div>
        )}

        {/* This Month Revenue */}
        {hasWidget('widget-revenue') && (
          <div className="kpi-card kpi-profit">
            <div className="kpi-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Month's Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                  {formatCurrency(monthRevenue, currency)}
                </div>
              </div>
              <div className="kpi-icon-wrapper">
                <Calendar size={22} weight="bold" />
              </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{monthOrders.length}</span> orders this month
            </div>
          </div>
        )}

        {/* This Month Expenses */}
        {hasWidget('widget-expenses') && (
          <div className="kpi-card kpi-expenses">
            <div className="kpi-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Month's Expenses</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                  {formatCurrency(monthExpenses, currency)}
                </div>
              </div>
              <div className="kpi-icon-wrapper">
                <Wallet size={22} weight="bold" />
              </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{monthExpenseRecords.length}</span> expense records
            </div>
          </div>
        )}

        {/* This Month Profit */}
        {hasWidget('widget-revenue') && (
          <div className={`kpi-card ${monthProfit >= 0 ? 'kpi-revenue' : 'kpi-expenses'}`}>
            <div className="kpi-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Month's Net Profit</div>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 800, 
                  marginTop: '8px', 
                  color: monthProfit >= 0 ? '#10B981' : '#EF4444', 
                  letterSpacing: '-0.5px' 
                }}>
                  {monthProfit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(monthProfit), currency)}
                </div>
              </div>
              <div className="kpi-icon-wrapper">
                <Coins size={22} weight="bold" />
              </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-muted)' }}>
              Revenue - Expenses
            </div>
          </div>
        )}

        {/* Customers */}
        {hasWidget('widget-customers') && (
          <div className="kpi-card kpi-customers">
            <div className="kpi-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Customers</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                  {allCustomers}
                </div>
              </div>
              <div className="kpi-icon-wrapper">
                <Users size={22} weight="bold" />
              </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-muted)' }}>
              Registered accounts
            </div>
          </div>
        )}

        {/* Receivables */}
        {hasWidget('widget-receivables') && (
          <div className="kpi-card kpi-receivables" style={{
            background: totalReceivables > 0 ? 'color-mix(in srgb, #F59E0B 4%, var(--bg-surface))' : undefined
          }}>
            <div className="kpi-header">
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Receivables</div>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: 800, 
                  marginTop: '8px', 
                  color: totalReceivables > 0 ? '#D97706' : 'var(--text-main)', 
                  letterSpacing: '-0.5px' 
                }}>
                  {formatCurrency(totalReceivables, currency)}
                </div>
              </div>
              <div className="kpi-icon-wrapper">
                <CreditCard size={22} weight="bold" />
              </div>
            </div>
            <div style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600, color: totalReceivables > 0 ? '#B45309' : 'var(--text-main)' }}>{receivableOrders.length}</span> unpaid order{receivableOrders.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* ── Two-column lower section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginTop: '24px', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Unassigned Jobs / Assign Jobs */}
          {hasWidget('widget-assign-jobs') && (
            <div style={{ background: 'var(--accent-green-bg)', border: '1px solid var(--accent-green-border)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--accent-green-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-green-text)' }}>Unassigned Orders (Needs Assignment)</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    {['Order #', 'Customer', 'Status', 'Assign To'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--accent-green-text)', fontWeight: 600, borderBottom: '1px solid var(--accent-green-border)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unassignedOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-green-border)', fontWeight: 700, fontSize: '13px', color: 'var(--accent-green-dark)' }}>{o.orderNumber}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-green-border)', fontSize: '13px', color: 'var(--accent-green-dark)' }}>{o.customer.name}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-green-border)' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: 'var(--accent-green-badge)', color: 'var(--accent-green-text)' }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-green-border)' }}>
                        <AssignJobWidget order={o} staff={employees} />
                      </td>
                    </tr>
                  ))}
                  {unassignedOrders.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--accent-green-text)' }}>All orders have been assigned!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Assigned Jobs (In Progress) */}
          {hasWidget('widget-assigned-jobs') && (
            <div style={{ background: 'var(--accent-blue-bg)', border: '1px solid var(--accent-blue-border)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--accent-blue-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-blue-text)' }}>Assigned Orders (In Progress)</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    {['Order #', 'Customer', 'Assigned To', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--accent-blue-text)', fontWeight: 600, borderBottom: '1px solid var(--accent-blue-border)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignedOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-blue-border)', fontWeight: 700, fontSize: '13px', color: 'var(--accent-blue-dark)' }}>{o.orderNumber}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-blue-border)', fontSize: '13px', color: 'var(--accent-blue-dark)' }}>{o.customer.name}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-blue-border)', fontSize: '13px', color: 'var(--accent-blue-dark)', fontWeight: 500 }}>
                        {o.assignedTo?.name || 'Assigned'}
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-blue-border)' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: 'var(--accent-blue-badge)', color: 'var(--accent-blue-text)' }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--accent-blue-border)' }}>
                        <CompleteJobWidget order={o} />
                      </td>
                    </tr>
                  ))}
                  {assignedOrders.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--accent-blue-text)' }}>No assigned orders in progress.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent orders table */}
          {hasWidget('widget-recent-orders') && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Orders</h3>
                <a href="/reports" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-main)' }}>
                    {['Order #', 'Customer', 'Amount', 'Method', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: '13px' }}>{o.orderNumber}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>{o.customer.name}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 600, fontSize: '13px' }}>{formatCurrency(o.totalPrice, currency)}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                          background: o.paymentMethod === 'RECEIVABLE' ? '#FEF3C7' : '#D1FAE5',
                          color: o.paymentMethod === 'RECEIVABLE' ? '#92400E' : '#065F46'
                        }}>
                          {o.paymentMethod === 'RECEIVABLE' ? 'Receivable' : 'Cash'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-light)' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                          background: o.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
                          color: o.status === 'COMPLETED' ? '#065F46' : '#92400E'
                        }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {allOrders.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders yet — start by charging a customer!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Top menu items this month */}
          {hasWidget('widget-top-services') && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Top Menu Items (Month)</h3>
              {topMenuItems.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No data yet.</p>
              ) : topMenuItems.map((s, i) => {
                const maxRev = topMenuItems[0].revenue
                return (
                  <div key={s.name} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 600 }}>{i + 1}. {s.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(s.revenue, currency)}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-main)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(s.revenue / maxRev) * 100}%`, background: 'var(--primary)', borderRadius: '999px', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Unpaid receivables quick list */}
          {hasWidget('widget-receivables') && receivableOrders.length > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#92400E' }}>⚠ Unpaid Balances</h3>
              {receivableOrders.slice(0, 5).map(o => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#92400E' }}>
                  <span style={{ fontWeight: 600 }}>{o.customer.name}</span>
                  <span style={{ fontWeight: 800 }}>{formatCurrency(o.dueAmount, currency)}</span>
                </div>
              ))}
              {receivableOrders.length > 5 && (
                <a href="/customers" style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>+ {receivableOrders.length - 5} more →</a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

