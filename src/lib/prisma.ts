import { PrismaClient } from '@prisma/client/wasm'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/web'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (!tursoUrl) {
    throw new Error('TURSO_DATABASE_URL is not set. Please configure your environment variables.')
  }

  const libsql = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  })
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export { prisma }
export default prisma
