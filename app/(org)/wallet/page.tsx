import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import BuyPointsPanel from './buy-points-panel'
import OrgWalletBalances from './org-wallet-balances'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name, points_balance, escrow_balance')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  const { data: packages } = await adminClient
    .from('points_packages')
    .select('id, name, points, price_kes')
    .eq('is_active', true)
    .order('price_kes', { ascending: true })

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Explore your Wallet</h1>
        <p className="text-xs text-gray-400 mt-1">user: {org.org_name}</p>
      </div>

      {/* Live-updating balance cards */}
      <OrgWalletBalances
        orgId={org.id}
        initialPoints={org.points_balance}
        initialEscrow={org.escrow_balance}
      />

      <BuyPointsPanel packages={packages ?? []} />
    </div>
  )
}
