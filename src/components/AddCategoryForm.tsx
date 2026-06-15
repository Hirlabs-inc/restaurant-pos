'use client';

import { useTransition } from 'react';
import { createCategoryAction } from '../app/actions';

export default function AddCategoryForm() {
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(async () => {
      const res = await createCategoryAction(formData);
      if (res.success) {
        console.log('Category added!');
        window.location.reload();
      } else {
        console.error('Failed to add category:', res.error);
      }
    });
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
      <h3 style={{ marginBottom: '16px' }}>Add New Category</h3>
      <form action={handleAction} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', maxWidth: '500px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Category Name</label>
          <input name="name" type="text" required placeholder="e.g. Bedding" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)' }} />
        </div>
        <div style={{ width: '80px' }}>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-muted)' }}>Emoji</label>
          <input name="emoji" type="text" defaultValue="📁" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-md)' }} />
        </div>
        <button type="submit" disabled={isPending} className="new-order-btn" style={{ opacity: isPending ? 0.7 : 1 }}>
          {isPending ? 'Adding...' : 'Add Category'}
        </button>
      </form>
    </div>
  );
}

