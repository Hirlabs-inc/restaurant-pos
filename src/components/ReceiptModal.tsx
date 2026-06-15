'use client';

import { Printer, ForkKnife, Clock } from '@phosphor-icons/react';

export type ReceiptData = {
  orderNumber: string;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  date: string;
  notes?: string;
  fulfillment?: string;
  tableNumber?: string;
  scheduledDate?: string;
  staffName?: string;
};

export default function ReceiptModal({
  receiptInfo,
  onClose,
  storeLogo,
  storeName,
  storeAddress,
  storePhone,
  currency,
  taxRate
}: {
  receiptInfo: ReceiptData;
  onClose: () => void;
  storeLogo?: string;
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  currency: string;
  taxRate: number;
}) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div id="printable-receipt" className="receipt-container" style={{
        background: 'var(--bg-surface)',
        padding: '24px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        color: 'var(--text-main)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-dark)', paddingBottom: '16px', marginBottom: '16px' }}>
          {storeLogo ? (
            <img src={storeLogo} alt="Store Logo" style={{ width: '120px', height: '80px', objectFit: 'contain', margin: '0 auto 12px', borderRadius: '12px' }} />
          ) : (
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><ForkKnife size={48} /></div>
          )}
          <h2 style={{ marginBottom: '4px', fontSize: '20px', fontWeight: 700, textTransform: 'uppercase' }}>{storeName}</h2>
          {storeAddress && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.2' }}>{storeAddress}</p>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.4' }}>
            <p>Order: <strong>{receiptInfo.orderNumber}</strong></p>
            <p>Staff: {receiptInfo.staffName}</p>
            <p>Customer: {receiptInfo.customerName}</p>
            <p>Date: {receiptInfo.date}</p>
          </div>

          {receiptInfo.fulfillment && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              <strong>Type:</strong> {receiptInfo.fulfillment.replace('_', ' ')}
              {receiptInfo.fulfillment === 'DINE_IN' && receiptInfo.tableNumber && (
                <> (<strong>{receiptInfo.tableNumber}</strong>)</>
              )}
            </p>
          )}
          {receiptInfo.scheduledDate && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              <strong>Scheduled Time:</strong> {receiptInfo.scheduledDate}
            </p>
          )}
          {receiptInfo.notes && (
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px', fontStyle: 'italic', background: 'var(--bg-main)', padding: '6px', borderRadius: '4px' }}>
              "{receiptInfo.notes}"
            </p>
          )}
          {receiptInfo.paymentMethod === 'RECEIVABLE' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '12px', padding: '4px 12px', background: '#FEF3C7', color: '#B45309', borderRadius: '999px', fontSize: '11px', fontWeight: 700 }}>
              <Clock size={14} weight="bold" /> PAYMENT PENDING
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              <strong>Payment:</strong> {receiptInfo.paymentMethod}
            </p>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed var(--border-dark)', paddingBottom: '12px', marginBottom: '12px' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ paddingBottom: '8px', fontWeight: 600 }}>Item</th>
                <th style={{ paddingBottom: '8px', textAlign: 'right', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {receiptInfo.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 500 }}>{item.qty}x {item.name}</div>
                  </td>
                  <td style={{ padding: '6px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 600 }}>
                    {currency}{(item.price * item.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
            <span>{currency}{receiptInfo.subtotal.toFixed(2)}</span>
          </div>
          {receiptInfo.deliveryFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Fee</span>
              <span>{currency}{receiptInfo.deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tax ({taxRate}%)</span>
            <span>{currency}{receiptInfo.tax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, paddingTop: '8px', color: 'var(--text-main)' }}>
            <span>Total</span>
            <span>{currency}{receiptInfo.total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px dashed var(--border-dark)', paddingTop: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600 }}>Thank you for your business!</p>
          {storePhone && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
              Tel: {storePhone}
            </p>
          )}
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '0.1em', fontWeight: 700 }}>POWERED BY HIRLABS</p>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#F3F4F6',
              border: '1px solid #D1D5DB',
              borderRadius: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151'
            }}
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}
          >
            <Printer size={20} weight="bold" /> Print
          </button>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .receipt-container {
            width: 100% !important;
            max-width: 70mm !important; /* Adjusted for 72mm paper */
            padding: 0 !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Hide everything else */
          body > *:not(#printable-receipt) {
            display: none !important;
          }
          
          /* Force page size and remove browser headers/footers */
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
}
