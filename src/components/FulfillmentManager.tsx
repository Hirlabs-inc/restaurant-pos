'use client';
import { useState, useTransition } from 'react';
import { createFulfillmentOptionAction, deleteFulfillmentOptionAction, updateFulfillmentOptionAction } from '../app/actions';
import { Truck, PencilSimple, Trash, Check } from '@phosphor-icons/react';

const FULFILLMENT_ICONS: Record<string, string> = {
  'Dine-in': '🍽️',
  'Dine In': '🍽️',
  'Takeaway': '🥡',
  'Take Away': '🥡',
  'Take-Away': '🥡',
  'Pickup': '📦',
  'Delivery': '🚚',
  'Express': '⚡',
  'Same-Day': '🌅',
};

function getIcon(name: string) {
  for (const key of Object.keys(FULFILLMENT_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return FULFILLMENT_ICONS[key];
  }
  return null;
}

export default function FulfillmentManager({ initialOptions, currency = '$' }: { initialOptions: any[], currency?: string }) {
  const [options, setOptions] = useState(initialOptions);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const openDrawerForAdd = () => {
    setEditingOption(null);
    setDrawerOpen(true);
  };

  const openDrawerForEdit = (option: any) => {
    setEditingOption(option);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingOption(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      if (editingOption) {
        const res = await updateFulfillmentOptionAction(editingOption.id, formData);
        if (res.success) window.location.reload();
        else alert('Error: ' + res.error);
      } else {
        const res = await createFulfillmentOptionAction(formData);
        if (res.success) window.location.reload();
        else alert('Error: ' + res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this fulfillment option?')) return;
    startTransition(async () => {
      const res = await deleteFulfillmentOptionAction(id);
      if (res.success) setOptions(prev => prev.filter(o => o.id !== id));
      else alert('Error: ' + res.error);
    });
  };

  return (
    <div className="main-content" style={{ position: 'relative' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Fulfillment Options</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {options.length} option{options.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={openDrawerForAdd}
          className="new-order-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Add Option
        </button>
      </div>

      {/* ── Option Cards ── */}
      <div style={{ marginTop: '32px' }}>
        {options.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '64px', border: '2px dashed var(--border-dark)', borderRadius: '16px', marginTop: '24px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><Truck size={48} /></div>
            <h3 style={{ marginBottom: '8px' }}>No fulfillment options yet</h3>
            <p style={{ fontSize: '14px' }}>Click <strong>+ Add Option</strong> to get started</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px',
          }}>
            {options.map(o => (
              <div key={o.id} style={{
                background: 'var(--bg-surface)', borderRadius: '14px',
                border: '1px solid var(--border-light)', overflow: 'hidden',
                transition: 'box-shadow 0.2s', display: 'flex', flexDirection: 'column',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                  <div style={{ height: '100px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getIcon(o.name) ? <span style={{ fontSize: '48px' }}>{getIcon(o.name)}</span> : <Truck size={48} />}
                  </div>

                {/* Body */}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{o.name}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>
                    {currency}{o.defaultFee.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Default delivery fee
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      onClick={() => openDrawerForEdit(o)}
                      disabled={isPending}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, padding: '7px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      <PencilSimple size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(o.id)}
                      disabled={isPending}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, padding: '7px', border: '1px solid #FCA5A5', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Slide-in Drawer (Add / Edit) ── */}
      {drawerOpen && (
        <>
          <div
            onClick={closeDrawer}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
            background: 'var(--bg-surface)', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'auto'
          }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>
                  {editingOption ? 'Edit Fulfillment Option' : 'New Fulfillment Option'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {editingOption ? 'Update the name or fee' : 'Add a delivery or pickup method'}
                </p>
              </div>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Option Name *</label>
                <input
                  name="name" required
                  defaultValue={editingOption?.name || ''}
                  placeholder="e.g. Dine-in, Takeaway, Delivery"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-surface)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>Default Fee ({currency}) *</label>
                <input
                  name="defaultFee" type="number" step="0.01" min="0" required
                  defaultValue={editingOption?.defaultFee ?? ''}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-surface)' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Enter 0 for free fulfillment options</p>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '12px' }}>
                <button type="button" onClick={closeDrawer} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-dark)', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="new-order-btn" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: isPending ? 0.6 : 1 }}>
                  {isPending ? 'Saving...' : editingOption ? <><Check size={16} /> Save Changes</> : '+ Add Option'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
