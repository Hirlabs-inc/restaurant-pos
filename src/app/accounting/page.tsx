import prisma from '@/lib/prisma';
import AccountingManager from '@/components/AccountingManager';
import { auth } from '../../../auth';
export const dynamic = 'force-dynamic';

export default async function AccountingPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || (!user.tenantId && user.role !== 'superadmin')) return <div>No store assigned.</div>
  const tId = user.tenantId

  // Total Revenue comes from all paid amounts across all orders
  const allOrders = await prisma.order.findMany({
    where: { tenantId: tId },
    select: { paidAmount: true, paymentMethod: true, createdAt: true }
  });
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.paidAmount, 0);

  const expenses = await prisma.expense.findMany({
    where: { tenantId: tId },
    orderBy: { date: 'desc' }
  });
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const paymentMethods = await prisma.paymentMethod.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  const transfers = await prisma.transfer.findMany({ where: { tenantId: tId }, orderBy: { date: 'desc' } });

  const tenant = await prisma.tenant.findUnique({ where: { id: tId } });
  const currency = tenant?.currency || '$';

  return (
    <div className="main-content">
      <h1 className="page-title">Accounting</h1>
      <p style={{ color: 'var(--text-muted)' }}>Financial overview, profit & loss, and expenses.</p>
      
      <AccountingManager 
        totalRevenue={totalRevenue} 
        totalExpenses={totalExpenses} 
        initialExpenses={expenses} 
        allOrders={allOrders}
        paymentMethods={paymentMethods}
        transfers={transfers}
        currency={currency}
        tenant={tenant}
      />
    </div>
  );
}

