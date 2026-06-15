'use server'

import prisma from '@/lib/prisma'
import { auth } from '../../auth'
import { promises as fs } from 'fs'
import path from 'path'

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role === 'cashier') {
    throw new Error('Unauthorized: Cashiers cannot delete data.');
  }
}

async function getActiveTenantId(user: any): Promise<string> {
  if (!user) throw new Error('Unauthorized');
  let tId = user.tenantId;
  if (user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { tenantId: true }
    });
    if (dbUser?.tenantId) {
      tId = dbUser.tenantId;
    }
  }
  if (!tId) throw new Error('No store assigned.');
  return tId;
}

export async function createOrder(
  cart: any[],
  total: number,
  tax: number,
  subtotal: number,
  paymentMethod: 'CASH' | 'RECEIVABLE' = 'CASH',
  customerId?: string,
  options?: {
    notes?: string,
    fulfillment?: string,
    deliveryFee?: number,
    tableNumber?: string,
    scheduledDate?: Date | string | null,
    isDraft?: boolean
  }
) {
  if (!cart || cart.length === 0) return { success: false, error: 'Cart is empty' }

  try {
    const session = await auth();
    const user = session?.user as any;
    const tId = await getActiveTenantId(user);

    // 2. Resolve customer – use provided ID or fall back to Walk-in
    let resolvedCustomerId = customerId
    if (!resolvedCustomerId) {
      let walkIn = await prisma.customer.findFirst({
        where: { tenantId: tId, name: 'Walk-in' }
      })
      if (!walkIn) {
        walkIn = await prisma.customer.create({
          data: { tenantId: tId, name: 'Walk-in' }
        })
      }
      resolvedCustomerId = walkIn.id
    }

    // 3. Ensure the menu items exist in the DB (for foreign key relations)
    for (const item of cart) {
      let menuItem = await prisma.menuItem.findFirst({
        where: { tenantId: tId, name: item.name }
      })
      if (!menuItem) {
        menuItem = await prisma.menuItem.create({
          data: {
            tenantId: tId,
            name: item.name,
            priceType: 'item',
            price: item.price
          }
        })
      }
      item.dbMenuItemId = menuItem.id
    }

    // 4. Create the Order and its OrderItems
    const orderNumber = 'ORD-' + Math.floor(10000 + Math.random() * 90000)
    const isReceivable = paymentMethod === 'RECEIVABLE'

    const order = await prisma.order.create({
      data: {
        tenantId: tId,
        orderNumber,
        customerId: resolvedCustomerId,
        userId: user.id,
        status: options?.isDraft ? 'DRAFT' : 'PENDING',
        paymentMethod,
        totalPrice: total,
        dueAmount: isReceivable ? total : 0,
        paidAmount: isReceivable ? 0 : total,
        notes: options?.notes,
        fulfillment: options?.fulfillment || 'DINE_IN',
        deliveryFee: options?.deliveryFee || 0,
        tableNumber: options?.tableNumber || null,
        scheduledDate: options?.scheduledDate ? new Date(options.scheduledDate) : null,
        orderItems: {
          create: cart.map(item => ({
            tenantId: tId,
            menuItemId: item.dbMenuItemId,
            quantity: item.qty,
            price: item.price,
            subtotal: item.price * item.qty
          }))
        }
      }
    })

    return { success: true, orderId: order.id, orderNumber: order.orderNumber }
  } catch (error: any) {
    console.error('Failed to create order:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteOrderAction(id: string) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user) throw new Error('Unauthorized');

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return { success: false, error: 'Order not found' };

    if (user.role === 'cashier' && order.status !== 'DRAFT') {
      throw new Error('Unauthorized: Cashiers cannot delete confirmed orders.');
    }

    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete order:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      throw new Error('Unauthorized');
    }

    await prisma.order.update({
      where: { id },
      data: { status }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    return { success: false, error: error.message };
  }
}

export async function assignOrderAction(orderId: string, assignedToId: string | null) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    await prisma.order.update({
      where: { id: orderId },
      data: { assignedToId }
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getCustomers() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) return [];
    
    return await prisma.customer.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: 'asc' }
    })
  } catch {
    return []
  }
}

