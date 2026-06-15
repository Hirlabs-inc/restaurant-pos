'use client';

import { useState } from 'react';
import { Printer } from '@phosphor-icons/react';
import ReceiptModal, { ReceiptData } from './ReceiptModal';

export default function PrintReceiptButton({
  order,
  storeName,
  storeLogo,
  storeAddress,
  storePhone,
  currency,
  taxRate
}: {
  order: any;
  storeName: string;
  storeLogo?: string;
  storeAddress?: string;
  storePhone?: string;
  currency: string;
  taxRate: number;
}) {
  const [showReceipt, setShowReceipt] = useState(false);

  const receiptData: ReceiptData = {
    orderNumber: order.orderNumber,
    items: order.orderItems.map((item: any) => ({
      name: item.menuItem?.name || item.service?.name || 'Item',
      qty: item.quantity,
      price: item.price
    })),
    subtotal: order.subtotal || 0,
    tax: order.taxAmount || 0,
    deliveryFee: order.deliveryFee || 0,
    total: order.totalPrice,
    paymentMethod: order.paymentMethod,
    customerName: order.customer.name,
    date: new Date(order.createdAt).toLocaleString(),
    notes: order.notes,
    fulfillment: order.fulfillment,
    scheduledDate: order.scheduledDate ? new Date(order.scheduledDate).toLocaleString() : undefined,
    staffName: order.user?.name
  };

  return (
    <>
      <button
        onClick={() => setShowReceipt(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-dark)',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          color: 'var(--text-main)'
        }}
      >
        <Printer size={16} /> Print
      </button>

      {showReceipt && (
        <ReceiptModal
          receiptInfo={receiptData}
          onClose={() => setShowReceipt(false)}
          storeName={storeName}
          storeLogo={storeLogo}
          storeAddress={storeAddress}
          storePhone={storePhone}
          currency={currency}
          taxRate={taxRate}
        />
      )}
    </>
  );
}
