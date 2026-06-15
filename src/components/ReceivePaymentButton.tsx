'use client';
import { useState, useTransition } from 'react';
import { recordPaymentAction } from '../app/actions';
import { Money, Check } from '@phosphor-icons/react';

export default function ReceivePaymentButton({
  customerId,
  totalOwed,
  customerName,
  currency = '$'
}: {
  customerId: string;
  totalOwed: number;
  customerName: string;
  currency?: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(totalOwed.toFixed(2));
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    startTransition(async () => {
      const res = await recordPaymentAction(customerId, value);
      if (res.success) {
        setOpen(false);
        window.location.reload();
      } else {
        console.error('Payment failed:', res.error);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => { setAmount(totalOwed.toFixed(2)); setOpen(true); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px',
          background: '#10B981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '13px',
          cursor: 'pointer'
        }}
      >
        <Money size={16} /> Collect
      </button>

      {open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-surface)', padding: '32px', borderRadius: '16px',
            width: '380px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginBottom: '4px' }}>Collect Payment</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Recording payment from <strong>{customerName}</strong>
            </p>

            <div style={{
              background: '#FEF3C7', border: '1px solid #FCD34D',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: '#92400E' }}>Outstanding Balance</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#D97706' }}>{currency}{totalOwed.toFixed(2)}</div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>
                  Amount Received ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={totalOwed}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '12px', fontSize: '18px', fontWeight: 600,
                    border: '2px solid #10B981', borderRadius: '10px', outline: 'none'
                  }}
                />
                {parseFloat(amount) < totalOwed && parseFloat(amount) > 0 && (
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px' }}>
                    Partial payment — remaining balance: {currency}{(totalOwed - parseFloat(amount)).toFixed(2)}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setOpen(false)} style={{
                  flex: 1, padding: '12px', background: 'var(--bg-main)',
                  border: '1px solid var(--border-dark)', borderRadius: '8px',
                  fontWeight: 600, cursor: 'pointer'
                }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} style={{
                  flex: 1, padding: '12px', background: '#10B981', color: 'white',
                  border: 'none', borderRadius: '8px', fontWeight: 600,
                  cursor: 'pointer', opacity: isPending ? 0.7 : 1
                }}>
                  {isPending ? 'Saving...' : <><Check size={16} /> Confirm Payment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

