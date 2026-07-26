// app/(admin)/transaction-page/page.tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  purchase: { label: 'Purchase', color: 'bg-green-100 text-green-700' },
  starter_grant: { label: 'Starter Grant', color: 'bg-blue-100 text-blue-700' },
  escrow_lock: { label: 'Escrow Lock', color: 'bg-yellow-100 text-yellow-700' },
  escrow_release: { label: 'Escrow Release', color: 'bg-green-100 text-green-700' },
  escrow_return: { label: 'Escrow Return', color: 'bg-gray-100 text-gray-700' },
  reward_credit: { label: 'Reward Credit', color: 'bg-green-100 text-green-700' },
  redemption: { label: 'Redemption', color: 'bg-red-100 text-red-700' },
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/login')

  const { type } = await searchParams
  const adminClient = createAdminClient()

  let query = adminClient
    .from('point_transactions_enriched')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (type) {
    query = query.eq('type', type)
  }

  const { data: transactions } = await query

  const allTypes = Object.keys(TYPE_STYLES)

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Transactions</h1>
        <p className="text-xs text-gray-400 mt-1">Full points ledger, most recent first</p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        
         <a href="/transaction-page"
          className={`text-xs font-medium px-3 py-1 rounded-full ${!type ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          All
        </a>
        {allTypes.map((t) => (
          
          <a  key={t}
            href={`/transaction-page?type=${t}`}
            className={`text-xs font-medium px-3 py-1 rounded-full ${type === t ? 'bg-gray-800 text-white' : TYPE_STYLES[t].color}`}
          >
            {TYPE_STYLES[t].label}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">From</th>
              <th className="py-2 pr-4">To</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((tx) => {
              const style = TYPE_STYLES[tx.type] ?? { label: tx.type, color: 'bg-gray-100 text-gray-700' }
              return (
                <tr key={tx.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.color}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-700">{tx.from_entity_name ?? '—'}</td>
                  <td className="py-2 pr-4 text-gray-700">{tx.to_entity_name ?? '—'}</td>
                  <td className="py-2 pr-4 font-semibold text-gray-900">{tx.amount.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-xs text-gray-400 max-w-xs truncate">{tx.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {(!transactions || transactions.length === 0) && (
          <p className="text-sm text-gray-400 py-6 text-center">No transactions match this filter.</p>
        )}
      </div>
    </div>
  )
}