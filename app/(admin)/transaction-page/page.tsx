// app/(admin)/transaction-page/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionHistoryView from '@/components/transactions/transaction-history-view'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/login')

  const adminClient = createAdminClient()

  const { data: transactions } = await adminClient
    .from('point_transactions_enriched')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Transactions</h1>
        <p className="text-xs text-gray-400 mt-1">Full points ledger, most recent first</p>
      </div>

      <TransactionHistoryView transactions={transactions ?? []} />
    </div>
  )
}