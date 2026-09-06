'use client'

import { useTransactions } from '@/hooks/useTransactions'
import TransactionHistoryView from '@/components/transactions/transaction-history-view'

export default function LiveTransactionHistory({
  entityId,
  entityType,
  initialTransactions,
}: {
  entityId: string | null
  entityType: 'user' | 'org' | 'admin'
  initialTransactions: any[]
}) {
  const { transactions } = useTransactions(entityId, entityType)

  // Use live data if available, fall back to server-fetched initial data
  const data = transactions.length > 0 ? transactions : initialTransactions

  return <TransactionHistoryView transactions={data} />
}
