'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'
import { signOut } from 'next-auth/react'
import { Globe, ChartPieSlice, ShoppingCart, ChartLineUp, Users, ForkKnife, CookingPot, Coins, Gear, Sun, Moon } from '@phosphor-icons/react'

const ROLE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  superadmin: { bg: '#7C3AED', color: 'white', label: 'Super Admin' },
  admin:      { bg: '#007AFF', color: 'white', label: 'Admin' },
  cashier:    { bg: '#10B981', color: 'white', label: 'Cashier' },
}

const ALL_NAV = [
  { label: 'Super Admin', Icon: Globe, path: '/superadmin', roles: ['superadmin'] },
  { label: 'Plans',       Icon: Coins, path: '/superadmin/plans', roles: ['superadmin'] },
  { label: 'Dashboard',   Icon: ChartPieSlice, path: '/dashboard',  roles: ['admin'] },
  { label: 'POS Line',    Icon: ShoppingCart, path: '/',           roles: ['admin', 'cashier'] },
  { label: 'Reports',     Icon: ChartLineUp, path: '/reports',    roles: ['admin', 'cashier'] },
  { label: 'Manage Orders', Icon: CookingPot, path: '/manage-orders', roles: ['admin', 'superadmin'] },
  { label: 'Employees',   Icon: Users, path: '/employees', roles: ['admin', 'superadmin'] },
  { label: 'Customers',   Icon: Users, path: '/customers',  roles: ['admin', 'cashier'] },
  { label: 'Menu Items',  Icon: ForkKnife, path: '/products',   roles: ['admin'] },
  { label: 'Accounting',  Icon: Coins, path: '/accounting', roles: ['admin'] },
  { label: 'Settings',    Icon: Gear, path: '/settings',   roles: ['admin'] },
]

interface SidebarProps {
  storeName?: string
  storeLogo?: string
  userName?: string
  userRole?: string
  userEmail?: string
  userPlan?: string
  userModules?: string[]
}

export default function Sidebar({ storeName = 'Restaurant POS', storeLogo, userName = '', userRole = 'cashier', userEmail = '', userPlan = '', userModules }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggle } = useTheme()

  const navItems = ALL_NAV.filter(item => {
    if (userRole === 'superadmin') return item.roles.includes('superadmin')
    if (userRole === 'admin') return item.roles.includes('admin')
    if (userRole === 'custom' && userModules) {
      return userModules.includes(item.path) || item.path === '/'
    }
    return item.roles.includes(userRole)
  })
  
  const roleMeta = ROLE_COLORS[userRole] || { bg: '#8B5CF6', color: 'white', label: 'Custom Role' }

  const handleNavClick = () => setMobileOpen(false)

  return (
    <>
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999
        }} />
      )}

      <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {storeLogo ? (
              <img src={storeLogo} alt="Logo" style={{
                width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0, backgroundColor: 'white'
              }} />
            ) : (
              <div style={{
                width: '32px', height: '32px', background: 'linear-gradient(135deg, #007AFF, #7C3AED)',
                borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '14px'
              }}>
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1.2 }}>{storeName}</div>
              {userRole === 'superadmin' && (
                <div style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 600 }}>SYSTEM</div>
              )}
            </div>
          </div>
          <button className="mobile-nav-toggle" onClick={() => setMobileOpen(p => !p)} aria-label="Toggle nav">
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Nav links */}
        <div className="nav-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              onClick={handleNavClick}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <item.Icon weight="duotone" size={20} style={{ flexShrink: 0 }} />
              {item.label}
            </Link>
          ))}
        </div>

        {/* Bottom */}
        <div className="sidebar-bottom">
          {/* Dark mode toggle */}
          <button onClick={toggle} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 14px', marginBottom: '14px',
            border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-main)', color: 'var(--text-main)',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
            <span style={{
              width: '36px', height: '20px', background: theme === 'dark' ? 'var(--primary)' : 'var(--border-dark)',
              borderRadius: '999px', position: 'relative', flexShrink: 0, transition: 'background 0.25s',
            }}>
              <span style={{
                position: 'absolute', top: '2px', left: theme === 'dark' ? '18px' : '2px',
                width: '16px', height: '16px', background: 'white', borderRadius: '50%',
                transition: 'left 0.25s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </span>
          </button>

          {/* User profile */}
          <div style={{
            border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-lg)', padding: '12px', marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: roleMeta.bg, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '14px'
              }}>
                {userName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userName || 'User'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                  background: roleMeta.bg, color: roleMeta.color,
                }}>
                  {roleMeta.label}
                </span>
                {userPlan && userRole !== 'superadmin' && (
                  <span style={{
                    padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                    background: 'rgba(234, 179, 8, 0.1)', color: '#CA8A04', border: '1px solid rgba(234, 179, 8, 0.2)'
                  }}>
                    {userPlan.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{
                  fontSize: '12px', padding: '5px 12px',
                  border: '1px solid var(--border-dark)', borderRadius: '6px',
                  background: 'transparent', color: 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
