import { auth } from '../../../../auth'
import ExportImportManager from '../../../components/ExportImportManager'
import { redirect } from 'next/navigation'

export default async function DataPage() {
  const session = await auth()
  const u = session?.user as any
  if (!u || u.role !== 'admin') redirect('/')

  return (
    <div className="main-content">
      <h1 className="page-title">Backup &amp; Data Manager</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Export store configurations, customer databases, and transactions to CSV, or bulk-import data.
      </p>
      <div style={{ maxWidth: '800px' }}>
        <ExportImportManager />
      </div>
    </div>
  )
}
