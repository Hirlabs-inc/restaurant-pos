'use client'

import React, { useState, useTransition } from 'react'
import { Clock } from '@phosphor-icons/react'
import { deleteOrderAction, updateOrderStatusAction } from '../app/actions'

const STATUS_OPTIONS = ['PENDING', 'PREPARING', 'SERVED', 'COMPLETED', 'CANCELLED', 'DRAFT']

export default function OrderManagerClient({ 
  initialOrders, 
  currency,
  isSuperAdmin = false
}: { 
  initialOrders: any[], 
  currency: string,
  isSuperAdmin?: boolean
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [isPending, startTransition] = useTransition()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = (id: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY remove order ${orderNumber}? This action cannot be undone.`)) return
    
    startTransition(async () => {
      const res = await deleteOrderAction(id)
      if (res.success) {
        setOrders(prev => prev.filter(o => o.id !== id))
      } else {
        alert(res.error || 'Failed to delete order.')
      }
    })
  }

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction(id, newStatus)
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
      } else {
        alert(res.error || 'Failed to update status.')
      }
    })
  }

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (isSuperAdmin && o.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <input 
            type="text" 
            placeholder={isSuperAdmin ? "Search by Order #, Customer, or Restaurant..." : "Search by Order # or Customer..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '12px 16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-light)', 
              background: 'var(--bg-surface)', 
              width: '100%',
              maxWidth: '400px',
              fontSize: '14px' 
            }} 
          />
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-main)' }}>
              <th style={{ width: '40px' }}></th>
              {isSuperAdmin && <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Store</th>}
              {['Order #', 'Customer', 'Date', 'Amount', 'Payment', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => (
              <React.Fragment key={o.id}>
                <tr key={o.id} style={{ cursor: 'pointer', transition: 'background 0.2s' }} 
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                  <td style={{ paddingLeft: '20px', fontSize: '18px', color: 'var(--text-muted)' }}>
                    {expandedId === o.id ? '▾' : '▸'}
                  </td>
                  {isSuperAdmin && (
                    <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                        {o.tenant?.name}
                      </div>
                    </td>
                  )}
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: '13px' }}>
                    {o.orderNumber}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                    {o.customer.name}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 600, fontSize: '14px' }}>
                    {o.tenant?.currency || currency}{o.totalPrice.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {o.paymentMethod === 'RECEIVABLE' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> Later</span> : o.paymentMethod}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }} onClick={e => e.stopPropagation()}>
                    <select 
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      disabled={isPending}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid var(--border-dark)',
                        background: o.status === 'COMPLETED' ? '#D1FAE5' : o.status === 'DRAFT' ? '#F3F4F6' : o.status === 'CANCELLED' ? '#FEE2E2' : o.status === 'PREPARING' ? '#DBEAFE' : '#FEF3C7',
                        color: o.status === 'COMPLETED' ? '#065F46' : o.status === 'DRAFT' ? '#374151' : o.status === 'CANCELLED' ? '#991B1B' : o.status === 'PREPARING' ? '#1E40AF' : '#92400E',
                        cursor: 'pointer'
                      }}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }} onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDelete(o.id, o.orderNumber)}
                      disabled={isPending}
                      style={{ 
                        padding: '6px 14px', 
                        fontSize: '12px', 
                        border: '1px solid #FCA5A5', 
                        borderRadius: '8px', 
                        background: '#FEF2F2', 
                        color: '#DC2626', 
                        cursor: 'pointer', 
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                  {expandedId === o.id && (
                    <tr style={{ background: 'var(--bg-main)' }}>
                      <td></td>
                      <td colSpan={isSuperAdmin ? 8 : 7} style={{ padding: '20px 40px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                          <div>
                            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Order Items</h4>
                            {o.orderItems?.map((item: any) => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                <span>{item.quantity}x {item.menuItem?.name || 'Unknown Dish'}</span>
                                <span style={{ fontWeight: 600 }}>{(o.tenant?.currency || currency)}{(item.subtotal || 0).toFixed(2)}</span>
                              </div>
                            ))}
                            <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '12px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                              <span>Total</span>
                              <span>{(o.tenant?.currency || currency)}{(o.totalPrice || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        <div>
                          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Order Details</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                              <span style={{ fontWeight: 600 }}>{o.paymentMethod}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Staff (Created by):</span>
                              <span style={{ fontWeight: 600 }}>{o.user?.name || 'Unknown'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Order Type:</span>
                              <span style={{ fontWeight: 600 }}>
                                {o.fulfillment.replace('_', ' ')}
                                {o.fulfillment === 'DINE_IN' && o.tableNumber && ` (${o.tableNumber})`}
                              </span>
                            </div>
                            {o.notes && (
                              <div style={{ marginTop: '8px' }}>
                                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notes:</span>
                                <div style={{ background: 'var(--bg-surface)', padding: '8px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border-light)' }}>
                                  {o.notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
