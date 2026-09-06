// app/(user)/transactions/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TransactionHistoryView from '@/components/transactions/transaction-history-view'

export default async function TransactionHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'user') redirect('/login')

  const { data: transactions } = await adminClient
    .from('point_transactions_enriched')
    .select('*')
    .or(`from_entity_id.eq.${user.id},to_entity_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">Every points movement on your account</p>
      </div>

      <TransactionHistoryView transactions={transactions ?? []} />
    </div>
  )
}