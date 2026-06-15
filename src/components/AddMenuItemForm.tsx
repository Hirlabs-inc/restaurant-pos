'use client';

import { useState, useTransition } from 'react';
import { createMenuItemAction } from '../app/actions';

export default function AddMenuItemForm({ categories, currency = '$' }: { categories: any[], currency?: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(async () => {
      const res = await createMenuItemAction(formData);
      if (res.success) {
        console.log('Menu item added successfully!');
        window.location.reload(); // Quick way to refresh data
      } else {
        console.error('Failed to add menu item:', res.error);
      }
    });
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
      <h3 style={{ marginBottom: '16px' }}>Add New Menu Item</h3>
      <form action={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Dish Name</label>
          <input name="name" type="text" required placeholder="e.g. Margherita Pizza" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Category</label>
          <select name="category" required style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            {categories.length === 0 && <option value="Main Courses">Main Courses</option>}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Price ({currency})</label>
          <input name="price" type="number" step="0.01" required placeholder="12.99" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)' }} />
        </div>
        <button type="submit" disabled={isPending} className="new-order-btn" style={{ alignSelf: 'flex-start', marginTop: '8px', opacity: isPending ? 0.7 : 1 }}>
          {isPending ? 'Adding...' : 'Add Menu Item'}
        </button>
      </form>
    </div>
  );
}
