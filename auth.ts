import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { CredentialsSignin } from 'next-auth'

class StoreSuspendedError extends CredentialsSignin {
  code = 'store_suspended'
  message = 'Store suspended, contact system admin'
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true, customRole: true },
        })
        if (!user) return null
        
        // Block suspended tenants
        if (user.tenant && user.tenant.status === 'suspended') {
          throw new StoreSuspendedError()
        }

        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId ?? null,
          tenantName: user.tenant?.name ?? null,
          tenantStatus: user.tenant?.status ?? 'active',
          tenantPlan: user.tenant?.plan ?? 'trial',
          modules: user.customRole ? user.customRole.modules : null,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
        token.tenantName = (user as any).tenantName
        token.tenantStatus = (user as any).tenantStatus
        token.tenantPlan = (user as any).tenantPlan
        token.modules = (user as any).modules
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).tenantName = token.tenantName
        ;(session.user as any).tenantStatus = token.tenantStatus
        ;(session.user as any).tenantPlan = token.tenantPlan
        ;(session.user as any).modules = token.modules
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
})
