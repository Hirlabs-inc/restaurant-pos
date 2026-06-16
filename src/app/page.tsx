import prisma from '@/lib/prisma';
import POSClient from '@/components/POSClient';
import { auth } from '../../auth';
export const dynamic = 'force-dynamic';

export default async function Page() {
  const session = await auth()
  const user = session?.user as any
  if (!user || (!user.tenantId && user.role !== 'superadmin')) return <div>No store assigned.</div>
  const tId = user.tenantId

  const menuItems = await prisma.menuItem.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  const categories = await prisma.category.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  const customers = await prisma.customer.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  const fulfillmentOptions = await prisma.fulfillmentOption.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  const draftOrders = await prisma.order.findMany({
    where: { tenantId: tId, status: 'DRAFT' },
    include: { orderItems: { include: { menuItem: true } }, customer: true, user: true },
    orderBy: { createdAt: 'desc' }
  });
  const paymentMethods = await prisma.paymentMethod.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  const tenants = await prisma.$queryRaw<any[]>`SELECT * FROM Tenant WHERE id = ${tId} LIMIT 1`;
  const tenant = tenants[0] || null;
  const currency = tenant?.currency || '$';
  
  return (
    <POSClient
      initialMenuItems={menuItems}
      initialCategories={categories}
      initialCustomers={customers}
      fulfillmentOptions={fulfillmentOptions}
      paymentMethods={paymentMethods}
      draftOrders={draftOrders}
      taxRate={tenant?.taxRate ?? 10}
      currency={currency}
      storeName={tenant?.name || 'Restaurant POS'}
      storeLogo={tenant?.logo || undefined}
      storeAddress={tenant?.address || undefined}
      storePhone={tenant?.phone || undefined}
      staffName={user.name}
    />
  );
}

