export default function SuspendedPage() {
  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'var(--bg-main)', padding: '20px', textAlign: 'center' 
    }}>
      <div style={{ 
        maxWidth: '400px', padding: '40px', background: 'var(--bg-surface)', 
        borderRadius: '24px', border: '1px solid var(--border-light)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Account Suspended</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
          Your store access has been temporarily suspended by the system administrator. 
          Please contact support if you believe this is an error.
        </p>
        <a href="/login" style={{ 
          display: 'block', padding: '12px', background: 'var(--primary)', color: 'white', 
          borderRadius: '12px', textDecoration: 'none', fontWeight: 600 
        }}>
          Back to Login
        </a>
      </div>
    </div>
  )
}
