const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const existing = await prisma.user.findUnique({ where: { email: 'superadmin@system.com' } })
  if (!existing) {
    const pass = process.env.SUPERADMIN_PASSWORD || 'admin1234'
    const hash = await bcrypt.hash(pass, 12)
    await prisma.user.create({
      data: { name: 'Super Admin', email: 'superadmin@system.com', password: hash, role: 'superadmin', tenantId: null }
    })
    console.log(`✅ Superadmin: superadmin@system.com / ${pass}`)
  } else {
    console.log('ℹ️  Superadmin already exists.')
  }

  // Create default plans
  const plans = [
    { name: 'Trial', maxUsers: 2, maxOrders: 50, price: 0, description: 'Limited trial for new stores' },
    { name: 'Free', maxUsers: 3, maxOrders: 100, price: 0, description: 'Basic free plan' },
    { name: 'Pro', maxUsers: 10, maxOrders: 5000, price: 29, description: 'Professional plan for growing stores' },
    { name: 'Enterprise', maxUsers: 100, maxOrders: 99999, price: 99, description: 'Unlimited power for big chains' },
  ]

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    })
  }
  console.log('✅ Default plans seeded.')

  let tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'The Gourmet Bistro',
        plan: 'trial',
        taxRate: 15.0,
        currency: '$'
      }
    })
    console.log('✅ Default restaurant tenant created:', tenant.name)
  }

  // Seed default categories
  const categories = [
    { name: 'Appetizers', emoji: '🥗' },
    { name: 'Main Courses', emoji: '🍕' },
    { name: 'Beverages', emoji: '🍹' },
    { name: 'Desserts', emoji: '🍰' }
  ]

  for (const cat of categories) {
    const existingCat = await prisma.category.findFirst({
      where: { tenantId: tenant.id, name: cat.name }
    })
    if (!existingCat) {
      await prisma.category.create({
        data: {
          tenantId: tenant.id,
          name: cat.name,
          emoji: cat.emoji
        }
      })
    }
  }
  console.log('✅ Restaurant categories seeded.')

  // Seed default menu items
  const menuItems = [
    { name: 'Garlic Bread', category: 'Appetizers', price: 5.99, icon: 'ForkKnife' },
    { name: 'Caesar Salad', category: 'Appetizers', price: 8.99, icon: 'ForkKnife' },
    { name: 'Margherita Pizza', category: 'Main Courses', price: 12.99, icon: 'Pizza' },
    { name: 'Gourmet Burger', category: 'Main Courses', price: 10.99, icon: 'Hamburger' },
    { name: 'Pasta Carbonara', category: 'Main Courses', price: 14.99, icon: 'ForkKnife' },
    { name: 'Ice Tea', category: 'Beverages', price: 2.99, icon: 'Beer' },
    { name: 'Fresh Juice', category: 'Beverages', price: 4.50, icon: 'Beer' },
    { name: 'Soft Drink', category: 'Beverages', price: 2.50, icon: 'Beer' },
    { name: 'Chocolate Lava Cake', category: 'Desserts', price: 6.99, icon: 'Cake' },
    { name: 'Apple Pie', category: 'Desserts', price: 5.99, icon: 'Cake' }
  ]

  for (const item of menuItems) {
    const existingItem = await prisma.menuItem.findFirst({
      where: { tenantId: tenant.id, name: item.name }
    })
    if (!existingItem) {
      await prisma.menuItem.create({
        data: {
          tenantId: tenant.id,
          name: item.name,
          category: item.category,
          price: item.price,
          icon: item.icon,
          priceType: 'item'
        }
      })
    }
  }
  console.log('✅ Restaurant menu items seeded.')

  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@store.com' } })
  if (!adminExists) {
    const hash = await bcrypt.hash('store1234', 12)
    await prisma.user.create({
      data: { name: 'Store Admin', email: 'admin@store.com', password: hash, role: 'admin', tenantId: tenant.id }
    })
    console.log('✅ Store Admin: admin@store.com / store1234')
  } else {
    console.log('ℹ️  Store admin already exists.')
  }

  console.log('\n🎉 Done!\n')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
