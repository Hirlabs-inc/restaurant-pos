import prisma from '@/lib/prisma';
import FulfillmentManager from '@/components/FulfillmentManager';
import { auth } from '../../../auth';
export const dynamic = 'force-dynamic';

export default async function FulfillmentPage() {
  const session = await auth()
  const user = session?.user as any
  if (!user || (!user.tenantId && user.role !== 'superadmin')) return <div>No store assigned.</div>
  const tId = user.tenantId

  const tenant = await prisma.tenant.findUnique({ where: { id: tId } });
  if (!tenant) return <div>No tenant found.</div>;

  const options = await prisma.fulfillmentOption.findMany({
    where: { tenantId: tenant.id },
    orderBy: { name: 'asc' }
  });

  return <FulfillmentManager initialOptions={options} currency={tenant.currency || '$'} />;
}

