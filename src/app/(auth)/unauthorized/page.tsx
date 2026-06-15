import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '24px'
    }}>
      <div style={{ fontSize: '64px' }}>🚫</div>
      <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Access Denied</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '360px' }}>
        You don't have permission to view this page. Contact your administrator.
      </p>
      <Link href="/" style={{
        marginTop: '8px', padding: '12px 28px', background: 'var(--primary)',
        color: 'white', borderRadius: '999px', fontWeight: 600, textDecoration: 'none', fontSize: '15px'
      }}>
        Go to POS
      </Link>
    </div>
  )
}
