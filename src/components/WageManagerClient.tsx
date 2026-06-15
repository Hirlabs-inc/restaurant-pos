'use client'

import { useState, useTransition } from 'react'
import { recordWagePaymentAction, recordBulkSalariesPaymentAction } from '../app/actions'
import { Money, CalendarBlank, Briefcase, FileText } from '@phosphor-icons/react'

export default function WageManagerClient({ employees, recentPayments, currency }: { employees: any[], recentPayments: any[], currency: string }) {
  const [activeTab, setActiveTab] = useState<'employees' | 'history'>('employees')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkNotes, setBulkNotes] = useState(() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `Bulk salary payment for ${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`
  })

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Pre-process employees to calculate payment status and unpaid jobs
  const processedEmployees = employees.map(emp => {
    const latestPayment = emp.wagePayments && emp.wagePayments.length > 0 
      ? emp.wagePayments[0] 
      : null
    const latestPaymentDate = latestPayment ? new Date(latestPayment.date) : null

    const hasPaymentThisMonth = emp.wagePayments 
      ? emp.wagePayments.some((p: any) => {
          const pDate = new Date(p.date)
          return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth
        })
      : false

    const unpaidJobs = emp.assignedJobs 
      ? emp.assignedJobs.filter((job: any) => {
          if (!latestPaymentDate) return true
          return new Date(job.createdAt) > latestPaymentDate
        })
      : []
    const unpaidJobsCount = unpaidJobs.length

    let isUnpaid = false
    if (emp.wageType === 'Monthly' || emp.wageType === 'Daily') {
      isUnpaid = !hasPaymentThisMonth
    } else if (emp.wageType === 'Per Job') {
      isUnpaid = unpaidJobsCount > 0
    } else {
      isUnpaid = true
    }

    return {
      ...emp,
      latestPaymentDate,
      hasPaymentThisMonth,
      unpaidJobs,
      unpaidJobsCount,
      isUnpaid
    }
  })

  const unpaidEmployees = processedEmployees.filter(emp => emp.isUnpaid)
  const unpaidSalariesEmployees = unpaidEmployees.filter(emp => emp.wageType === 'Monthly' || emp.wageType === 'Daily')

  const openPaymentModal = (emp: any) => {
    setSelectedEmp(emp)
    
    let defaultAmount = ''
    let defaultNotes = ''

    if (emp.wageType === 'Per Job') {
      defaultAmount = (emp.unpaidJobsCount * emp.wageAmount).toString()
      defaultNotes = `Payment for ${emp.unpaidJobsCount} job(s)`
    } else if (emp.wageType === 'Monthly') {
      defaultAmount = emp.wageAmount ? emp.wageAmount.toString() : ''
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      defaultNotes = `Wage payment for ${monthNames[new Date().getMonth()]} ${new Date().getFullYear()}`
    } else {
      defaultAmount = emp.wageAmount ? emp.wageAmount.toString() : ''
      defaultNotes = `Wage payment for period ending ${new Date().toLocaleDateString()}`
    }

    setAmount(defaultAmount)
    setNotes(defaultNotes)
    setIsModalOpen(true)
  }

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) return alert('Invalid amount')
    startTransition(async () => {
      const res = await recordWagePaymentAction(selectedEmp.id, Number(amount), notes)
      if (res.success) {
        setIsModalOpen(false)
        window.location.reload()
      } else {
        alert(res.error)
      }
    })
  }

  const handleBulkPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (unpaidSalariesEmployees.length === 0) return
    const payments = unpaidSalariesEmployees.map(emp => ({
      employeeId: emp.id,
      amount: emp.wageAmount,
      notes: bulkNotes || `Bulk wage payment for ${new Date().toLocaleDateString()}`
    }))

    startTransition(async () => {
      const res = await recordBulkSalariesPaymentAction(payments)
      if (res.success) {
        setIsBulkModalOpen(false)
        window.location.reload()
      } else {
        alert(res.error)
      }
    })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setActiveTab('employees')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'employees' ? 'var(--primary)' : 'var(--bg-surface)', color: activeTab === 'employees' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'employees' ? 'none' : '1px solid var(--border-light)' }}>
            Pay Employees
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'history' ? 'var(--primary)' : 'var(--bg-surface)', color: activeTab === 'history' ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: 600, borderBottom: activeTab === 'history' ? 'none' : '1px solid var(--border-light)' }}>
            Payment History
          </button>
        </div>
        {activeTab === 'employees' && unpaidSalariesEmployees.length > 0 && (
          <button
            onClick={() => setIsBulkModalOpen(true)}
            style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Money size={18} /> Bulk Pay Salaries ({unpaidSalariesEmployees.length})
          </button>
        )}
      </div>

      {activeTab === 'employees' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {unpaidEmployees.map(emp => (
            <div key={emp.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>{emp.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Briefcase size={14} /> {emp.role}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#065F46' }}>{currency}{emp.wageAmount.toLocaleString()}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{emp.wageType}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  {emp.wageType === 'Per Job' ? (
                    <>
                      <div style={{ fontWeight: 600, color: '#DC2626' }}>{emp.unpaidJobsCount}</div>
                      <div style={{ fontSize: '11px' }}>Unpaid Jobs</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp._count.assignedJobs}</div>
                      <div style={{ fontSize: '11px' }}>Total Jobs</div>
                    </>
                  )}
                </div>
                {emp.wageType === 'Per Job' && (
                  <div style={{ flex: 1, borderLeft: '1px solid var(--border-light)', paddingLeft: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp._count.assignedJobs}</div>
                    <div style={{ fontSize: '11px' }}>Total Jobs</div>
                  </div>
                )}
                <div style={{ flex: 1, borderLeft: '1px solid var(--border-light)', paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {emp.latestPaymentDate ? emp.latestPaymentDate.toLocaleDateString() : 'Never'}
                  </div>
                  <div style={{ fontSize: '11px' }}>Last Paid</div>
                </div>
              </div>

              <button 
                onClick={() => openPaymentModal(emp)}
                style={{ marginTop: 'auto', width: '100%', padding: '12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                <Money size={18} /> Record Payment
              </button>
            </div>
          ))}
          {unpaidEmployees.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              No employees with unpaid wages or jobs found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)' }}>
                <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Date</th>
                <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Employee</th>
                <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Amount</th>
                <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarBlank size={16} /> {new Date(p.date).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 600 }}>{p.employee.name}</td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 700, color: '#065F46' }}>{currency}{p.amount.toFixed(2)}</td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {p.notes ? <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> {p.notes}</div> : '—'}
                  </td>
                </tr>
              ))}
              {recentPayments.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No payment history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <>
          <div onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px', background: 'var(--bg-surface)', zIndex: 200, borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Pay {selectedEmp?.name}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>
            
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Wage Structure:</span>
                <span style={{ fontWeight: 600 }}>{currency}{selectedEmp?.wageAmount} ({selectedEmp?.wageType})</span>
              </div>

              {selectedEmp?.wageType === 'Per Job' && (
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginTop: '-8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Unpaid Jobs:</span>
                  <span style={{ fontWeight: 600, color: '#DC2626' }}>{selectedEmp?.unpaidJobsCount} job(s)</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Payment Amount ({currency})</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '18px', fontWeight: 600 }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Notes / Period</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  rows={2} 
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '14px', resize: 'vertical' }} 
                />
              </div>

              <button type="submit" disabled={isPending} style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '15px', marginTop: '8px', cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}>
                {isPending ? 'Processing...' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        </>
      )}

      {isBulkModalOpen && (
        <>
          <div onClick={() => setIsBulkModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '480px', background: 'var(--bg-surface)', zIndex: 200, borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Bulk Pay Salaries</h2>
              <button onClick={() => setIsBulkModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>
            
            <form onSubmit={handleBulkPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                You are about to record salary payments for all <strong>{unpaidSalariesEmployees.length}</strong> active employees who haven't been paid this month.
              </p>

              <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {unpaidSalariesEmployees.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{emp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.role} • {emp.wageType}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{currency}{emp.wageAmount.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderTop: '1px solid var(--border-light)', fontSize: '16px', fontWeight: 700 }}>
                <span>Total Payment:</span>
                <span style={{ color: '#059669', fontSize: '20px', fontWeight: 800 }}>
                  {currency}{unpaidSalariesEmployees.reduce((sum, emp) => sum + emp.wageAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Notes / Period</label>
                <textarea 
                  value={bulkNotes} 
                  onChange={e => setBulkNotes(e.target.value)} 
                  rows={2} 
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '14px', resize: 'vertical' }} 
                />
              </div>

              <button type="submit" disabled={isPending} style={{ width: '100%', padding: '14px', background: '#059669', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '15px', marginTop: '8px', cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}>
                {isPending ? 'Processing...' : 'Confirm Bulk Payment'}
              </button>
            </form>
          </div>
        </>
      )}
    </>
  )
}
