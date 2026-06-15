'use client'

import { useState, useTransition } from 'react'
import { createUserAction, deleteUserAction, resetUserPasswordAction } from '../app/auth-actions'
import { Eye, EyeClosed, ShoppingCart, Gear, Warning, Trash, UserPlus } from '@phosphor-icons/react'

const ROLE_META: Record<string, { bg: string; color: string; label: string }> = {
  admin:   { bg: '#2B59FF', color: 'white', label: 'Admin' },
  cashier: { bg: '#10B981', color: 'white', label: 'Cashier' },
}

export default function UserManagerClient({ 
  initialUsers, 
  tenantId, 
  currentUserId,
  roles = []
}: { 
  initialUsers: any[], 
  tenantId: string, 
  currentUserId?: string,
  roles?: any[]
}) {
  const [users, setUsers] = useState(initialUsers)
  const [showDrawer, setShowDrawer] = useState(false)
  const [resetTarget, setResetTarget] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('tenantId', tenantId)
    startTransition(async () => {
      const res = await createUserAction(fd)
      if (res.success) { setShowDrawer(false); window.location.reload() }
      else setError(res.error || 'Failed.')
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove user "${name}"? They will no longer be able to log in.`)) return
    startTransition(async () => {
      const res = await deleteUserAction(id)
      if (res.success) setUsers(prev => prev.filter(u => u.id !== id))
      else alert(res.error)
    })
  }

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    startTransition(async () => {
      const res = await resetUserPasswordAction(resetTarget.id, newPassword)
      if (res.success) { setResetTarget(null); setNewPassword(''); alert('Password updated!') }
      else setError(res.error || 'Failed.')
    })
  }

  return (
    <>
      {/* Add User button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => setShowDrawer(true)} className="new-order-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} /> Add Staff Member
        </button>
      </div>

      {/* Users table */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)' }}>
              {['Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ROLE_META[u.role]?.bg || '#6B7280', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.name} {u.id === currentUserId && <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>(You)</span>}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '13px' }}>{u.email}</td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ padding: '3px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: u.role === 'custom' ? '#8B5CF6' : (ROLE_META[u.role]?.bg || '#6B7280'), color: ROLE_META[u.role]?.color || 'white' }}>
                    {u.role === 'custom' ? (u.customRole?.name || 'Custom Role') : (ROLE_META[u.role]?.label || u.role)}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setResetTarget(u); setNewPassword('') }} style={{ padding: '5px 12px', fontSize: '12px', border: '1px solid var(--border-dark)', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                      Reset PW
                    </button>
                    {u.id !== currentUserId && (
                      <button onClick={() => handleDelete(u.id, u.name)} style={{ padding: '5px 12px', fontSize: '12px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No staff members yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Drawer */}
      {showDrawer && (
        <>
          <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', background: 'var(--bg-surface)', zIndex: 300, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Add Staff Member</h2>
              <button onClick={() => setShowDrawer(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflow: 'auto' }}>
              {[
                { name: 'name', label: 'Full Name *', type: 'text', placeholder: 'e.g. Jane Doe' },
                { name: 'email', label: 'Email *', type: 'email', placeholder: 'jane@store.com' },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>{f.label}</label>
                  <input name={f.name} type={f.type} required placeholder={f.placeholder}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                </div>
              ))}
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="Min. 6 characters"
                    style={{ width: '100%', padding: '11px 40px 11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Role *</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[{ value: 'cashier', label: 'Cashier', icon: <ShoppingCart size={20} />, desc: 'POS, customers, reports' }, { value: 'admin', label: 'Admin', icon: <Gear size={20} />, desc: 'Full store access' }].map(r => (
                    <label key={r.value} style={{ flex: '1 1 45%', cursor: 'pointer' }}>
                      <input type="radio" name="role" value={r.value} defaultChecked={r.value === 'cashier'} style={{ display: 'none' }} />
                      <div className="role-card" style={{ padding: '12px', border: '2px solid var(--border-dark)', borderRadius: '10px', textAlign: 'center', transition: 'all 0.15s' }}
                        onClick={e => { document.querySelectorAll('.role-card').forEach((el: any) => el.style.borderColor = 'var(--border-dark)'); (e.currentTarget.previousElementSibling as HTMLInputElement).checked = true; e.currentTarget.style.borderColor = 'var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '14px' }}>
                          {r.icon} {r.label}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{r.desc}</div>
                      </div>
                    </label>
                  ))}
                  {roles.map(r => (
                    <label key={r.id} style={{ flex: '1 1 45%', cursor: 'pointer' }}>
                      <input type="radio" name="role" value={r.id} style={{ display: 'none' }} />
                      <div className="role-card" style={{ padding: '12px', border: '2px solid var(--border-dark)', borderRadius: '10px', textAlign: 'center', transition: 'all 0.15s' }}
                        onClick={e => { document.querySelectorAll('.role-card').forEach((el: any) => el.style.borderColor = 'var(--border-dark)'); (e.currentTarget.previousElementSibling as HTMLInputElement).checked = true; e.currentTarget.style.borderColor = 'var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, fontSize: '14px' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Custom Role</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}><Warning size={18} /> {error}</div>}
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <UserPlus size={18} /> {isPending ? 'Creating...' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', padding: '32px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginBottom: '8px' }}>Reset Password</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Set new password for <strong>{resetTarget.name}</strong></p>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input type={showResetPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 chars)"
                style={{ width: '100%', padding: '11px 40px 11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
              <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showResetPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </button>
            </div>
            {error && <div style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Warning size={16} /> {error}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => { setResetTarget(null); setError('') }} style={{ flex: 1, padding: '11px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleResetPassword} disabled={isPending} className="charge-btn" style={{ flex: 1, padding: '11px' }}>{isPending ? '...' : 'Update'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
