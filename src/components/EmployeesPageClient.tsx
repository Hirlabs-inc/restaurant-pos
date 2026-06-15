'use client'

import { useState } from 'react'
import EmployeeManagerClient from './EmployeeManagerClient'
import WageManagerClient from './WageManagerClient'
import { Users, Money } from '@phosphor-icons/react'

interface EmployeesPageClientProps {
  employees: any[]
  wageEmployees: any[]
  recentPayments: any[]
  currency: string
}

export default function EmployeesPageClient({ employees, wageEmployees, recentPayments, currency }: EmployeesPageClientProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'wages'>('staff')

  const tabStyle = (tab: 'staff' | 'wages') => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none' as const,
    background: activeTab === tab ? 'var(--primary)' : 'var(--bg-surface)',
    color: activeTab === tab ? 'white' : 'var(--text-main)',
    cursor: 'pointer' as const,
    fontWeight: 600 as const,
    fontSize: '14px',
    borderBottom: activeTab === tab ? 'none' : '1px solid var(--border-light)',
    transition: 'all 0.15s',
  })

  return (
    <>
      {/* Tab header */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
        <button style={tabStyle('staff')} onClick={() => setActiveTab('staff')}>
          <Users size={17} weight="duotone" />
          Staff &amp; Field Workers
        </button>
        <button style={tabStyle('wages')} onClick={() => setActiveTab('wages')}>
          <Money size={17} weight="duotone" />
          Wages &amp; Payroll
        </button>
      </div>

      {activeTab === 'staff' && (
        <EmployeeManagerClient initialEmployees={employees} />
      )}

      {activeTab === 'wages' && (
        <WageManagerClient
          employees={wageEmployees}
          recentPayments={recentPayments}
          currency={currency}
        />
      )}
    </>
  )
}
