import prisma from '@/lib/prisma';
import MenuManager from '@/components/MenuManager';
import { auth } from '../../../auth';
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || (!user.tenantId && user.role !== 'superadmin')) return <div>No store assigned.</div>
  const tId = user.tenantId

  const tenant = await prisma.tenant.findUnique({ where: { id: tId } });
  const currency = tenant?.currency || '$';

  const categories = await prisma.category.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  const menuItems = await prisma.menuItem.findMany({ where: { tenantId: tId }, orderBy: { name: 'asc' } });
  
  return <MenuManager initialMenuItems={menuItems} initialCategories={categories} currency={currency} />;
}

