'use client'

import { useState, useTransition } from 'react'
import { createRoleAction, deleteRoleAction, updateRoleAction } from '../app/role-actions'
import { ShieldPlus, Trash, Warning, Pencil } from '@phosphor-icons/react'

const PAGE_MODULES = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/', label: 'Job Line (POS)' },
  { path: '/reports', label: 'Reports' },
  { path: '/manage-orders', label: 'Manage Jobs' },
  { path: '/employees', label: 'Field Employees' },
  { path: '/wages', label: 'Wages & Payroll' },
  { path: '/customers', label: 'Customers' },
  { path: '/products', label: 'Products' },
  { path: '/fulfillment', label: 'Fulfillment' },
  { path: '/accounting', label: 'Accounting' },
  { path: '/settings', label: 'Settings' },
]

const WIDGET_MODULES = [
  { path: 'widget-revenue', label: 'Revenue & Profit' },
  { path: 'widget-orders', label: 'Job Stats' },
  { path: 'widget-expenses', label: 'Expenses' },
  { path: 'widget-customers', label: 'Customer Stats' },
  { path: 'widget-receivables', label: 'Receivables' },
  { path: 'widget-recent-orders', label: 'Recent Jobs Table' },
  { path: 'widget-top-services', label: 'Top Services List' },
  { path: 'widget-assign-jobs', label: 'Assign Jobs (Unassigned Orders)' },
  { path: 'widget-assigned-jobs', label: 'Assigned Jobs (In Progress)' },
]

const ALL_MODULES = [...PAGE_MODULES, ...WIDGET_MODULES]

export default function RoleManagerClient({ initialRoles, tenantId }: { initialRoles: any[], tenantId: string }) {
  const [roles, setRoles] = useState(initialRoles)
  const [showDrawer, setShowDrawer] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = editingRole 
        ? await updateRoleAction(editingRole.id, fd)
        : await createRoleAction(fd)
      if (res.success) {
        if (editingRole) {
          setRoles(prev => prev.map(r => r.id === editingRole.id ? res.role : r))
        } else {
          setRoles(prev => [...prev, res.role])
        }
        setShowDrawer(false)
        setEditingRole(null)
      } else {
        setError(res.error || `Failed to ${editingRole ? 'update' : 'create'} role.`)
      }
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete role "${name}"?`)) return
    startTransition(async () => {
      const res = await deleteRoleAction(id)
      if (res.success) setRoles(prev => prev.filter(r => r.id !== id))
      else alert(res.error)
    })
  }

  const handleEditClick = (role: any) => {
    setEditingRole(role)
    setError('')
    setShowDrawer(true)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button onClick={() => { setEditingRole(null); setError(''); setShowDrawer(true); }} className="new-order-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldPlus size={18} /> Create Role
        </button>
      </div>

      <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)' }}>
              {['Role Name', 'Description', 'Access Modules', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map(r => {
              const modules = JSON.parse(r.modules || '[]') as string[]
              return (
                <tr key={r.id}>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '13px' }}>{r.description || '-'}</td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {modules.map(m => (
                        <span key={m} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-dark)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-main)' }}>
                          {ALL_MODULES.find(mod => mod.path === m)?.label || m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditClick(r)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', fontSize: '12px', border: '1px solid var(--border-dark)', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(r.id, r.name)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', fontSize: '12px', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>
                        <Trash size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {roles.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No custom roles created.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showDrawer && (
        <>
          <div onClick={() => { setShowDrawer(false); setEditingRole(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', background: 'var(--bg-surface)', zIndex: 300, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{editingRole ? 'Edit Role' : 'Create New Role'}</h2>
              <button onClick={() => { setShowDrawer(false); setEditingRole(null); }} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit} key={editingRole?.id || 'new'} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, overflow: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Role Name *</label>
                <input name="name" type="text" required defaultValue={editingRole?.name || ''} placeholder="e.g. Supervisor"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Description</label>
                <input name="description" type="text" defaultValue={editingRole?.description || ''} placeholder="Short description"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Page Access *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-dark)', borderRadius: '10px', padding: '12px', background: 'var(--bg-main)' }}>
                  {PAGE_MODULES.map(m => {
                    const isChecked = editingRole ? (JSON.parse(editingRole.modules || '[]') as string[]).includes(m.path) : false;
                    return (
                      <label key={m.path} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input type="checkbox" name="modules" value={m.path} defaultChecked={isChecked} style={{ width: '16px', height: '16px' }} />
                        {m.label}
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Dashboard Widgets</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border-dark)', borderRadius: '10px', padding: '12px', background: 'var(--bg-main)' }}>
                  {WIDGET_MODULES.map(m => {
                    const isChecked = editingRole ? (JSON.parse(editingRole.modules || '[]') as string[]).includes(m.path) : false;
                    return (
                      <label key={m.path} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                        <input type="checkbox" name="modules" value={m.path} defaultChecked={isChecked} style={{ width: '16px', height: '16px' }} />
                        {m.label}
                      </label>
                    )
                  })}
                </div>
              </div>

              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}><Warning size={18} /> {error}</div>}
              
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShieldPlus size={18} /> {isPending ? (editingRole ? 'Updating...' : 'Creating...') : (editingRole ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
