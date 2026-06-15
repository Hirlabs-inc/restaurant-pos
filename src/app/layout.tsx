import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ThemeProvider from '@/components/ThemeProvider'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import { auth } from '../../auth'
import prisma from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#2B59FF',
}

export const metadata: Metadata = {
  title: 'Hirlabs POS',
  description: 'Modern Restaurant POS Platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hirlabs POS',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user as any

  const showSidebar = !!user

  let storeName = user?.tenantName || 'Hirlabs POS';
  let storeLogo = undefined;
  let storePlan = undefined;
  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { tenant: true }
    });
    if (dbUser?.tenant) {
      storeName = dbUser.tenant.name;
      if (dbUser.tenant.logo) storeLogo = dbUser.tenant.logo;
      if (dbUser.tenant.plan) storePlan = dbUser.tenant.plan;
    }
  }

  return (
    <html lang="en" style={{ colorScheme: 'light dark' }}>
      <head>
      </head>
      <body className={inter.className}>
        <SessionProviderWrapper>
          <ThemeProvider>
            {showSidebar ? (
              <div className="app-container">
                <Sidebar
                  storeName={storeName}
                  storeLogo={storeLogo}
                  userName={user?.name || ''}
                  userRole={user?.role || ''}
                  userEmail={user?.email || ''}
                  userPlan={storePlan || user?.tenantPlan || ''}
                  userModules={user?.modules ? JSON.parse(user.modules) : undefined}
                />
                {children}
              </div>
            ) : (
              <>{children}</>
            )}
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
