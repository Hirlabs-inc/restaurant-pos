'use client';

import { useState, useTransition } from 'react';
import { createOrder, createCustomerAction, deleteOrderAction } from '../app/actions';
import { MagnifyingGlass, UserPlus, Check, Money, CreditCard, Clock, Warning, Basket, Printer, Trash, Tag } from '@phosphor-icons/react';
import ReceiptModal from './ReceiptModal';
import MenuItemIcon from './MenuItemIcon';

type Customer = { id: string; name: string; phone: string | null };

// Matches 'Walk-in', 'Walk in', 'walk in', etc.
const isWalkIn = (name: string) => name.trim().toLowerCase().replace(/[-\s]/g, '') === 'walkin';

export default function POSClient({
  initialMenuItems,
  initialCategories,
  initialCustomers,
  fulfillmentOptions = [],
  paymentMethods = [],
  draftOrders = [],
  taxRate = 10,
  currency = '$',
  storeName = 'RestaurantStore',
  storeLogo,
  storeAddress,
  storePhone,
  staffName
}: {
  initialMenuItems: any[];
  initialCategories: any[];
  initialCustomers: Customer[];
  fulfillmentOptions?: any[];
  paymentMethods?: any[];
  draftOrders?: any[];
  taxRate?: number;
  currency?: string;
  storeName?: string;
  storeLogo?: string;
  storeAddress?: string;
  storePhone?: string;
  staffName?: string;
}) {
  const [cart, setCart] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [isPending, startTransition] = useTransition();
  const [receiptInfo, setReceiptInfo] = useState<any>(null);

  // Customer & payment state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walkin');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'RECEIVABLE'>('CASH');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [customers, setCustomers] = useState(initialCustomers);
  const [isCreatingCustomer, startCustomerTransition] = useTransition();

  // Order options state
  const [notes, setNotes] = useState('');
  const [fulfillment, setFulfillment] = useState('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  
  // Drafts state
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null);
  const [showDraftsDrawer, setShowDraftsDrawer] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'All Items' },
    ...initialCategories
  ];

  const allPaymentMethods = ['CASH', ...(paymentMethods?.map(m => m.name) || [])];

  const updateQty = (service: any, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter(item => item.id !== service.id);
        return prev.map(item => item.id === service.id ? { ...item, qty: newQty } : item);
      } else if (delta > 0) {
        return [...prev, { ...service, qty: 1 }];
      }
      return prev;
    });
  };

  const getQty = (id: string) => cart.find(item => item.id === id)?.qty || 0;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax + (deliveryFee || 0);

  const selectedCustomer = selectedCustomerId === 'walkin'
    ? { id: undefined, name: 'Walk-in' }
    : customers.find(c => c.id === selectedCustomerId) || { id: undefined, name: 'Walk-in' };

  const isWalkInSelected = isWalkIn(selectedCustomer.name);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const formData = new FormData();
    formData.set('name', newCustomerName.trim());
    formData.set('phone', newCustomerPhone.trim());
    formData.set('email', newCustomerEmail.trim());
    formData.set('address', newCustomerAddress.trim());
    startCustomerTransition(async () => {
      const res = await createCustomerAction(formData);
      if (res.success && res.customer) {
        setCustomers(prev => [...prev, res.customer!]);
        setSelectedCustomerId(res.customer!.id);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
        setNewCustomerAddress('');
        setShowNewCustomerForm(false);
        setShowCustomerPicker(false);
      } else {
        console.error('Failed to create customer:', res.error);
      }
    });
  };

  const handleCheckout = (isDraft = false) => {
    if (cart.length === 0) return;
    startTransition(async () => {
      if (loadedDraftId) {
        await deleteOrderAction(loadedDraftId);
      }

      const res = await createOrder(
        cart,
        total,
        tax,
        subtotal,
        paymentMethod,
        selectedCustomerId !== 'walkin' ? selectedCustomerId : undefined,
        {
          notes: notes.trim() || undefined,
          fulfillment,
          deliveryFee: deliveryFee || 0,
          tableNumber: fulfillment === 'DINE_IN' ? tableNumber : undefined,
          scheduledDate: scheduledDate || undefined,
          isDraft
        }
      );
      if (res.success) {
        if (isDraft) {
          window.location.reload();
          return;
        }
        setReceiptInfo({
          orderNumber: res.orderNumber,
          items: [...cart],
          subtotal,
          tax,
          deliveryFee: deliveryFee || 0,
          total,
          paymentMethod,
          customerName: selectedCustomer.name,
          date: new Date().toLocaleString(),
          notes,
          fulfillment,
          tableNumber: fulfillment === 'DINE_IN' ? tableNumber : undefined,
          scheduledDate: scheduledDate ? new Date(scheduledDate).toLocaleString() : undefined,
          staffName
        });
        setCart([]);
        setSelectedCustomerId('walkin');
        setPaymentMethod('CASH');
        setNotes('');
        setFulfillment('DINE_IN');
        setTableNumber('');
        setDeliveryFee(0);
        setScheduledDate('');
        setShowOptions(false);
        setLoadedDraftId(null);
      } else {
        console.error('Failed to create order:', res.error);
      }
    });
  };

  const loadDraft = (draft: any) => {
    setLoadedDraftId(draft.id);
    setSelectedCustomerId(draft.customerId);
    setPaymentMethod(draft.paymentMethod);
    setNotes(draft.notes || '');
    setFulfillment(draft.fulfillment);
    setTableNumber(draft.tableNumber || '');
    setDeliveryFee(draft.deliveryFee);
    setScheduledDate(draft.scheduledDate ? new Date(draft.scheduledDate).toISOString().slice(0, 16) : '');
    setCart(draft.orderItems.map((item: any) => ({
      id: item.menuItem.id,
      name: item.menuItem.name,
      price: item.price,
      qty: item.quantity,
      icon: item.menuItem.icon
    })));
    setShowDraftsDrawer(false);
  };

  return (
    <>
      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="top-bar">
          <div className="search-container">
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><MagnifyingGlass size={18} /></span>
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (e.target.value) setActiveCategory('All Items');
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
              >✕</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {draftOrders && draftOrders.length > 0 && (
              <button onClick={() => setShowDraftsDrawer(true)} className="new-order-btn" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}>
                Drafts ({draftOrders.length})
              </button>
            )}
            <button className="new-order-btn" onClick={() => { 
              setCart([]); setSelectedCustomerId('walkin'); setPaymentMethod('CASH'); setNotes(''); 
              setFulfillment('DINE_IN'); setTableNumber(''); setDeliveryFee(0); setScheduledDate(''); setShowOptions(false); setLoadedDraftId(null);
            }}>New Order</button>
          </div>
        </div>

        <div className="breadcrumbs">
          New Order &gt; Select Customer &gt; <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Select Items</span>
        </div>

        <h1 className="page-title">Restaurant Menu</h1>

        <div className="categories">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              className={`category-pill ${activeCategory === cat.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name} {cat.emoji && <span>{cat.emoji}</span>}
            </button>
          ))}
        </div>

        {initialMenuItems.length === 0 ? (
          <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <h3>No menu items found!</h3>
            <p style={{ marginTop: '8px' }}>Go to Menu Items to add your first dish.</p>
          </div>
        ) : (() => {
          const filtered = initialMenuItems.filter(s => {
            const matchesCategory = activeCategory === 'All Items' || s.category === activeCategory;
            const matchesSearch = !searchQuery ||
              s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
          });
          if (filtered.length === 0) return (
            <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}><MagnifyingGlass size={48} /></div>
              <h3>No results for "{searchQuery}"</h3>
              <p style={{ marginTop: '8px' }}>Try a different term or{' '}
                <button onClick={() => setSearchQuery('')} style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontSize: 'inherit' }}>clear search</button>.
              </p>
            </div>
          );
          return (
          <div className="services-grid">
            {filtered.map(item => {
                const qty = getQty(item.id);
                const inCart = qty > 0;
                return (
                  <div
                    key={item.id}
                    className="service-card"
                    onClick={() => updateQty(item, 1)}
                    style={{
                      cursor: 'pointer',
                      border: inCart ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      position: 'relative',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      userSelect: 'none',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                  >
                    {/* In-cart badge */}
                    {inCart && (
                      <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'var(--primary)', color: 'white',
                        fontSize: '12px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                      }}>
                        {qty}
                      </div>
                    )}

                    <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: 'var(--text-muted)' }}><MenuItemIcon name={item.icon} size={48} /></div>
                    <div className="card-title">{item.name}</div>
                    <div className="card-category">{item.category}</div>
                    <div className="card-footer">
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>
                        {currency}{Math.floor(item.price)}<span>.{(item.price % 1).toFixed(2).substring(2)}</span>
                      </div>

                      {/* Stepper only visible when item is in cart */}
                      {inCart ? (
                        <div
                          className="stepper"
                          onClick={e => e.stopPropagation()} // don't bubble to card
                        >
                          <button className="stepper-btn" onClick={() => updateQty(item, -1)}>−</button>
                          <span className="stepper-value">{qty}</span>
                          <button className="stepper-btn plus" onClick={() => updateQty(item, 1)}>+</button>
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '12px', color: 'var(--text-muted)',
                          fontWeight: 500, marginLeft: 'auto'
                        }}>
                          Tap to add
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          );
        })()}
      </div>

      {/* RIGHT SIDEBAR (CART) */}
      <div className="right-sidebar">

        {/* CUSTOMER SELECTOR */}
        <div className="order-header" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
            </div>
            <button
              onClick={() => setShowCustomerPicker(v => !v)}
              style={{ fontSize: '12px', padding: '6px 12px', border: '1px solid var(--border-dark)', borderRadius: '6px', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--primary)', fontWeight: 500 }}
            >
              Change
            </button>
          </div>

          {showCustomerPicker && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                value={selectedCustomerId}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '__new__') {
                    setShowNewCustomerForm(true);
                    return;
                  }
                  setSelectedCustomerId(val);
                  if (val === 'walkin' || isWalkIn(customers.find(c => c.id === val)?.name || '')) {
                    setPaymentMethod('CASH');
                  }
                  setShowCustomerPicker(false);
                  setShowNewCustomerForm(false);
                }}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--bg-surface)', fontSize: '14px' }}
                autoFocus
              >
                <option value="walkin">Walk-in</option>
                {customers.filter(c => !isWalkIn(c.name)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</option>
                ))}
                <option value="__new__">+ New customer...</option>
              </select>

              {/* Inline quick-create form */}
              {showNewCustomerForm && (
                <form onSubmit={handleCreateCustomer} style={{
                  background: 'var(--bg-main)', borderRadius: '10px', padding: '12px',
                  border: '1px solid var(--border-dark)', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--primary)', marginBottom: '2px' }}>
                    <UserPlus size={16} /> Quick Register
                  </div>
                  <input
                    required
                    placeholder="Full name *"
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    style={{ padding: '8px 10px', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    style={{ padding: '8px 10px', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newCustomerEmail}
                    onChange={e => setNewCustomerEmail(e.target.value)}
                    style={{ padding: '8px 10px', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <textarea
                    placeholder="Address (optional)"
                    value={newCustomerAddress}
                    onChange={e => setNewCustomerAddress(e.target.value)}
                    rows={2}
                    style={{ padding: '8px 10px', border: '1px solid var(--border-dark)', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => setShowNewCustomerForm(false)}
                      style={{ flex: 1, padding: '7px', border: '1px solid var(--border-dark)', borderRadius: '6px', background: 'var(--bg-surface)', fontSize: '12px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isCreatingCustomer}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flex: 2, padding: '7px', border: 'none', borderRadius: '6px', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: isCreatingCustomer ? 0.7 : 1 }}>
                      {isCreatingCustomer ? 'Saving...' : <><Check size={16} /> Create & Select</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* PAYMENT METHOD */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Payment Method</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {allPaymentMethods.map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m as any)}
                  style={{
                    flex: '1 1 30%', padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                    border: paymentMethod === m ? '2px solid var(--primary)' : '1px solid var(--border-dark)',
                    background: paymentMethod === m ? 'var(--primary)' : 'var(--bg-surface)',
                    color: paymentMethod === m ? 'white' : 'var(--text-main)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    {m === 'CASH' ? <><Money size={18} /> Cash</> : m === 'CARD' ? <><CreditCard size={18} /> Card</> : m}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setPaymentMethod('RECEIVABLE')}
                disabled={isWalkInSelected}
                title={isWalkInSelected ? 'Select a named customer to use Pay Later' : ''}
                style={{
                  flex: '1 1 30%', padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                  cursor: isWalkInSelected ? 'not-allowed' : 'pointer',
                  border: paymentMethod === 'RECEIVABLE' ? '2px solid #F59E0B' : '1px solid var(--border-dark)',
                  background: paymentMethod === 'RECEIVABLE' ? '#F59E0B' : 'var(--bg-surface)',
                  color: paymentMethod === 'RECEIVABLE' ? 'white' : 'var(--text-main)',
                  opacity: isWalkInSelected ? 0.4 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Clock size={18} /> Later
                </span>
              </button>
            </div>
            {paymentMethod === 'RECEIVABLE' && (
              <p style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', color: '#B45309', marginTop: '6px', background: '#FEF3C7', padding: '6px 8px', borderRadius: '6px' }}>
                <Warning size={16} /> <span>This order will be recorded as a <strong>Receivable</strong> — customer owes the full amount.</span>
              </p>
            )}
          </div>

          {/* ORDER OPTIONS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Order Details</div>
              <button 
                onClick={() => setShowOptions(!showOptions)}
                style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500, padding: 0 }}
              >
                {showOptions ? 'Hide' : '+ Add Details'}
              </button>
            </div>
            
            {showOptions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                {/* Fulfillment / Order Type */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Order Type</label>
                  <select 
                    value={fulfillment} 
                    onChange={e => {
                      const val = e.target.value;
                      setFulfillment(val);
                      if (val !== 'DELIVERY') {
                        setDeliveryFee(0);
                      } else {
                        const opt = fulfillmentOptions.find(o => o.name.toUpperCase() === 'DELIVERY');
                        setDeliveryFee(opt ? opt.defaultFee : 5.00);
                      }
                    }}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-dark)', fontSize: '13px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                  >
                    <option value="DINE_IN">Dine-in 🍽️</option>
                    <option value="TAKEAWAY">Takeaway 🥡</option>
                    <option value="DELIVERY">Delivery 🛵</option>
                  </select>
                </div>
                
                {/* Table Number */}
                {fulfillment === 'DINE_IN' && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Table Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Table 5"
                      value={tableNumber} 
                      onChange={e => setTableNumber(e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-dark)', fontSize: '13px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                    />
                  </div>
                )}
                
                {/* Fulfillment Fee */}
                {fulfillment === 'DELIVERY' && (
                  <div>
                     <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Delivery Fee ({currency})</label>
                     <input 
                       type="number" 
                       min="0"
                       step="0.01"
                       value={deliveryFee === 0 && !deliveryFee.toString().includes('.') ? '' : deliveryFee} 
                       onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
                       style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-dark)', fontSize: '13px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                       placeholder="0.00"
                     />
                  </div>
                )}
                
                {/* Date/Time */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Scheduled Time</label>
                  <input 
                    type="datetime-local" 
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-dark)', fontSize: '13px', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Kitchen/Order Notes</label>
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="E.g., No onions, extra cheese, well done..."
                    rows={2}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-dark)', fontSize: '13px', resize: 'vertical', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="order-items-list">
          <div className="order-list-title">Current Order</div>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px' }}>Cart is empty</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="order-item">
                <div className="item-qty">x{item.qty}</div>
                <div className="item-img-small" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}><MenuItemIcon name={item.icon} size={24} /></div>
                <div className="item-info">
                  <div className="item-info-title">{item.name}</div>
                </div>
                <div className="item-info-price">{currency}{(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className="payment-summary">
          <div className="payment-summary-title">Payment Summary</div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="summary-row">
              <span>Fee</span>
              <span>{currency}{deliveryFee.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row">
            <span>Tax ({taxRate}%)</span>
            <span>{currency}{tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{currency}{total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleCheckout(true)}
              disabled={cart.length === 0 || isPending}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                background: 'var(--bg-main)', border: '1px solid var(--border-dark)', color: 'var(--text-main)',
                opacity: (cart.length === 0 || isPending) ? 0.7 : 1
              }}
            >
              Save Draft
            </button>
            <button
              className="charge-btn"
              onClick={() => handleCheckout(false)}
              disabled={cart.length === 0 || isPending}
              style={{
                flex: 2,
                opacity: (cart.length === 0 || isPending) ? 0.7 : 1,
                background: paymentMethod === 'RECEIVABLE' ? 'linear-gradient(135deg, #F59E0B, #D97706)' : undefined
              }}
            >
              {isPending
                ? 'Processing...'
                : paymentMethod === 'RECEIVABLE'
                  ? `Receivable ${currency}${total.toFixed(2)}`
                  : `Charge ${currency}${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {receiptInfo && (
        <ReceiptModal
          receiptInfo={receiptInfo}
          onClose={() => setReceiptInfo(null)}
          storeName={storeName}
          storeLogo={storeLogo}
          storeAddress={storeAddress}
          storePhone={storePhone}
          currency={currency}
          taxRate={taxRate}
        />
      )}
      {/* DRAFTS DRAWER */}
      {showDraftsDrawer && (
        <>
          <div onClick={() => setShowDraftsDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 150, backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', background: 'var(--bg-surface)', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ padding: '28px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: '18px' }}>Open Drafts</h2>
              <button onClick={() => setShowDraftsDrawer(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {draftOrders?.map(draft => (
                <div key={draft.id} style={{ border: '1px solid var(--border-dark)', borderRadius: '12px', padding: '16px', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600 }}>{draft.customer.name}</div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{currency}{draft.totalPrice.toFixed(2)}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {new Date(draft.createdAt).toLocaleString()} • {draft.orderItems.length} items
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => loadDraft(draft)} style={{ flex: 1, padding: '8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      Resume Job
                    </button>
                    <button onClick={async () => {
                      if(confirm('Delete this draft?')) {
                        await deleteOrderAction(draft.id);
                        window.location.reload();
                      }
                    }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer' }}>
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

