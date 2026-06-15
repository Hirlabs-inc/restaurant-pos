'use client';

import { useTransition } from 'react';
import { updateStoreAction } from '../app/actions';

export default function UpdateStoreForm({ tenant }: { tenant: any }) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateStoreAction(formData);
      if (res.success) {
        console.log('Store updated!');
        alert('Store information saved successfully.');
        window.location.reload();
      } else {
        console.error('Failed to update:', res.error);
        alert('Failed to update: ' + res.error);
      }
    });
  };

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
      <h3 style={{ marginBottom: '16px' }}>Store Information</h3>
      <form action={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Store Name</label>
          <input name="name" type="text" defaultValue={tenant?.name || 'My Restaurant'} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Store Address</label>
          <textarea name="address" defaultValue={tenant?.address || ''} rows={3} placeholder="123 Main St, City, Country" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Store Phone</label>
          <input name="phone" type="tel" defaultValue={tenant?.phone || ''} placeholder="+254..." style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Store Logo</label>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-dark)' }}>
            Image uploads are unavailable in this demo. The store initial will be shown instead.
          </p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Tax Rate (%)</label>
          <input name="taxRate" type="number" step="0.1" defaultValue={tenant?.taxRate ?? 10} required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Currency</label>
          <select name="currency" defaultValue={tenant?.currency || '$'} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
            <option value="$">$ (USD)</option>
            <option value="€">€ (EUR)</option>
            <option value="£">£ (GBP)</option>
            <option value="KSh">KSh (KES)</option>
            <option value="₦">₦ (NGN)</option>
            <option value="R">R (ZAR)</option>
            <option value="₹">₹ (INR)</option>
            <option value="A$">A$ (AUD)</option>
            <option value="C$">C$ (CAD)</option>
          </select>
        </div>
        <button type="submit" disabled={isPending} className="new-order-btn" style={{ alignSelf: 'flex-start', marginTop: '8px', opacity: isPending ? 0.7 : 1 }}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

