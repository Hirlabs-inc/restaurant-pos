'use client';
import { useState, useTransition } from 'react';
import {
  createMenuItemAction,
  updateMenuItemAction,
  createCategoryAction,
  deleteMenuItemAction,
  deleteCategoryAction,
} from '../app/actions';
import { Tag, Folder, PencilSimple, Trash, Warning } from '@phosphor-icons/react';

const EMOJI_OPTIONS = ['🥗','🍕','🍹','🍰','🍔','🍝','🍣','🥪','🥞','🍦','☕','🍷'];
const CATEGORY_COLORS: Record<string, string> = {
  Appetizers: '#FEF3C7',
  'Main Courses': '#FEE2E2',
  Beverages: '#DBEAFE',
  Desserts: '#FCE7F3',
};
function catColor(name: string) {
  return CATEGORY_COLORS[name] || '#F3F4F6';
}

export default function MenuManager({
  initialMenuItems,
  initialCategories,
  currency = '$',
}: {
  initialMenuItems: any[];
  initialCategories: any[];
  currency?: string;
}) {
  const [tab, setTab] = useState<'menuItems' | 'categories'>('menuItems');
  const [menuItems, setMenuItems] = useState<any[]>(initialMenuItems);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Add Menu Item ─────────────────────────────────────────────
  const handleAddMenuItem = (formData: FormData) => {
    startTransition(async () => {
      if (editingItem) {
        const res = await updateMenuItemAction(editingItem.id, formData);
        if (res.success) {
          window.location.reload();
        } else {
          console.error(res.error);
        }
      } else {
        const res = await createMenuItemAction(formData);
        if (res.success) {
          window.location.reload();
        } else {
          console.error(res.error);
        }
      }
    });
  };

  const openDrawerForAdd = () => {
    setEditingItem(null);
    setDrawerOpen(true);
  };

  const openDrawerForEdit = (item: any) => {
    setEditingItem(item);
    setDrawerOpen(true);
  };

  // ── Delete Menu Item ──────────────────────────────────────────
  const handleDeleteMenuItem = (id: string) => {
    if (!confirm('Remove this menu item?')) return;
    startTransition(async () => {
      const res = await deleteMenuItemAction(id);
      if (res.success) setMenuItems(prev => prev.filter(s => s.id !== id));
      else console.error(res.error);
    });
  };

  // ── Add Category ─────────────────────────────────────────────
  const handleAddCategory = (formData: FormData) => {
    startTransition(async () => {
      const res = await createCategoryAction(formData);
      if (res.success) window.location.reload();
      else console.error(res.error);
    });
  };

  // ── Delete Category ──────────────────────────────────────────
  const handleDeleteCategory = (id: string) => {
    if (!confirm('Delete this category?')) return;
    startTransition(async () => {
      const res = await deleteCategoryAction(id);
      if (res.success) setCategories(prev => prev.filter(c => c.id !== id));
      else console.error(res.error);
    });
  };

  const filteredMenuItems = filterCat === 'All'
    ? menuItems
    : menuItems.filter(s => s.category === filterCat);

  return (
    <div className="main-content" style={{ position: 'relative' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Menu Items</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {menuItems.length} menu item{menuItems.length !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        {tab === 'menuItems' && (
          <button
            onClick={openDrawerForAdd}
            className="new-order-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Add Menu Item
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '24px', background: 'var(--bg-surface)', padding: '4px', borderRadius: '10px', width: 'fit-content', border: '1px solid var(--border-light)' }}>
        {(['menuItems', 'categories'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.15s',
              background: tab === t ? 'var(--primary)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-muted)',
            }}
          >
            {t === 'menuItems' ? <><Tag size={15} /> Menu Items</> : <><Folder size={15} /> Categories</>}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: MENU ITEMS
      ══════════════════════════════════════════ */}
      {tab === 'menuItems' && (
        <>
          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
            {['All', ...categories.map(c => c.name)].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                style={{
                  padding: '6px 14px', borderRadius: '999px', border: '1px solid',
                  borderColor: filterCat === cat ? 'var(--primary)' : 'var(--border-dark)',
                  background: filterCat === cat ? 'var(--primary)' : 'var(--bg-surface)',
                  color: filterCat === cat ? 'white' : 'var(--text-main)',
                  fontWeight: 500, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu item grid */}
          {filteredMenuItems.length === 0 ? (
            <div style={{
              marginTop: '60px', textAlign: 'center', color: 'var(--text-muted)',
              padding: '48px', border: '2px dashed var(--border-dark)', borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Tag size={40} /></div>
              <h3 style={{ marginBottom: '8px' }}>No menu items yet</h3>
              <p style={{ fontSize: '14px' }}>Click <strong>+ Add Menu Item</strong> to get started</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '16px', marginTop: '20px'
            }}>
              {filteredMenuItems.map(s => (
                <div key={s.id} style={{
                  background: 'var(--bg-surface)', borderRadius: '14px',
                  border: '1px solid var(--border-light)', overflow: 'hidden',
                  transition: 'box-shadow 0.2s', position: 'relative',
                }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Card icon strip */}
                  <div style={{
                    height: '100px', background: 'var(--bg-main)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                  }}>
                    <span style={{ fontSize: '40px' }}>{s.icon || '🍽️'}</span>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{s.name}</div>
                        <span style={{
                          display: 'inline-block', marginTop: '4px', padding: '2px 8px',
                          borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                          background: 'var(--bg-elevated)', color: 'var(--text-main)',
                          border: '1px solid var(--border-light)'
                        }}>
                          {s.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                        {currency}{s.price.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => openDrawerForEdit(s)}
                        disabled={isPending}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, padding: '7px', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-main)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                      >
                        <PencilSimple size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(s.id)}
                        disabled={isPending}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flex: 1, padding: '7px', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.05)', color: '#DC2626', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                      >
                        <Trash size={14} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          TAB: CATEGORIES
      ══════════════════════════════════════════ */}
      {tab === 'categories' && (
        <div style={{ marginTop: '24px' }}>

          {/* Inline add form */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
            borderRadius: '14px', padding: '24px', marginBottom: '28px'
          }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '15px' }}><Folder size={16} /> New Category</h3>
            <form action={handleAddCategory} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Category Name *</label>
                <input name="name" required placeholder="e.g. Main Courses"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-dark)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ width: '80px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Emoji</label>
                <input name="emoji" defaultValue="🍴" list="emoji-list"
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--border-dark)', borderRadius: '8px', fontSize: '18px', textAlign: 'center', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
                <datalist id="emoji-list">
                  {EMOJI_OPTIONS.map(e => <option key={e} value={e} />)}
                </datalist>
              </div>
              <button type="submit" disabled={isPending} className="new-order-btn"
                style={{ opacity: isPending ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                {isPending ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>

          {/* Category cards */}
          {categories.length === 0 ? (
            <div style={{
              textAlign: 'center', color: 'var(--text-muted)', padding: '48px',
              border: '2px dashed var(--border-dark)', borderRadius: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><Folder size={40} /></div>
              <h3 style={{ marginBottom: '8px' }}>No categories yet</h3>
              <p style={{ fontSize: '14px' }}>Add one above to start organising your menu</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {categories.map(c => {
                const count = menuItems.filter(s => s.category === c.name).length;
                return (
                  <div key={c.id} style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
                    borderRadius: '14px', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ fontSize: '32px' }}>{c.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{count} dish{count !== 1 ? 'es' : ''}</div>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      disabled={isPending}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px', padding: '6px', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.05)', color: '#DC2626', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      <Trash size={14} /> Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          SLIDE-IN DRAWER: ADD MENU ITEM
      ══════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              zIndex: 150, backdropFilter: 'blur(2px)'
            }}
          />
          {/* Drawer panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px',
            background: 'var(--bg-surface)', zIndex: 200, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'auto'
          }}>
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px' }}>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
              <button onClick={() => setDrawerOpen(false)} style={{
                background: 'none', border: 'none', fontSize: '22px',
                cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1
              }}>✕</button>
            </div>

            <form action={(fd) => { handleAddMenuItem(fd); setDrawerOpen(false); }}
              style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Dish Name *
                </label>
                <input name="name" required placeholder="e.g. Margherita Pizza" defaultValue={editingItem?.name || ''}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Category *
                </label>
                {categories.length === 0 ? (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: '8px' }}>
                    <Warning size={16} /> No categories yet — switch to the <strong>Categories</strong> tab to create one first.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {categories.map((c, i) => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input type="radio" name="category" value={c.name} defaultChecked={editingItem ? editingItem.category === c.name : i === 0} style={{ accentColor: 'var(--primary)' }} />
                        <span style={{
                          padding: '6px 12px', borderRadius: '999px', fontSize: '13px',
                          fontWeight: 500, background: 'var(--bg-main)', color: 'var(--text-main)', 
                          border: '1px solid var(--border-dark)', cursor: 'pointer'
                        }}>
                          {c.emoji} {c.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Price ({currency}) *
                </label>
                <input name="price" type="number" step="0.01" min="0" required placeholder="0.00" defaultValue={editingItem?.price || ''}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border-dark)', borderRadius: '10px', fontSize: '15px', background: 'var(--bg-main)', color: 'var(--text-main)' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 500 }}>
                  Icon
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['🍽️','🥗','🍕','🍹','🍰','🍔','🍝','🍣','🥪','🥞','🍦','☕','🍷','🥩','🌮','🥗'].map(emoji => (
                    <label key={emoji} style={{ cursor: 'pointer', fontSize: '24px' }}>
                      <input type="radio" name="icon" value={emoji} defaultChecked={editingItem?.icon === emoji || (!editingItem?.icon && emoji === '🍽️')} style={{ display: 'none' }} />
                      <span style={{
                        display: 'inline-block', padding: '6px', borderRadius: '8px',
                        border: '2px solid transparent',
                        transition: 'border-color 0.15s',
                      }} onMouseEnter={e => (e.currentTarget as HTMLSpanElement).style.borderColor = 'var(--border-dark)'}
                         onMouseLeave={e => (e.currentTarget as HTMLSpanElement).style.borderColor = 'transparent'}>{emoji}</span>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Image uploads are unavailable in this demo. Select an icon instead.
                </p>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" disabled={isPending || categories.length === 0}
                  className="charge-btn"
                  style={{ width: '100%', opacity: (isPending || categories.length === 0) ? 0.6 : 1 }}>
                  {isPending ? 'Saving...' : (editingItem ? 'Save Changes' : '+ Add Menu Item')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
