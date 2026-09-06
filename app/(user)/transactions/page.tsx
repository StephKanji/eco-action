import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  purchase:       { label: 'Points Purchase',  color: 'text-blue-600' },
  starter_grant:  { label: 'Starter Grant',    color: 'text-green-600' },
  escrow_lock:    { label: 'Escrow Locked',    color: 'text-orange-500' },
  escrow_release: { label: 'Task Reward',      color: 'text-green-600' },
  escrow_return:  { label: 'Escrow Returned',  color: 'text-blue-500' },
  reward_credit:  { label: 'Reward Credit',    color: 'text-green-600' },
  redemption:     { label: 'Redemption',       color: 'text-red-500' },
}

export default async function TransactionHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Verify role
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'user') redirect('/login')

  // Fetch all transactions involving this user
  const { data: transactions } = await adminClient
    .from('point_transactions')
    .select('id, amount, type, notes, created_at, from_entity_type, to_entity_type, to_entity_id, from_entity_id')
    .or(`from_entity_id.eq.${user.id},to_entity_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Tasks History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {transactions?.length ?? 0} transactions
        </p>
      </div>

      {/* Transaction list */}
      {!transactions || transactions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed
                        border-gray-200 rounded-2xl">
          <p className="text-4xl mb-3">💳</p>
          <p className="font-medium">No transactions yet</p>
          <p className="text-sm mt-1">Complete tasks to earn points</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => {
            const meta = TYPE_LABELS[tx.type] ?? {
              label: tx.type,
              color: 'text-gray-600',
            }

            // Determine if this is a credit or debit for this user
            const isCredit = tx.to_entity_id === user.id
            const sign = isCredit ? '+' : '-'
            const amountColor = isCredit ? 'text-green-600' : 'text-red-500'

            const date = new Date(tx.created_at?? '').toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 
                           bg-transparent border border-green-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-1 rounded-xl bg-gray-50 flex items-center
                                  justify-center text-xl shrink-0">
                    {tx.type === 'escrow_release' }
                    {tx.type === 'starter_grant' }
                    {tx.type === 'purchase'        }
                    {tx.type === 'escrow_lock'     }
                    {tx.type === 'escrow_return'   }
                    {tx.type === 'redemption'     }
                    {tx.type === 'reward_credit'   }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {meta.label}
                    </p>
                    {tx.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{tx.notes}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-0.5">{date}</p>
                  </div>
                </div>
                <p className={`text-base font-bold shrink-0 ${amountColor}`}>
                  {sign}{tx.amount.toLocaleString()} pts
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}