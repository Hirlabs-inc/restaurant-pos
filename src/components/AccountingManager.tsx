'use client';

import { useState, useTransition } from 'react';
import { createExpenseAction, deleteExpenseAction, createTransferAction } from '../app/actions';
import { Printer, ArrowsLeftRight, Plus, Trash } from '@phosphor-icons/react';

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Supplies', 'Salaries', 'Maintenance', 'Marketing', 'General'];

export default function AccountingManager({ 
  totalRevenue, 
  totalExpenses, 
  initialExpenses,
  allOrders,
  paymentMethods,
  transfers,
  currency = '$',
  tenant
}: { 
  totalRevenue: number, 
  totalExpenses: number, 
  initialExpenses: any[],
  allOrders: any[],
  paymentMethods: any[],
  transfers: any[],
  currency?: string,
  tenant?: any
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [isPending, startTransition] = useTransition();

  const netProfit = totalRevenue - totalExpenses;

  // Compile full list of payment methods used in the system
  const allMethods = ['CASH', 'RECEIVABLE', ...paymentMethods.map(m => m.name)];
  
  // Calculate balances per method
  const balances: Record<string, number> = {};
  allMethods.forEach(m => balances[m] = 0);
  
  // Orders add to balance
  allOrders.forEach(o => {
    const method = o.paymentMethod || 'CASH';
    if (balances[method] === undefined) balances[method] = 0;
    balances[method] += o.paidAmount;
  });
  
  // Expenses deduct from balance
  expenses.forEach(e => {
    const method = e.paymentMethod || 'CASH';
    if (balances[method] === undefined) balances[method] = 0;
    balances[method] -= e.amount;
  });
  
  // Transfers shift balance
  transfers.forEach(t => {
    if (balances[t.fromMethod] !== undefined) balances[t.fromMethod] -= t.amount;
    if (balances[t.toMethod] !== undefined) balances[t.toMethod] += t.amount;
  });

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    startTransition(async () => {
      const res = await deleteExpenseAction(id);
      if (res.success) {
        setExpenses(prev => prev.filter(e => e.id !== id));
        window.location.reload(); // Refresh totals
      } else {
        alert(res.error);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createExpenseAction(formData);
      if (res.success) {
        window.location.reload();
      } else alert(res.error);
    });
  };

  const handleTransfer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createTransferAction(formData);
      if (res.success) {
        window.location.reload();
      } else alert(res.error);
    });
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-12px', marginTop: '12px' }}>
        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
          <Printer size={16} /> Print Financial Statement
        </button>
      </div>
      {/* ── Financial Summary Cards ── */}
      <div className="services-grid" style={{ marginTop: '24px', marginBottom: '32px' }}>
        {/* Revenue Card */}
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '13px', color: '#065F46', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#10B981' }}>{currency}{totalRevenue.toFixed(2)}</div>
        </div>
        {/* Expenses Card */}
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '13px', color: '#991B1B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expenses</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: '#EF4444' }}>{currency}{totalExpenses.toFixed(2)}</div>
        </div>
        {/* Profit Card */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Profit</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: netProfit >= 0 ? 'var(--text-main)' : '#EF4444' }}>
            {netProfit >= 0 ? '+' : '-'}{currency}{Math.abs(netProfit).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px' }}>Account Balances</h2>
        <button onClick={() => setIsTransferOpen(true)} className="stepper-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-dark)', color: 'var(--text-main)', width: 'auto' }}>
          <ArrowsLeftRight size={16} /> Transfer Funds
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {Object.entries(balances).filter(([k]) => k !== 'RECEIVABLE').map(([method, bal]) => (
          <div key={method} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{method}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: bal < 0 ? '#EF4444' : 'var(--text-main)' }}>
              {currency}{bal.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px' }}>Expenses</h2>
        <button onClick={() => setIsDrawerOpen(true)} className="new-order-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Plus size={16} /> Record Expense</button>
      </div>

      {/* ── Expenses Table ── */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflowX: 'auto', border: '1px solid var(--border-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-main)' }}>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Date</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Category</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Description</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} style={{ transition: 'background 0.15s' }}>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 500, color: 'var(--text-muted)' }}>
                  {new Date(e.date).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ padding: '4px 10px', background: 'var(--bg-main)', border: '1px solid var(--border-dark)', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                    {e.category}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>{e.description || '—'}</td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#EF4444' }}>-{currency}{e.amount.toFixed(2)}</div>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                  <button onClick={() => handleDelete(e.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', fontSize: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '6px', cursor: 'pointer' }}><Trash size={14} /></button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Slide-in Drawer ── */}
      {isDrawerOpen && (
        <>
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px',
            background: 'var(--bg-surface)', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'auto'
          }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px' }}>Record Expense</h2>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Date *</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Category *</label>
                <select name="category" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-surface)' }}>
                  {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Paid From (Account) *</label>
                <select name="paymentMethod" style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-surface)' }}>
                  {allMethods.filter(m => m !== 'RECEIVABLE').map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Amount ({currency}) *</label>
                <input name="amount" type="number" step="0.01" min="0" required placeholder="0.00"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Description</label>
                <textarea name="description" rows={3} placeholder="e.g. Monthly electricity bill..."
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ width: '100%', opacity: isPending ? 0.6 : 1, background: '#DC2626' }}>
                  {isPending ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      {/* ── Transfer Drawer ── */}
      {isTransferOpen && (
        <>
          <div
            onClick={() => setIsTransferOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px',
            background: 'var(--bg-surface)', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'auto'
          }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px' }}>Transfer Funds</h2>
              <button onClick={() => setIsTransferOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>

            <form onSubmit={handleTransfer} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>From Account *</label>
                <select name="fromMethod" required style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-surface)' }}>
                  <option value="">Select account...</option>
                  {allMethods.filter(m => m !== 'RECEIVABLE').map(m => <option key={m} value={m}>{m} ({currency}{balances[m]?.toFixed(2) || '0.00'})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>To Account *</label>
                <select name="toMethod" required style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-surface)' }}>
                  <option value="">Select account...</option>
                  {allMethods.filter(m => m !== 'RECEIVABLE').map(m => <option key={m} value={m}>{m} ({currency}{balances[m]?.toFixed(2) || '0.00'})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Amount ({currency}) *</label>
                <input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending} className="charge-btn" style={{ width: '100%', opacity: isPending ? 0.6 : 1, background: 'var(--primary)' }}>
                  {isPending ? 'Processing...' : 'Transfer Funds'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Hidden A4 Printable Financial Statement ── */}
      {printMode && (
        <div id="printable-a4" style={{ backgroundColor: 'white', color: 'black' }}>
          <div className="a4-page" style={{ padding: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid black', paddingBottom: '24px', marginBottom: '32px' }}>
              <div>
                {tenant?.logo && (
                  <img src={tenant.logo} alt="Store Logo" style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain', marginBottom: '12px' }} />
                )}
                <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'black' }}>{tenant?.name || 'Restaurant POS'}</h1>
                {tenant?.address && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#555', maxWidth: '250px' }}>{tenant.address}</p>
                )}
                <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>Statement Date: {new Date().toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '28px', margin: '0 0 12px 0', fontWeight: 800, color: 'black', textTransform: 'uppercase', letterSpacing: '1px' }}>Financial Statement</h2>
              </div>
            </div>

            {/* P&L Summary */}
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '16px' }}>Profit & Loss Summary</h3>
            <table style={{ width: '100%', marginBottom: '40px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 0', fontSize: '15px' }}>Gross Revenue</td>
                  <td style={{ padding: '12px 0', fontSize: '15px', textAlign: 'right', fontWeight: 600, color: '#10B981' }}>{currency}{totalRevenue.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 0', fontSize: '15px' }}>Total Expenses</td>
                  <td style={{ padding: '12px 0', fontSize: '15px', textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>-{currency}{totalExpenses.toFixed(2)}</td>
                </tr>
                <tr style={{ borderBottom: '2px solid black' }}>
                  <td style={{ padding: '16px 0', fontSize: '18px', fontWeight: 700 }}>Net Profit</td>
                  <td style={{ padding: '16px 0', fontSize: '18px', textAlign: 'right', fontWeight: 700, color: netProfit >= 0 ? 'black' : '#EF4444' }}>
                    {netProfit >= 0 ? '' : '-'}{currency}{Math.abs(netProfit).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Account Balances */}
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '16px' }}>Account Balances</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
              {Object.entries(balances).filter(([k]) => k !== 'RECEIVABLE').map(([method, bal]) => (
                <div key={method} style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>{method}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: bal < 0 ? '#EF4444' : 'black' }}>
                    {currency}{bal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'black', fontWeight: 500 }}>Generated by Restaurant POS</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>MADE BY HIRLABS</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
