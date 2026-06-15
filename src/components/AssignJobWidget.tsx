'use client'

import { useState, useTransition } from 'react'
import { assignOrderAction } from '../app/actions'
import { UserCirclePlus } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

export function AssignJobWidget({ order, staff }: { order: any, staff: any[] }) {
  const router = useRouter()
  const [loading, startTransition] = useTransition()
  const [assignedId, setAssignedId] = useState(order.assignedToId || '')

  const handleAssign = () => {
    startTransition(async () => {
      const res = await assignOrderAction(order.id, assignedId || null)
      if (!res.success) alert(res.error)
      else router.refresh()
    })
  }

  // Filter staff: keep currently assigned employee or those with no active jobs
  const availableStaff = staff.filter(s => {
    if (s.id === order.assignedToId) return true
    return !s.assignedJobs || s.assignedJobs.length === 0
  })

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <select 
        value={assignedId} 
        onChange={e => setAssignedId(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-dark)', background: 'var(--bg-main)', fontSize: '12px', color: 'var(--text-main)' }}
      >
        <option value="">Unassigned</option>
        {availableStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <button 
        onClick={handleAssign} 
        disabled={loading || assignedId === (order.assignedToId || '')} 
        style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: (loading || assignedId === (order.assignedToId || '')) ? 0.5 : 1 }}
      >
        <UserCirclePlus size={14} /> Assign
      </button>
    </div>
  )
}

