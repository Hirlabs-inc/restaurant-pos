import { cache } from 'react'
import { PrismaClient } from '@prisma/client/wasm'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/web'

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

// On Cloudflare Workers, I/O objects are bound to the request that created them.
// Reusing a libsql/Prisma client across requests causes hung requests and 1101s,
// so the client is memoized per request (React `cache`) rather than globally.
const getPrismaClient = cache(createPrismaClient)

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export { prisma }
export default prisma
