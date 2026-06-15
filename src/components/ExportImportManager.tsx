'use client'

import { useState, useTransition } from 'react'
import {
  exportMenuItemsAction,
  exportCustomersAction,
  exportEmployeesAction,
  exportOrdersAction,
  importMenuItemsCSVAction,
  importCustomersCSVAction,
  importEmployeesCSVAction
} from '../app/actions'
import { DownloadSimple, UploadSimple, FileArrowDown, Warning, Check, ArrowsClockwise } from '@phosphor-icons/react'

// CSV Utilities
function arrayToCSV(data: any[], headersMap: Record<string, string>): string {
  if (data.length === 0) return Object.values(headersMap).join(',');
  
  const headers = Object.keys(headersMap);
  const displayHeaders = Object.values(headersMap);
  
  const csvRows = [];
  csvRows.push(displayHeaders.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val === null || val === undefined ? '' : val)).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function parseCSV(csvText: string): any[] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentLine.push(currentVal.trim());
        lines.push(currentLine);
        currentLine = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }
  if (currentVal || currentLine.length > 0) {
    currentLine.push(currentVal.trim());
    lines.push(currentLine);
  }
  
  if (lines.length === 0) return [];
  
  const headers = lines[0].map(h => h.trim());
  const result: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    result.push(obj);
  }
  return result;
}

const MENU_ITEM_HEADERS = {
  name: 'Name',
  category: 'Category',
  price: 'Price',
  priceType: 'PriceType',
  icon: 'Icon'
}

const CUSTOMER_HEADERS = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
  notes: 'Notes'
}

const EMPLOYEE_HEADERS = {
  name: 'Name',
  phone: 'Phone',
  role: 'Role',
  status: 'Status',
  wageType: 'WageType',
  wageAmount: 'WageAmount'
}

const ORDER_HEADERS = {
  orderNumber: 'OrderNumber',
  customerName: 'CustomerName',
  date: 'Date',
  totalPrice: 'TotalPrice',
  paidAmount: 'PaidAmount',
  dueAmount: 'DueAmount',
  paymentMethod: 'PaymentMethod',
  fulfillment: 'Fulfillment',
  assignedEmployee: 'AssignedEmployee',
  notes: 'Notes'
}

interface SectionState {
  isExporting: boolean;
  isImporting: boolean;
  selectedFile: File | null;
  error: string;
  success: string;
}

