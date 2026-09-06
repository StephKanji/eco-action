import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TransactionHistoryView from './transaction-history-view'

export default async function TransactionHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  const { data: transactions } = await adminClient
    .from('point_transactions_enriched')
    .select('*')
    .or(`from_entity_id.eq.${org.id},to_entity_id.eq.${org.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">Every points movement for {org.org_name}</p>
      </div>

      <TransactionHistoryView transactions={transactions ?? []} />
    </div>
  )
}