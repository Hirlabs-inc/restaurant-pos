'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Eye, EyeClosed } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      if (res.error === 'CredentialsSignin' || res.error === 'CredentialsSignin') {
        setError('Invalid email or password.')
      } else if (res.error.includes('store_suspended')) {
        setError('Store suspended, contact system admin')
      } else {
        // Fallback for generic Auth.js error masking
        setError(res.error === 'Configuration' ? 'Store suspended, contact system admin' : res.error)
      }
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080808',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      color: '#fff',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Background Circuit Lines (SVG) */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, pointerEvents: 'none' }}>
        <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M 0 10 L 50 10 L 50 60 L 100 60" fill="none" stroke="#fff" strokeWidth="0.5" />
          <path d="M 20 0 L 20 40 L 70 40 L 70 100" fill="none" stroke="#fff" strokeWidth="0.5" />
          <circle cx="50" cy="10" r="1.5" fill="#fff" />
          <circle cx="70" cy="40" r="1.5" fill="#fff" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)',
            border: '2px solid #222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            boxShadow: '0 0 20px rgba(0, 122, 255, 0.1)'
          }}>
            {/* Inner Glow Ring */}
            <div style={{
              width: '40px', height: '40px',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#007AFF',
              borderRightColor: '#007AFF',
              transform: 'rotate(-45deg)'
            }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#007AFF', marginBottom: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>Hirlabs e-Restaurant</h2>
          <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Don't have an account yet? <span style={{ color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Sign up</span>
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#111111',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid #1f1f1f',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Email Input */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email address"
                style={{
                  width: '100%', padding: '16px 16px 16px 48px',
                  background: '#161616', border: '1px solid #262626',
                  borderRadius: '12px', color: '#fff', fontSize: '15px',
                  outline: 'none', transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#444';
                  e.target.style.background = '#1a1a1a';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#262626';
                  e.target.style.background = '#161616';
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%', padding: '16px 48px',
                  background: '#161616', border: '1px solid #262626',
                  borderRadius: '12px', color: '#fff', fontSize: '15px',
                  outline: 'none', transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#444';
                  e.target.style.background = '#1a1a1a';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#262626';
                  e.target.style.background = '#161616';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#888', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
              </button>
            </div>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '10px', padding: '12px',
                color: '#ef4444', fontSize: '13px', textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#333' : '#007AFF',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '16px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(0, 122, 255, 0.3)'
              }}
              onMouseEnter={e => { if(!loading) e.currentTarget.style.background = '#0066d6' }}
              onMouseLeave={e => { if(!loading) e.currentTarget.style.background = '#007AFF' }}
            >
              {loading ? 'Processing...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#222' }} />
            <span style={{ fontSize: '11px', color: '#555', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#222' }} />
          </div>

          {/* Social Logins */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { icon: 'apple' },
              { icon: 'google' },
              { icon: 'x' }
            ].map((social, i) => (
              <button key={i} type="button" style={{
                flex: 1, height: '48px',
                background: '#1a1a1a', border: '1px solid #262626',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#222'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a1a1a'}
              >
                {social.icon === 'apple' && <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.96.95-2.06 1.72-3.23 1.72-1.14 0-1.54-.73-2.91-.73s-1.84.71-2.91.71c-1.12 0-2.03-.66-3.14-1.74-2.22-2.16-3.81-6.1-3.81-8.72 0-4.14 2.68-6.33 5.23-6.33 1.34 0 2.51.93 3.33.93.81 0 2.14-.98 3.63-.98 1.41 0 4.19.51 5.61 2.59-3.08 1.86-2.58 5.86.51 6.89-1.21 2.87-2.32 5.66-2.32 5.66zM12.03 5.46c-.05-1.92 1.57-3.6 3.44-3.52.07 1.93-1.61 3.56-3.44 3.52z"/></svg>}
                {social.icon === 'google' && <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
                {social.icon === 'x' && <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z"/></svg>}
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', color: '#444', fontSize: '12px', letterSpacing: '1px', fontWeight: 600 }}>
          RESTAURANT POS PREMIUM
        </p>
      </div>
    </div>
  )
}