export default function ExportImportManager() {
  const [isPending, startTransition] = useTransition()
  
  const [servicesState, setServicesState] = useState<SectionState>({ isExporting: false, isImporting: false, selectedFile: null, error: '', success: '' });
  const [customersState, setCustomersState] = useState<SectionState>({ isExporting: false, isImporting: false, selectedFile: null, error: '', success: '' });
  const [employeesState, setEmployeesState] = useState<SectionState>({ isExporting: false, isImporting: false, selectedFile: null, error: '', success: '' });
  const [ordersState, setOrdersState] = useState<SectionState>({ isExporting: false, isImporting: false, selectedFile: null, error: '', success: '' });

  const triggerDownload = (csvText: string, filename: string) => {
    const dataBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // --- MENU ITEMS ---
  const handleExportServices = async () => {
    setServicesState(prev => ({ ...prev, isExporting: true, error: '', success: '' }))
    const res = await exportMenuItemsAction()
    if (res.success && res.data) {
      const csv = arrayToCSV(res.data, MENU_ITEM_HEADERS)
      triggerDownload(csv, `menu_items_export_${new Date().toISOString().split('T')[0]}.csv`)
      setServicesState(prev => ({ ...prev, isExporting: false, success: 'Menu items exported successfully!' }))
    } else {
      setServicesState(prev => ({ ...prev, isExporting: false, error: res.error || 'Export failed.' }))
    }
  }

  const handleDownloadServicesTemplate = () => {
    const templateData = [
      { name: 'Margherita Pizza', category: 'Main Courses', price: '12.99', priceType: 'item', icon: '🍕' },
      { name: 'Caesar Salad', category: 'Appetizers', price: '8.99', priceType: 'item', icon: '🥗' },
      { name: 'Chocolate Lava Cake', category: 'Desserts', price: '6.99', priceType: 'item', icon: '🍰' }
    ]
    const csv = arrayToCSV(templateData, MENU_ITEM_HEADERS)
    triggerDownload(csv, 'menu_items_template.csv')
  }

  const handleImportServices = () => {
    if (!servicesState.selectedFile) return
    if (!confirm('Warning: This will import Menu Items from CSV. Rows with duplicate names will overwrite existing prices/categories. Do you wish to continue?')) return

    setServicesState(prev => ({ ...prev, isImporting: true, error: '', success: '' }))
    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      startTransition(async () => {
        try {
          const parsed = parseCSV(csvText)
          if (parsed.length === 0) {
            setServicesState(prev => ({ ...prev, isImporting: false, error: 'CSV file is empty or missing headers.' }))
            return
          }
          
          // Validate header presence
          const sample = parsed[0]
          if (!('Name' in sample || 'name' in sample)) {
            setServicesState(prev => ({ ...prev, isImporting: false, error: 'Invalid CSV headers. Must include "Name" column.' }))
            return
          }

          const res = await importMenuItemsCSVAction(parsed)
          if (res.success) {
            setServicesState(prev => ({ ...prev, isImporting: false, success: 'Menu items imported successfully! Reloading...' }))
            setTimeout(() => window.location.reload(), 1500)
          } else {
            setServicesState(prev => ({ ...prev, isImporting: false, error: res.error || 'Import failed.' }))
          }
        } catch (err: any) {
          setServicesState(prev => ({ ...prev, isImporting: false, error: err.message }))
        }
      })
    }
    reader.readAsText(servicesState.selectedFile)
  }

  // --- CUSTOMERS ---
  const handleExportCustomers = async () => {
    setCustomersState(prev => ({ ...prev, isExporting: true, error: '', success: '' }))
    const res = await exportCustomersAction()
    if (res.success && res.data) {
      const csv = arrayToCSV(res.data, CUSTOMER_HEADERS)
      triggerDownload(csv, `customers_export_${new Date().toISOString().split('T')[0]}.csv`)
      setCustomersState(prev => ({ ...prev, isExporting: false, success: 'Customers exported successfully!' }))
    } else {
      setCustomersState(prev => ({ ...prev, isExporting: false, error: res.error || 'Export failed.' }))
    }
  }

  const handleDownloadCustomersTemplate = () => {
    const templateData = [
      { name: 'John Doe', phone: '+1234567890', email: 'john@example.com', address: '123 Main St', notes: 'VIP customer' },
      { name: 'Jane Smith', phone: '+1987654321', email: 'jane@example.com', address: '456 Oak Ave', notes: 'Needs hanger delivery' }
    ]
    const csv = arrayToCSV(templateData, CUSTOMER_HEADERS)
    triggerDownload(csv, 'customers_template.csv')
  }

  const handleImportCustomers = () => {
    if (!customersState.selectedFile) return
    if (!confirm('Warning: This will import Customers from CSV. Rows with duplicate names will update existing numbers/emails. Do you wish to continue?')) return

    setCustomersState(prev => ({ ...prev, isImporting: true, error: '', success: '' }))
    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      startTransition(async () => {
        try {
          const parsed = parseCSV(csvText)
          if (parsed.length === 0) {
            setCustomersState(prev => ({ ...prev, isImporting: false, error: 'CSV file is empty or missing headers.' }))
            return
          }
          
          const sample = parsed[0]
          if (!('Name' in sample || 'name' in sample)) {
            setCustomersState(prev => ({ ...prev, isImporting: false, error: 'Invalid CSV headers. Must include "Name" column.' }))
            return
          }

          const res = await importCustomersCSVAction(parsed)
          if (res.success) {
            setCustomersState(prev => ({ ...prev, isImporting: false, success: 'Customers imported successfully! Reloading...' }))
            setTimeout(() => window.location.reload(), 1500)
          } else {
            setCustomersState(prev => ({ ...prev, isImporting: false, error: res.error || 'Import failed.' }))
          }
        } catch (err: any) {
          setCustomersState(prev => ({ ...prev, isImporting: false, error: err.message }))
        }
      })
    }
    reader.readAsText(customersState.selectedFile)
  }

  // --- EMPLOYEES ---
  const handleExportEmployees = async () => {
    setEmployeesState(prev => ({ ...prev, isExporting: true, error: '', success: '' }))
    const res = await exportEmployeesAction()
    if (res.success && res.data) {
      const csv = arrayToCSV(res.data, EMPLOYEE_HEADERS)
      triggerDownload(csv, `employees_export_${new Date().toISOString().split('T')[0]}.csv`)
      setEmployeesState(prev => ({ ...prev, isExporting: false, success: 'Employees exported successfully!' }))
    } else {
      setEmployeesState(prev => ({ ...prev, isExporting: false, error: res.error || 'Export failed.' }))
    }
  }

  const handleDownloadEmployeesTemplate = () => {
    const templateData = [
      { name: 'Sarah Connor', phone: '+1122334455', role: 'Waiter', status: 'Active', wageType: 'Monthly', wageAmount: '1500' },
      { name: 'Marcus Wright', phone: '+1556677889', role: 'Chef', status: 'Active', wageType: 'Daily', wageAmount: '60' }
    ]
    const csv = arrayToCSV(templateData, EMPLOYEE_HEADERS)
    triggerDownload(csv, 'employees_template.csv')
  }

  const handleImportEmployees = () => {
    if (!employeesState.selectedFile) return
    if (!confirm('Warning: This will import Employees from CSV. Rows with duplicate names will update existing profiles. Do you wish to continue?')) return

    setEmployeesState(prev => ({ ...prev, isImporting: true, error: '', success: '' }))
    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      startTransition(async () => {
        try {
          const parsed = parseCSV(csvText)
          if (parsed.length === 0) {
            setEmployeesState(prev => ({ ...prev, isImporting: false, error: 'CSV file is empty or missing headers.' }))
            return
          }
          
          const sample = parsed[0]
          if (!('Name' in sample || 'name' in sample)) {
            setEmployeesState(prev => ({ ...prev, isImporting: false, error: 'Invalid CSV headers. Must include "Name" column.' }))
            return
          }

          const res = await importEmployeesCSVAction(parsed)
          if (res.success) {
            setEmployeesState(prev => ({ ...prev, isImporting: false, success: 'Employees imported successfully! Reloading...' }))
            setTimeout(() => window.location.reload(), 1500)
          } else {
            setEmployeesState(prev => ({ ...prev, isImporting: false, error: res.error || 'Import failed.' }))
          }
        } catch (err: any) {
          setEmployeesState(prev => ({ ...prev, isImporting: false, error: err.message }))
        }
      })
    }
    reader.readAsText(employeesState.selectedFile)
  }

  // --- ORDERS / TRANSACTIONS (EXPORT ONLY) ---
  const handleExportOrders = async () => {
    setOrdersState(prev => ({ ...prev, isExporting: true, error: '', success: '' }))
    const res = await exportOrdersAction()
    if (res.success && res.data) {
      const mapped = res.data.map((o: any) => ({
        orderNumber: o.orderNumber,
        customerName: o.customer?.name || '',
        date: o.createdAt ? new Date(o.createdAt).toISOString() : '',
        totalPrice: o.totalPrice,
        paidAmount: o.paidAmount,
        dueAmount: o.dueAmount,
        paymentMethod: o.paymentMethod,
        fulfillment: o.fulfillment,
        assignedEmployee: o.assignedTo?.name || '',
        notes: o.notes || ''
      }))
      const csv = arrayToCSV(mapped, ORDER_HEADERS)
      triggerDownload(csv, `orders_export_${new Date().toISOString().split('T')[0]}.csv`)
      setOrdersState(prev => ({ ...prev, isExporting: false, success: 'Orders history exported successfully!' }))
    } else {
      setOrdersState(prev => ({ ...prev, isExporting: false, error: res.error || 'Export failed.' }))
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-surface)', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ marginBottom: '6px', fontSize: '18px', fontWeight: 700 }}>Data Export &amp; Import (CSV)</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Manage your store configurations, customer databases, payrolls, and transaction histories using standard CSV spreadsheets.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* MENU ITEMS CARD */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Menu Items &amp; Dishes</span>
            <button 
              onClick={handleDownloadServicesTemplate}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
              title="Download empty CSV template with standard headers"
            >
              <FileArrowDown size={14} /> Template
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Export or import menu items, dishes, pricing, and categories will auto-create.
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <button
              onClick={handleExportServices}
              disabled={servicesState.isExporting || isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--btn-dark)', color: 'var(--btn-dark-text)', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: (servicesState.isExporting || isPending) ? 0.6 : 1 }}
            >
              {servicesState.isExporting ? <ArrowsClockwise size={14} className="spin" /> : <DownloadSimple size={14} />} Export CSV
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setServicesState(prev => ({ ...prev, selectedFile: e.target.files?.[0] || null }))}
                style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '11px', background: 'var(--bg-surface)' }}
              />
              <button
                onClick={handleImportServices}
                disabled={!servicesState.selectedFile || servicesState.isImporting || isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '12px', cursor: (!servicesState.selectedFile || servicesState.isImporting || isPending) ? 'not-allowed' : 'pointer', opacity: (!servicesState.selectedFile || servicesState.isImporting || isPending) ? 0.5 : 1 }}
              >
                {servicesState.isImporting ? <ArrowsClockwise size={14} className="spin" /> : <UploadSimple size={14} />} Import
              </button>
            </div>
          </div>
          {servicesState.error && <div style={{ fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}><Warning size={12} /> {servicesState.error}</div>}
          {servicesState.success && <div style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {servicesState.success}</div>}
        </div>

        {/* CUSTOMERS CARD */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Customers Database</span>
            <button 
              onClick={handleDownloadCustomersTemplate}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
              title="Download empty CSV template with standard headers"
            >
              <FileArrowDown size={14} /> Template
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Export your customer ledger or import contacts, address books, and notes.
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <button
              onClick={handleExportCustomers}
              disabled={customersState.isExporting || isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--btn-dark)', color: 'var(--btn-dark-text)', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: (customersState.isExporting || isPending) ? 0.6 : 1 }}
            >
              {customersState.isExporting ? <ArrowsClockwise size={14} className="spin" /> : <DownloadSimple size={14} />} Export CSV
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setCustomersState(prev => ({ ...prev, selectedFile: e.target.files?.[0] || null }))}
                style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '11px', background: 'var(--bg-surface)' }}
              />
              <button
                onClick={handleImportCustomers}
                disabled={!customersState.selectedFile || customersState.isImporting || isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '12px', cursor: (!customersState.selectedFile || customersState.isImporting || isPending) ? 'not-allowed' : 'pointer', opacity: (!customersState.selectedFile || customersState.isImporting || isPending) ? 0.5 : 1 }}
              >
                {customersState.isImporting ? <ArrowsClockwise size={14} className="spin" /> : <UploadSimple size={14} />} Import
              </button>
            </div>
          </div>
          {customersState.error && <div style={{ fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}><Warning size={12} /> {customersState.error}</div>}
          {customersState.success && <div style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {customersState.success}</div>}
        </div>

        {/* EMPLOYEES CARD */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Staff &amp; Payroll Configurations</span>
            <button 
              onClick={handleDownloadEmployeesTemplate}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
              title="Download empty CSV template with standard headers"
            >
              <FileArrowDown size={14} /> Template
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Export lists of active/inactive employees or import salaries, duties, and roles.
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <button
              onClick={handleExportEmployees}
              disabled={employeesState.isExporting || isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--btn-dark)', color: 'var(--btn-dark-text)', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: (employeesState.isExporting || isPending) ? 0.6 : 1 }}
            >
              {employeesState.isExporting ? <ArrowsClockwise size={14} className="spin" /> : <DownloadSimple size={14} />} Export CSV
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => setEmployeesState(prev => ({ ...prev, selectedFile: e.target.files?.[0] || null }))}
                style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', fontSize: '11px', background: 'var(--bg-surface)' }}
              />
              <button
                onClick={handleImportEmployees}
                disabled={!employeesState.selectedFile || employeesState.isImporting || isPending}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '12px', cursor: (!employeesState.selectedFile || employeesState.isImporting || isPending) ? 'not-allowed' : 'pointer', opacity: (!employeesState.selectedFile || employeesState.isImporting || isPending) ? 0.5 : 1 }}
              >
                {employeesState.isImporting ? <ArrowsClockwise size={14} className="spin" /> : <UploadSimple size={14} />} Import
              </button>
            </div>
          </div>
          {employeesState.error && <div style={{ fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}><Warning size={12} /> {employeesState.error}</div>}
          {employeesState.success && <div style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {employeesState.success}</div>}
        </div>

        {/* ORDERS CARD (EXPORT ONLY) */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Transaction History &amp; Orders</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>Export Only</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Download a flat CSV ledger of all orders, total pricing, due amounts, and assignments. Useful for bookkeeping and analytics.
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
            <button
              onClick={handleExportOrders}
              disabled={ordersState.isExporting || isPending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--btn-dark)', color: 'var(--btn-dark-text)', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', opacity: (ordersState.isExporting || isPending) ? 0.6 : 1 }}
            >
              {ordersState.isExporting ? <ArrowsClockwise size={14} className="spin" /> : <DownloadSimple size={14} />} Export Transaction History
            </button>
          </div>
          {ordersState.error && <div style={{ fontSize: '11px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}><Warning size={12} /> {ordersState.error}</div>}
          {ordersState.success && <div style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> {ordersState.success}</div>}
        </div>

      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