export async function createCustomerAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    const tId = await getActiveTenantId(user);
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string || null
    const email = formData.get('email') as string || null
    const address = formData.get('address') as string || null
    const notes = formData.get('notes') as string || null

    const customer = await prisma.customer.create({
      data: { tenantId: tId, name, phone, email, address, notes }
    })
    return { success: true, customer }
  } catch (error: any) {
    console.error('Failed to create customer:', error)
    return { success: false, error: error.message }
  }
}

export async function updateCustomerAction(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string || null;
    const email = formData.get('email') as string || null;
    const address = formData.get('address') as string || null;
    const notes = formData.get('notes') as string || null;

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone, email, address, notes }
    });
    return { success: true, customer };
  } catch (error: any) {
    console.error('Failed to update customer:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    await requireAdmin();
    // Check if customer has orders
    const count = await prisma.order.count({ where: { customerId: id } });
    if (count > 0) return { success: false, error: 'Cannot delete customer with existing orders.' };
    
    await prisma.customer.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete customer:', error);
    return { success: false, error: error.message };
  }
}

export async function recordPaymentAction(customerId: string, amount: number) {
  try {
    // Get all unpaid receivable orders for this customer, oldest first
    const unpaidOrders = await prisma.order.findMany({
      where: {
        customerId,
        paymentMethod: 'RECEIVABLE',
        dueAmount: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (unpaidOrders.length === 0) return { success: false, error: 'No outstanding balance found.' }

    let remaining = amount
    for (const order of unpaidOrders) {
      if (remaining <= 0) break
      const paying = Math.min(remaining, order.dueAmount)
      const newDue = order.dueAmount - paying
      const newPaid = order.paidAmount + paying
      await prisma.order.update({
        where: { id: order.id },
        data: {
          dueAmount: newDue,
          paidAmount: newPaid
        }
      })
      remaining -= paying
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to record payment:', error)
    return { success: false, error: error.message }
  }
}

export async function createMenuItemAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    const tId = await getActiveTenantId(user);

    const name = formData.get('name') as string
    const category = formData.get('category') as string || 'Main Course'
    const price = parseFloat(formData.get('price') as string)
    const icon = formData.get('icon') as string || '/pizza.png'
    const image = formData.get('image') as string || null

    await prisma.menuItem.create({
      data: {
        tenantId: tId,
        name,
        category,
        price,
        priceType: 'item',
        icon,
        image
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to create menu item:', error)
    return { success: false, error: error.message }
  }
}

export async function updateMenuItemAction(id: string, formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('No store assigned.');
    
    await requireAdmin();

    const name = formData.get('name') as string
    const category = formData.get('category') as string || 'Main Course'
    const price = parseFloat(formData.get('price') as string)
    const icon = formData.get('icon') as string || '/pizza.png'
    const image = formData.get('image') as string || null
    const removeImage = formData.get('removeImage') === 'true'

    await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        category,
        price,
        icon,
        ...(removeImage ? { image: null } : image ? { image } : {})
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update menu item:', error)
    return { success: false, error: error.message }
  }
}

export async function createCategoryAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    const tId = await getActiveTenantId(user);

    const name = formData.get('name') as string
    const emoji = formData.get('emoji') as string || '📁'

    await prisma.category.create({
      data: {
        tenantId: tId,
        name,
        emoji
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to create category:', error)
    return { success: false, error: error.message }
  }
}

export async function updateStoreAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user) throw new Error('Unauthorized.');

    let tId = user.tenantId;
    if (user.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { tenantId: true }
      });
      if (dbUser?.tenantId) {
        tId = dbUser.tenantId;
      }
    }
    if (!tId) throw new Error('No store assigned.');

    const name = formData.get('name') as string
    const taxRate = parseFloat(formData.get('taxRate') as string)
    const currency = formData.get('currency') as string || '$'
    const logo = formData.get('logo') as string || null
    const address = formData.get('address') as string || null
    const phone = formData.get('phone') as string || null

    console.log('UPDATING STORE:', { name, taxRate, currency, address, phone, logo });

    const oldLogo = (await prisma.tenant.findUnique({ where: { id: tId } }))?.logo || '';

    // Using raw query because Prisma Client generation is locked by the running server
    await prisma.$executeRaw`
      UPDATE Tenant 
      SET name = ${name}, 
          taxRate = ${taxRate}, 
          currency = ${currency}, 
          address = ${address || ''}, 
          phone = ${phone || ''}, 
          logo = ${logo || oldLogo} 
      WHERE id = ${tId}
    `;

    return { success: true }
  } catch (error: any) {
    console.error('Failed to update store:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteMenuItemAction(id: string) {
  try {
    await requireAdmin();
    await prisma.menuItem.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete menu item:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await requireAdmin();
    await prisma.category.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete category:', error)
    return { success: false, error: error.message }
  }
}

export async function createFulfillmentOptionAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('No store assigned.');
    const tId = user.tenantId;

    const name = formData.get('name') as string
    const defaultFee = parseFloat(formData.get('defaultFee') as string) || 0

    await prisma.fulfillmentOption.create({
      data: { tenantId: tId, name, defaultFee }
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to create option:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteFulfillmentOptionAction(id: string) {
  try {
    await requireAdmin();
    await prisma.fulfillmentOption.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete option:', error)
    return { success: false, error: error.message }
  }
}

export async function updateFulfillmentOptionAction(id: string, formData: FormData) {
  try {
    await requireAdmin();
    const name = formData.get('name') as string
    const defaultFee = parseFloat(formData.get('defaultFee') as string) || 0
    await prisma.fulfillmentOption.update({
      where: { id },
      data: { name, defaultFee }
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to update option:', error)
    return { success: false, error: error.message }
  }
}

export async function createExpenseAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('No store assigned.');
    const tId = user.tenantId;

    const amount = parseFloat(formData.get('amount') as string)
    const category = formData.get('category') as string || 'General'
    const paymentMethod = formData.get('paymentMethod') as string || 'Cash'
    const description = formData.get('description') as string || null
    const dateStr = formData.get('date') as string
    const date = dateStr ? new Date(dateStr) : new Date()

    const expense = await prisma.expense.create({
      data: { tenantId: tId, amount, category, paymentMethod, description, date }
    })
    return { success: true, expense }
  } catch (error: any) {
    console.error('Failed to create expense:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    await requireAdmin();
    await prisma.expense.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete expense:', error)
    return { success: false, error: error.message }
  }
}

export async function createPaymentMethodAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('No store assigned.');
    const tId = user.tenantId;
    const name = formData.get('name') as string
    if (!name.trim()) return { success: false, error: 'Name is required' }
    
    await prisma.paymentMethod.create({
      data: { tenantId: tId, name }
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to create payment method:', error)
    return { success: false, error: error.message }
  }
}

export async function deletePaymentMethodAction(id: string) {
  try {
    await requireAdmin();
    await prisma.paymentMethod.delete({ where: { id } })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete payment method:', error)
    return { success: false, error: error.message }
  }
}

export async function createTransferAction(formData: FormData) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('No store assigned.');
    const tId = user.tenantId;
    
    const fromMethod = formData.get('fromMethod') as string
    const toMethod = formData.get('toMethod') as string
    const amount = parseFloat(formData.get('amount') as string)
    
    if (amount <= 0) return { success: false, error: 'Amount must be greater than 0' }
    if (fromMethod === toMethod) return { success: false, error: 'Cannot transfer to the same method' }
    
    await prisma.transfer.create({
      data: { tenantId: tId, fromMethod, toMethod, amount }
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to create transfer:', error)
    return { success: false, error: error.message }
  }
}

export async function uploadFileAction(_formData: FormData) {
  return { success: false, error: 'File uploads are currently unavailable in the demo. Please configure external storage (R2/S3) for production use.' };
}

export async function getCustomerInvoicesAction(customerId: string) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    
    const orders = await prisma.order.findMany({
      where: { customerId, tenantId: user.tenantId, status: { not: 'DRAFT' } },
      include: {
        orderItems: {
          include: { menuItem: true }
        },
        customer: true,
        user: true,
        tenant: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, orders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- EMPLOYEES ---
export async function createEmployeeAction(formData: FormData) {
  try {
    const session = await auth()
    const user = session?.user as any
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' }
    const tId = user.tenantId
    await prisma.employee.create({
      data: {
        tenantId: tId,
        name: formData.get('name') as string,
        phone: (formData.get('phone') as string) || null,
        role: (formData.get('role') as string) || 'Waiter',
        status: (formData.get('status') as string) || 'Active',
        wageType: (formData.get('wageType') as string) || 'Monthly',
        wageAmount: parseFloat(formData.get('wageAmount') as string) || 0,
        cvUrl: (formData.get('cvUrl') as string) || null,
        idUrl: (formData.get('idUrl') as string) || null,
      }
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateEmployeeAction(id: string, formData: FormData) {
  try {
    const session = await auth()
    const user = session?.user as any
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' }
    await prisma.employee.update({
      where: { id, tenantId: user.tenantId },
      data: {
        name: formData.get('name') as string,
        phone: (formData.get('phone') as string) || null,
        role: (formData.get('role') as string) || 'Waiter',
        status: (formData.get('status') as string) || 'Active',
        wageType: (formData.get('wageType') as string) || 'Monthly',
        wageAmount: parseFloat(formData.get('wageAmount') as string) || 0,
        cvUrl: (formData.get('cvUrl') as string) || null,
        idUrl: (formData.get('idUrl') as string) || null,
      }
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteEmployeeAction(id: string) {
  try {
    const session = await auth()
    const user = session?.user as any
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' }
    await prisma.employee.delete({
      where: { id, tenantId: user.tenantId }
    })
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function recordWagePaymentAction(employeeId: string, amount: number, notes: string) {
  try {
    const session = await auth()
    const user = session?.user as any
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' }
    const tId = user.tenantId
    
    // Create the wage payment record
    const payment = await prisma.wagePayment.create({
      data: {
        tenantId: tId,
        employeeId,
        amount,
        notes
      }
    })
    
    // Automatically create an Expense record for P&L tracking
    await prisma.expense.create({
      data: {
        tenantId: tId,
        category: 'Payroll',
        amount,
        date: new Date()
      }
    })
    
    return { success: true, paymentId: payment.id }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function recordBulkSalariesPaymentAction(payments: { employeeId: string, amount: number, notes: string }[]) {
  try {
    const session = await auth()
    const user = session?.user as any
    if (!user || !user.tenantId) return { success: false, error: 'Unauthorized' }
    const tId = user.tenantId

    await prisma.$transaction(
      payments.map(p => [
        prisma.wagePayment.create({
          data: {
            tenantId: tId,
            employeeId: p.employeeId,
            amount: p.amount,
            notes: p.notes
          }
        }),
        prisma.expense.create({
          data: {
            tenantId: tId,
            category: 'Payroll',
            amount: p.amount,
            date: new Date()
          }
        })
      ]).flat()
    )

    return { success: true }
  } catch (e: any) {
    console.error('Failed bulk salaries payment:', e)
    return { success: false, error: e.message }
  }
}

export async function exportMenuItemsAction() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const tenantId = user.tenantId;

    const menuItems = await prisma.menuItem.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: menuItems };
  } catch (error: any) {
    console.error('Failed to export menu items:', error);
    return { success: false, error: error.message };
  }
}

export async function exportCustomersAction() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const tenantId = user.tenantId;

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: customers };
  } catch (error: any) {
    console.error('Failed to export customers:', error);
    return { success: false, error: error.message };
  }
}

export async function exportEmployeesAction() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const tenantId = user.tenantId;

    const employees = await prisma.employee.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    return { success: true, data: employees };
  } catch (error: any) {
    console.error('Failed to export employees:', error);
    return { success: false, error: error.message };
  }
}

export async function exportOrdersAction() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const tenantId = user.tenantId;

    const orders = await prisma.order.findMany({
      where: { tenantId },
      include: {
        customer: true,
        assignedTo: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, data: orders };
  } catch (error: any) {
    console.error('Failed to export orders:', error);
    return { success: false, error: error.message };
  }
}

export async function importMenuItemsCSVAction(menuItems: any[]) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const tenantId = user.tenantId;

    await prisma.$transaction(async (tx) => {
      for (const item of menuItems) {
        const name = item.Name || item.name;
        if (!name) continue;

        const category = item.Category || item.category || 'Main Course';
        const price = parseFloat(item.Price || item.price) || 0;
        const priceType = item.PriceType || item.priceType || 'item';
        const icon = item.Icon || item.icon || null;

        // Auto-create category if it does not exist
        let categoryObj = await tx.category.findFirst({
          where: { tenantId, name: category }
        });
        if (!categoryObj) {
          await tx.category.create({
            data: {
              tenantId,
              name: category,
              emoji: '🍴'
            }
          });
        }

        const existing = await tx.menuItem.findFirst({
          where: { tenantId, name }
        });

        if (existing) {
          await tx.menuItem.update({
            where: { id: existing.id },
            data: { category, price, priceType, icon }
          });
        } else {
          await tx.menuItem.create({
            data: { tenantId, name, category, price, priceType, icon }
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to import menu items:', error);
    return { success: false, error: error.message };
  }
}

export async function importCustomersCSVAction(customers: any[]) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const tenantId = user.tenantId;

    await prisma.$transaction(async (tx) => {
      for (const cust of customers) {
        const name = cust.Name || cust.name;
        if (!name) continue;

        const phone = cust.Phone || cust.phone || null;
        const email = cust.Email || cust.email || null;
        const address = cust.Address || cust.address || null;
        const notes = cust.Notes || cust.notes || null;

        const existing = await tx.customer.findFirst({
          where: { tenantId, name }
        });

        if (existing) {
          await tx.customer.update({
            where: { id: existing.id },
            data: { phone, email, address, notes }
          });
        } else {
          await tx.customer.create({
            data: { tenantId, name, phone, email, address, notes }
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to import customers:', error);
    return { success: false, error: error.message };
  }
}

export async function importEmployeesCSVAction(employees: any[]) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user || !user.tenantId) throw new Error('Unauthorized');
    const tenantId = user.tenantId;

    await prisma.$transaction(async (tx) => {
      for (const emp of employees) {
        const name = emp.Name || emp.name;
        if (!name) continue;

        const phone = emp.Phone || emp.phone || null;
        const role = emp.Role || emp.role || 'Waiter';
        const status = emp.Status || emp.status || 'Active';
        const wageType = emp.WageType || emp.wageType || 'Monthly';
        const wageAmount = parseFloat(emp.WageAmount || emp.wageAmount) || 0;

        const existing = await tx.employee.findFirst({
          where: { tenantId, name }
        });

        if (existing) {
          await tx.employee.update({
            where: { id: existing.id },
            data: { phone, role, status, wageType, wageAmount }
          });
        } else {
          await tx.employee.create({
            data: { tenantId, name, phone, role, status, wageType, wageAmount }
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to import employees:', error);
    return { success: false, error: error.message };
  }
}
