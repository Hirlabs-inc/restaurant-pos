'use client'

import { useState, useTransition } from 'react'
import { createEmployeeAction, updateEmployeeAction, deleteEmployeeAction } from '../app/actions'
import { UserPlus, PencilSimple, Trash, Briefcase, Phone, Warning } from '@phosphor-icons/react'

export default function EmployeeManagerClient({ initialEmployees }: { initialEmployees: any[] }) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEmp, setCurrentEmp] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const openAdd = () => { setIsEditing(false); setCurrentEmp(null); setIsDrawerOpen(true); setError(''); }
  const openEdit = (e: any) => { setIsEditing(true); setCurrentEmp(e); setIsDrawerOpen(true); setError(''); }

  const handleDelete = (id: string, count: number) => {
    if (count > 0) return alert('Cannot delete an employee with assigned jobs!')
    if (!confirm('Are you sure you want to delete this employee?')) return
    startTransition(async () => {
      const res = await deleteEmployeeAction(id)
      if (res.success) setEmployees(prev => prev.filter(e => e.id !== id))
      else alert(res.error)
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const target = e.currentTarget
    startTransition(async () => {
      const formData = new FormData(target)

      formData.set('cvUrl', currentEmp?.cvUrl || '')
      formData.set('idUrl', currentEmp?.idUrl || '')

      const res = isEditing 
        ? await updateEmployeeAction(currentEmp.id, formData)
        : await createEmployeeAction(formData)
        
      if (res.success) {
        window.location.reload()
      } else {
        setError(res.error || 'Failed to save employee')
      }
    })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={openAdd} className="new-order-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserPlus size={18} /> New Employee
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-main)' }}>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Name</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Role</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Wage</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Phone</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Status</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Assigned Jobs</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Documents</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} style={{ transition: 'background 0.15s' }}>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>{emp.name}</td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-muted)' }}><Briefcase size={14} /> {emp.role}</div>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                  <div style={{ fontWeight: 500 }}>{emp.wageAmount.toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.wageType}</div>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>{emp.phone || '—'}</td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ padding: '3px 10px', background: emp.status === 'Active' ? '#D1FAE5' : '#FEF2F2', color: emp.status === 'Active' ? '#065F46' : '#DC2626', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                    {emp.status}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 500 }}>{emp._count.assignedJobs}</td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {emp.cvUrl ? (
                      <a href={emp.cvUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 600 }} title="View CV">
                        📄 CV
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>No CV</span>
                    )}
                    {emp.idUrl ? (
                      <a href={emp.idUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 600 }} title="View ID">
                        🪪 ID
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>No ID</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => openEdit(emp)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-dark)', borderRadius: '6px', cursor: 'pointer' }}><PencilSimple size={14} /> Edit</button>
                    <button onClick={() => handleDelete(emp.id, emp._count.assignedJobs)} disabled={emp._count.assignedJobs > 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', fontSize: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '6px', cursor: emp._count.assignedJobs > 0 ? 'not-allowed' : 'pointer', opacity: emp._count.assignedJobs > 0 ? 0.5 : 1 }}><Trash size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isDrawerOpen && (
        <>
          <div onClick={() => setIsDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', background: 'var(--bg-surface)', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px' }}>{isEditing ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Full Name *</label>
                <input name="name" required defaultValue={currentEmp?.name} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Phone Number</label>
                <input name="phone" type="tel" defaultValue={currentEmp?.phone} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Role / Title</label>
                <select name="role" defaultValue={currentEmp?.role || 'Cleaner'} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--input-bg)' }}>
                  <option value="Cleaner">Cleaner</option>
                  <option value="Lead Cleaner">Lead Cleaner</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Washer">Washer</option>
                  <option value="Ironer">Ironer</option>
                  <option value="Driver">Driver</option>
                  <option value="Helper">Helper</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Wage Type</label>
                  <select name="wageType" defaultValue={currentEmp?.wageType || 'Monthly'} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--input-bg)' }}>
                    <option value="Monthly">Monthly</option>
                    <option value="Daily">Daily</option>
                    <option value="Per Job">Per Job</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Wage Amount</label>
                  <input name="wageAmount" type="number" step="0.01" defaultValue={currentEmp?.wageAmount || ''} placeholder="e.g. 500" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Status</label>
                <select name="status" defaultValue={currentEmp?.status || 'Active'} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--input-bg)' }}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive / On Leave</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>CV / Resume</label>
                {currentEmp?.cvUrl ? (
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                    <a href={currentEmp.cvUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                      📄 View Current CV
                    </a>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
                    No CV uploaded. File uploads are unavailable in this demo.
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Identification Document</label>
                {currentEmp?.idUrl ? (
                  <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                    <a href={currentEmp.idUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                      🪪 View Current ID
                    </a>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
                    No ID uploaded. File uploads are unavailable in this demo.
                  </p>
                )}
              </div>

              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}><Warning size={18} /> {error}</div>}
              
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ width: '100%', opacity: isPending ? 0.6 : 1 }}>{isPending ? 'Saving...' : 'Save Employee'}</button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
