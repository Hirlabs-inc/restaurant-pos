'use client'

import { useState, useTransition } from 'react'
import { createTenantAction, deleteTenantAction, toggleTenantStatusAction, updateTenantAction, createUserAction, deleteUserAction, resetUserPasswordAction } from '../app/auth-actions'
import { Buildings, CheckCircle, Users, Package, Warning, Pencil, Key } from '@phosphor-icons/react'

const ROLE_META: Record<string, { bg: string; color: string }> = {
  superadmin: { bg: '#7C3AED', color: 'white' },
  admin:      { bg: '#2B59FF', color: 'white' },
  cashier:    { bg: '#10B981', color: 'white' },
}

export default function SuperAdminClient({ initialTenants, initialPlans, currentUserId }: { initialTenants: any[], initialPlans: any[], currentUserId?: string }) {
  const [tenants, setTenants] = useState(initialTenants)
  const [plans, setPlans] = useState(initialPlans)
  const [showNewTenant, setShowNewTenant] = useState(false)
  const [editingTenant, setEditingTenant] = useState<any>(null)
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null)
  const [showAddUser, setShowAddUser] = useState<string | null>(null) // tenantId
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createTenantAction(fd)
      if (res.success) { setShowNewTenant(false); window.location.reload() }
      else setError(res.error || 'Failed.')
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete tenant "${name}" and ALL their data? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteTenantAction(id)
      if (res.success) setTenants(prev => prev.filter(t => t.id !== id))
      else alert(res.error)
    })
  }

  const handleToggleStatus = (id: string, status: string) => {
    startTransition(async () => {
      const res = await toggleTenantStatusAction(id, status)
      if (res.success) setTenants(prev => prev.map(t => t.id === id ? { ...t, status: status === 'active' ? 'suspended' : 'active' } : t))
      else alert(res.error)
    })
  }

  const handleUpdateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateTenantAction(editingTenant.id, fd)
      if (res.success) { setEditingTenant(null); window.location.reload() }
      else setError(res.error || 'Failed.')
    })
  }

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>, tenantId: string) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('tenantId', tenantId)
    startTransition(async () => {
      const res = await createUserAction(fd)
      if (res.success) { setShowAddUser(null); window.location.reload() }
      else alert(res.error)
    })
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"?`)) return
    startTransition(async () => {
      const res = await deleteUserAction(userId)
      if (res.success) window.location.reload()
      else alert(res.error)
    })
  }

  const handleResetPassword = (userId: string) => {
    const newPass = prompt('Enter new password (min. 8 characters):')
    if (!newPass || newPass.length < 8) return
    startTransition(async () => {
      const res = await resetUserPasswordAction(userId, newPass)
      if (res.success) alert('Password updated successfully.')
      else alert(res.error)
    })
  }

  return (
    <>
      {/* Stats */}
      <div className="services-grid" style={{ marginBottom: '32px' }}>
        {[
          { label: 'Total Tenants', value: tenants.length, icon: <Buildings size={32} /> },
          { label: 'Active Tenants', value: tenants.filter(t => t.status === 'active').length, icon: <CheckCircle size={32} weight="fill" color="#10B981" /> },
          { label: 'Total Users', value: tenants.reduce((s, t) => s + t._count.users, 0), icon: <Users size={32} /> },
          { label: 'Total Orders', value: tenants.reduce((s, t) => s + t._count.orders, 0), icon: <Package size={32} /> },
        ].map(stat => (
          <div key={stat.label} className="service-card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{stat.value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>All Tenants</h2>
        <button onClick={() => setShowNewTenant(true)} className="new-order-btn">+ New Tenant</button>
      </div>

      {/* Tenants list */}
      {tenants.map(tenant => (
        <div key={tenant.id} style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
          borderRadius: '16px', marginBottom: '16px', overflow: 'hidden'
        }}>
          {/* Tenant header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', flexWrap: 'wrap' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, #2B59FF, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '18px'
            }}>
              {tenant.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>{tenant.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {tenant._count.users} users · {tenant._count.orders} orders · {tenant._count.customers} customers · Plan: {tenant.planObj?.name || tenant.plan || 'No Plan'}
              </div>
            </div>
            <span style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              background: tenant.status === 'active' ? '#D1FAE5' : '#FEE2E2',
              color: tenant.status === 'active' ? '#065F46' : '#991B1B',
            }}>
              {tenant.status}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setExpandedTenant(expandedTenant === tenant.id ? null : tenant.id)}
                style={{ padding: '7px 14px', fontSize: '13px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                {expandedTenant === tenant.id ? 'Hide Users' : 'Users'}
              </button>
              <button onClick={() => setEditingTenant(tenant)}
                style={{ padding: '7px', fontSize: '13px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}>
                <Pencil size={18} />
              </button>
              <button onClick={() => handleToggleStatus(tenant.id, tenant.status)} disabled={isPending}
                style={{ padding: '7px 14px', fontSize: '13px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                {tenant.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(tenant.id, tenant.name)} disabled={isPending}
                style={{ padding: '7px 14px', fontSize: '13px', border: '1px solid #FCA5A5', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>
                Delete
              </button>
            </div>
          </div>

          {/* Expanded users table */}
          {expandedTenant === tenant.id && (
            <div style={{ borderTop: '1px solid var(--border-light)', padding: '20px 24px', background: 'var(--bg-main)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Users ({tenant.users.length})</span>
                <button onClick={() => setShowAddUser(tenant.id)} className="new-order-btn" style={{ fontSize: '13px', padding: '8px 16px' }}>+ Add User</button>
              </div>
              {showAddUser === tenant.id && (
                <form onSubmit={e => handleAddUser(e, tenant.id)} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
                  <input name="name" required placeholder="Full name" style={{ flex: '1 1 140px', padding: '9px 12px', border: '1.5px solid var(--border-dark)', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px' }} />
                  <input name="email" type="email" required placeholder="Email" style={{ flex: '1 1 180px', padding: '9px 12px', border: '1.5px solid var(--border-dark)', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px' }} />
                  <input name="password" type="password" required placeholder="Password" style={{ flex: '1 1 140px', padding: '9px 12px', border: '1.5px solid var(--border-dark)', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px' }} />
                  <select name="role" style={{ padding: '9px 12px', border: '1.5px solid var(--border-dark)', borderRadius: '8px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '14px' }}>
                    <option value="admin">Admin</option>
                    <option value="cashier">Cashier</option>
                  </select>
                  <button type="submit" disabled={isPending} className="new-order-btn" style={{ fontSize: '13px', padding: '9px 18px' }}>
                    {isPending ? '...' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowAddUser(null)} style={{ padding: '9px 14px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                </form>
              )}
              {tenant.users.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No users yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tenant.users.map((u: any) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ROLE_META[u.role]?.bg || '#6B7280', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px' }}>{u.name} {u.id === currentUserId && <span style={{ fontSize: '11px', color: '#7C3AED', background: '#F5F3FF', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>(You)</span>}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                      <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: ROLE_META[u.role]?.bg || '#6B7280', color: 'white' }}>
                        {u.role}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                      {u.id !== currentUserId && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleResetPassword(u.id)} title="Reset Password"
                            style={{ padding: '4px', fontSize: '12px', border: '1px solid var(--border-dark)', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}>
                            <Key size={16} />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id, u.name)}
                            style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {tenants.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}><Buildings size={48} /></div>
          <h3>No tenants yet</h3>
          <p style={{ marginTop: '8px' }}>Create your first tenant to get started.</p>
        </div>
      )}

      {/* New Tenant Drawer */}
      {showNewTenant && (
        <>
          <div onClick={() => setShowNewTenant(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', background: 'var(--bg-surface)', zIndex: 300, boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Create New Tenant</h2>
              <button onClick={() => setShowNewTenant(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTenant} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Store Details</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Store Name *</label>
                    <input name="tenantName" required placeholder="e.g. The Grand Bistro" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Plan</label>
                    <select name="planId" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }}>
                      <option value="">No Plan</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name} (Max {p.maxUsers} users)</option>)}
                    </select>
                  </div>
                </div>
              </fieldset>
              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Admin Account</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'adminName', label: 'Admin Full Name *', type: 'text', placeholder: 'Jane Doe' },
                    { name: 'adminEmail', label: 'Admin Email *', type: 'email', placeholder: 'admin@store.com' },
                    { name: 'adminPassword', label: 'Password *', type: 'password', placeholder: 'Min. 8 characters' },
                  ].map(f => (
                    <div key={f.name}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>{f.label}</label>
                      <input name={f.name} type={f.type} required placeholder={f.placeholder} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                    </div>
                  ))}
                </div>
              </fieldset>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}><Warning size={16} /> {error}</div>}
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ width: '100%', opacity: isPending ? 0.6 : 1 }}>
                  {isPending ? 'Creating...' : 'Create Tenant'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit Tenant Drawer */}
      {editingTenant && (
        <>
          <div onClick={() => setEditingTenant(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', background: 'var(--bg-surface)', zIndex: 300, boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Edit Tenant</h2>
              <button onClick={() => setEditingTenant(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateTenant} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>General Info</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Store Name</label>
                    <input name="name" defaultValue={editingTenant.name} required style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Plan</label>
                    <select name="planId" defaultValue={editingTenant.planId} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }}>
                      <option value="">No Plan</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name} (Max {p.maxUsers} users)</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Status</label>
                    <select name="status" defaultValue={editingTenant.status} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }}>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </fieldset>
              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Settings</legend>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Currency</label>
                    <input name="currency" defaultValue={editingTenant.currency} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Tax Rate (%)</label>
                    <input name="taxRate" type="number" step="0.1" defaultValue={editingTenant.taxRate} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                  </div>
                </div>
              </fieldset>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}><Warning size={16} /> {error}</div>}
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ width: '100%', opacity: isPending ? 0.6 : 1 }}>
                  {isPending ? 'Saving...' : 'Update Tenant'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
