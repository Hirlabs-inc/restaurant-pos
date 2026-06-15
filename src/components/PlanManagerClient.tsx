'use client'

import { useState, useTransition } from 'react'
import { createPlanAction, updatePlanAction, deletePlanAction } from '../app/auth-actions'
import { Package, Pencil, Trash, Warning, CheckCircle } from '@phosphor-icons/react'

export default function PlanManagerClient({ initialPlans }: { initialPlans: any[] }) {
  const [plans, setPlans] = useState(initialPlans)
  const [showNewPlan, setShowNewPlan] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createPlanAction(fd)
      if (res.success) { setShowNewPlan(false); window.location.reload() }
      else setError(res.error || 'Failed.')
    })
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updatePlanAction(editingPlan.id, fd)
      if (res.success) { setEditingPlan(null); window.location.reload() }
      else setError(res.error || 'Failed.')
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"? This will fail if stores are using it.`)) return
    startTransition(async () => {
      const res = await deletePlanAction(id)
      if (res.success) setPlans(prev => prev.filter(p => p.id !== id))
      else alert(res.error)
    })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>System Plans</h2>
        <button onClick={() => setShowNewPlan(true)} className="new-order-btn">+ New Plan</button>
      </div>

      <div className="services-grid">
        {plans.map(plan => (
          <div key={plan.id} className="service-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)',
                color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Package size={24} weight="duotone" />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditingPlan(plan)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Pencil size={18} /></button>
                <button onClick={() => handleDelete(plan.id, plan.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}><Trash size={18} /></button>
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{plan.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{plan.description || 'No description provided.'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', background: 'var(--bg-main)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Users</span>
                <span style={{ fontWeight: 600 }}>{plan.maxUsers}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Orders</span>
                <span style={{ fontWeight: 600 }}>{plan.maxOrders}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Price</span>
                <span style={{ fontWeight: 700, color: '#7C3AED' }}>${plan.price}/mo</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-dark)' }}>
          <Package size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>No plans defined. Create one to set store limits.</p>
        </div>
      )}

      {/* Plan Drawer (Shared for New/Edit) */}
      {(showNewPlan || editingPlan) && (
        <>
          <div onClick={() => { setShowNewPlan(false); setEditingPlan(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '440px', background: 'var(--bg-surface)', zIndex: 300, boxShadow: '-8px 0 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
              <button onClick={() => { setShowNewPlan(false); setEditingPlan(null) }} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={editingPlan ? handleUpdate : handleCreate} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Plan Name</label>
                <input name="name" required defaultValue={editingPlan?.name} placeholder="e.g. Professional" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Description</label>
                <textarea name="description" defaultValue={editingPlan?.description} rows={3} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px', resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Max Users</label>
                  <input name="maxUsers" type="number" required defaultValue={editingPlan?.maxUsers || 5} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Max Orders</label>
                  <input name="maxOrders" type="number" required defaultValue={editingPlan?.maxOrders || 1000} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Monthly Price ($)</label>
                <input name="price" type="number" step="0.01" required defaultValue={editingPlan?.price || 0} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '15px' }} />
              </div>
              
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}><Warning size={16} /> {error}</div>}
              
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ width: '100%', opacity: isPending ? 0.6 : 1 }}>
                  {isPending ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
