'use client';

import { useState, useTransition } from 'react';
import { createPaymentMethodAction, deletePaymentMethodAction } from '../app/actions';
import { Trash } from '@phosphor-icons/react';

export default function PaymentMethodManager({ initialMethods }: { initialMethods: any[] }) {
  const [methods, setMethods] = useState(initialMethods);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await createPaymentMethodAction(formData);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    startTransition(async () => {
      const res = await deletePaymentMethodAction(id);
      if (res.success) {
        setMethods(prev => prev.filter(m => m.id !== id));
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
      <h3 style={{ marginBottom: '8px' }}>Payment Methods</h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Manage methods like Cash, Bank, Mobile Money.</p>
      
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input 
          name="name" 
          required 
          placeholder="e.g. M-Pesa" 
          style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)', fontSize: '14px' }}
        />
        <button 
          type="submit" 
          disabled={isPending}
          style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}
        >
          Add
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {methods.map(method => (
          <div key={method.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontWeight: 500 }}>{method.name}</span>
            <button 
              onClick={() => handleDelete(method.id)} 
              disabled={isPending}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: isPending ? 0.7 : 1 }}
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
        {methods.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No payment methods added. "CASH" and "RECEIVABLE" are built-in.</div>
        )}
      </div>
    </div>
  );
}

