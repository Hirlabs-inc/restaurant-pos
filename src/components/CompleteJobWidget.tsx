'use client'

import { useTransition } from 'react'
import { updateOrderStatusAction } from '../app/actions'
import { CheckCircle } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

export function CompleteJobWidget({ order }: { order: any }) {
  const router = useRouter()
  const [loading, startTransition] = useTransition()

  const handleComplete = () => {
    startTransition(async () => {
      const res = await updateOrderStatusAction(order.id, 'COMPLETED')
      if (!res.success) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <button 
      onClick={handleComplete} 
      disabled={loading} 
      style={{
        padding: '6px 10px',
        borderRadius: '6px',
        border: 'none',
        background: '#10B981',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        opacity: loading ? 0.5 : 1,
        fontWeight: 600,
        transition: 'opacity 0.15s'
      }}
    >
      <CheckCircle size={14} /> Complete
    </button>
  )
}
