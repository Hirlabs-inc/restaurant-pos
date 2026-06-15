'use client';

import { useState, useTransition } from 'react';
import { createCustomerAction, updateCustomerAction, deleteCustomerAction, getCustomerInvoicesAction } from '../app/actions';
import ReceivePaymentButton from './ReceivePaymentButton';
import { UserPlus, MapPin, Phone, Envelope, FileText, PencilSimple, Trash, Printer } from '@phosphor-icons/react';

export default function CustomerManager({ initialCustomers, currency = '$', userRole }: { initialCustomers: any[], currency?: string, userRole?: string }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const [invoicesModalCustomer, setInvoicesModalCustomer] = useState<any>(null);
  const [customerInvoices, setCustomerInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [isFetchingInvoices, setIsFetchingInvoices] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  const openInvoices = async (customer: any) => {
    setInvoicesModalCustomer(customer);
    setIsFetchingInvoices(true);
    setPrintMode(false);
    const res = await getCustomerInvoicesAction(customer.id);
    setIsFetchingInvoices(false);
    if (res.success) {
      setCustomerInvoices(res.orders || []);
      setSelectedInvoices(new Set());
    } else {
      alert(res.error);
      setInvoicesModalCustomer(null);
    }
  };

  const handlePrint = () => {
    if (selectedInvoices.size === 0) return alert('Select at least one invoice to print.');
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 300);
  };

  const openAdd = () => {
    setIsEditing(false);
    setCurrentCustomer(null);
    setIsDrawerOpen(true);
  };

  const openEdit = (customer: any) => {
    setIsEditing(true);
    setCurrentCustomer(customer);
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    startTransition(async () => {
      const res = await deleteCustomerAction(id);
      if (res.success) {
        setCustomers(prev => prev.filter(c => c.id !== id));
      } else {
        alert(res.error);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (isEditing) {
        const res = await updateCustomerAction(currentCustomer.id, formData);
        if (res.success) {
          window.location.reload(); // Quickest way to refresh order totals
        } else alert(res.error);
      } else {
        const res = await createCustomerAction(formData);
        if (res.success) {
          window.location.reload();
        } else alert(res.error);
      }
    });
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={openAdd} className="new-order-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UserPlus size={18} /> New Customer</button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', overflowX: 'auto', border: '1px solid var(--border-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-main)' }}>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Name</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Contact</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Orders</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Spent / Owed</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Status</th>
              <th style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => {
              const totalSpent = c.orders.reduce((s: number, o: any) => s + o.paidAmount, 0);
              const totalOwed = c.orders.reduce((s: number, o: any) => s + o.dueAmount, 0);
              const hasDebt = totalOwed > 0;

              return (
                <tr key={c.id} style={{ transition: 'background 0.15s' }}>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', fontWeight: 600 }}>
                    {c.name}
                    {c.address && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px' }}><MapPin size={12} /> {c.address}</div>}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}><Phone size={14} /> {c.phone || '—'}</div>
                    {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}><Envelope size={12} /> {c.email}</div>}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>{c._count.orders}</td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 500 }}>{currency}{totalSpent.toFixed(2)}</div>
                    {hasDebt && <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '12px', marginTop: '2px' }}>Owes: {currency}{totalOwed.toFixed(2)}</div>}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                    {hasDebt ? (
                      <span style={{ padding: '4px 10px', background: '#FEF2F2', color: '#DC2626', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>Owes Money</span>
                    ) : (
                      <span style={{ padding: '4px 10px', background: '#D1FAE5', color: '#065F46', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>Settled</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {hasDebt && (
                        <ReceivePaymentButton
                          customerId={c.id}
                          totalOwed={totalOwed}
                          customerName={c.name}
                          currency={currency}
                        />
                      )}
                      <button onClick={() => openInvoices(c)} disabled={c._count.orders === 0} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-dark)', borderRadius: '6px', cursor: c._count.orders === 0 ? 'not-allowed' : 'pointer', opacity: c._count.orders === 0 ? 0.5 : 1 }}><FileText size={14} /> Invoices</button>
                      <button onClick={() => openEdit(c)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-dark)', borderRadius: '6px', cursor: 'pointer' }}><PencilSimple size={14} /> Edit</button>
                      {userRole !== 'cashier' && (
                        <button onClick={() => handleDelete(c.id)} disabled={c._count.orders > 0} title={c._count.orders > 0 ? "Cannot delete customer with orders" : ""} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', fontSize: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '6px', cursor: c._count.orders > 0 ? 'not-allowed' : 'pointer', opacity: c._count.orders > 0 ? 0.5 : 1 }}><Trash size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customers yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 150, backdropFilter: 'blur(2px)'
            }}
          />
          {/* Drawer panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
            background: 'var(--bg-surface)', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'auto'
          }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px' }}>{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setIsDrawerOpen(false)} style={{
                background: 'none', border: 'none', fontSize: '22px',
                cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1
              }}>✕</button>
            </div>

            <form onSubmit={(e) => { handleSubmit(e); setIsDrawerOpen(false); }}
              style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Full Name *
                </label>
                <input name="name" required defaultValue={currentCustomer?.name} placeholder="e.g. Jane Doe"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Phone Number
                </label>
                <input name="phone" type="tel" defaultValue={currentCustomer?.phone} placeholder="+1 234 567 890"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Email Address
                </label>
                <input name="email" type="email" defaultValue={currentCustomer?.email} placeholder="jane@example.com"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Physical Address
                </label>
                <textarea name="address" defaultValue={currentCustomer?.address} rows={2} placeholder="123 Main St, City"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', resize: 'vertical' }}></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Notes
                </label>
                <textarea name="notes" defaultValue={currentCustomer?.notes} rows={2} placeholder="Special preferences..."
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', resize: 'vertical' }}></textarea>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending}
                  className="charge-btn"
                  style={{ width: '100%', opacity: isPending ? 0.6 : 1 }}>
                  {isPending ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Invoices Modal */}
      {invoicesModalCustomer && (
        <>
          {!printMode && (
            <div onClick={() => setInvoicesModalCustomer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150, backdropFilter: 'blur(2px)' }} />
          )}
          
          <div className={printMode ? 'no-print' : ''} style={{
            position: 'fixed', top: '5vh', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '700px',
            background: 'var(--bg-surface)', zIndex: 200, borderRadius: '16px', display: printMode ? 'none' : 'flex', flexDirection: 'column',
            maxHeight: '90vh', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px' }}>Invoices: {invoicesModalCustomer.name}</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select invoices to print A4 copies.</p>
              </div>
              <button onClick={() => setInvoicesModalCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {isFetchingInvoices ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading invoices...</div>
              ) : customerInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No invoices found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
                        <input type="checkbox" 
                          checked={selectedInvoices.size === customerInvoices.length && customerInvoices.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedInvoices(new Set(customerInvoices.map(i => i.id)));
                            else setSelectedInvoices(new Set());
                          }}
                        />
                      </th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Order #</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Date</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Total</th>
                      <th style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
                          <input type="checkbox" checked={selectedInvoices.has(inv.id)} onChange={(e) => {
                            const newSet = new Set(selectedInvoices);
                            if (e.target.checked) newSet.add(inv.id);
                            else newSet.delete(inv.id);
                            setSelectedInvoices(newSet);
                          }} />
                        </td>
                        <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 500 }}>{inv.orderNumber}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 600 }}>{currency}{inv.totalPrice.toFixed(2)}</td>
                        <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                           {inv.status === 'COMPLETED' ? <span style={{ color: '#065F46' }}>Completed</span> : <span style={{ color: '#D97706' }}>Pending</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setInvoicesModalCustomer(null)} style={{ padding: '10px 16px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-dark)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handlePrint} disabled={selectedInvoices.size === 0 || isFetchingInvoices} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: selectedInvoices.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedInvoices.size === 0 ? 0.5 : 1 }}>
                <Printer size={16} /> Print Selected ({selectedInvoices.size})
              </button>
            </div>
          </div>

          {/* Hidden A4 Printable Area */}
          {printMode && (
            <div id="printable-a4" style={{ backgroundColor: 'white', color: 'black' }}>
              {customerInvoices.filter(i => selectedInvoices.has(i.id)).map((invoice, index) => (
                <div key={invoice.id} className="a4-page" style={{ padding: '40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid black', paddingBottom: '24px', marginBottom: '32px' }}>
                    <div>
                      {invoice.tenant?.logo && (
                        <img src={invoice.tenant.logo} alt="Store Logo" style={{ maxHeight: '60px', maxWidth: '200px', objectFit: 'contain', marginBottom: '12px' }} />
                      )}
                      <h1 style={{ fontSize: '24px', margin: '0 0 4px 0', color: 'black' }}>{invoice.tenant?.name || 'Restaurant POS'}</h1>
                      {invoice.tenant?.address && (
                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#555', maxWidth: '250px' }}>{invoice.tenant.address}</p>
                      )}
                      <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>Invoice Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>Invoice #: <strong>{invoice.orderNumber}</strong></p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h2 style={{ fontSize: '42px', margin: '0 0 12px 0', fontWeight: 800, color: 'black', textTransform: 'uppercase', letterSpacing: '2px' }}>INVOICE</h2>
                      <div style={{ padding: '8px 16px', background: '#f4f4f4', display: 'inline-block', borderRadius: '4px' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>Amount Due</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: 'black' }}>{currency}{invoice.dueAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Bill To:</p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'black' }}>{invoice.customer.name}</p>
                      {invoice.customer.phone && <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{invoice.customer.phone}</p>}
                      {invoice.customer.email && <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{invoice.customer.email}</p>}
                      {invoice.customer.address && <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#333', maxWidth: '250px' }}>{invoice.customer.address}</p>}
                    </div>
                    {invoice.fulfillment && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Order Type:</p>
                        <p style={{ margin: 0, fontSize: '14px', color: 'black', fontWeight: 500 }}>
                          {invoice.fulfillment.replace('_', ' ')}
                          {invoice.fulfillment === 'DINE_IN' && invoice.tableNumber && ` (${invoice.tableNumber})`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid black' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'left', color: 'black', fontSize: '14px' }}>Item Description</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', color: 'black', fontSize: '14px', width: '80px' }}>Qty</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: 'black', fontSize: '14px', width: '120px' }}>Price</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right', color: 'black', fontSize: '14px', width: '120px' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.orderItems.map((item: any) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '16px 8px', color: 'black', fontSize: '15px' }}>{item.menuItem?.name || 'Unknown Item'}</td>
                          <td style={{ padding: '16px 8px', textAlign: 'center', color: 'black', fontSize: '15px' }}>{item.quantity}</td>
                          <td style={{ padding: '16px 8px', textAlign: 'right', color: 'black', fontSize: '15px' }}>{currency}{item.price.toFixed(2)}</td>
                          <td style={{ padding: '16px 8px', textAlign: 'right', color: 'black', fontSize: '15px', fontWeight: 600 }}>{currency}{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
                    <div style={{ width: '300px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ddd', color: 'black' }}>
                        <span style={{ fontSize: '14px' }}>Subtotal</span>
                        <span style={{ fontSize: '14px' }}>{currency}{invoice.totalPrice.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '2px solid black', color: 'black', fontWeight: 700, fontSize: '18px' }}>
                        <span>Total Due</span>
                        <span>{currency}{invoice.dueAmount.toFixed(2)}</span>
                      </div>
                      {invoice.paidAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#555' }}>
                          <span style={{ fontSize: '14px' }}>Amount Paid</span>
                          <span style={{ fontSize: '14px' }}>{currency}{invoice.paidAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: 'auto', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'black', fontWeight: 500 }}>Thank you for your business!</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>MADE BY HIRLABS</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

