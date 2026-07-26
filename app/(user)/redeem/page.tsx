// app/(user)/redeem/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import RedeemPanel from './redeem-panel'

export default async function RedeemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: userRow } = await adminClient
    .from('users')
    .select('current_points')
    .eq('id', user.id)
    .single()

  if (!userRow) redirect('/login')

  const { data: rewards } = await adminClient
    .from('rewards_catalog')
    .select('id, title, type, points_cost, value_kes')
    .eq('is_active', true)
    .order('points_cost', { ascending: true })

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Redeem Points</h1>
        <p className="text-xs text-gray-400 mt-1">Turn your points into real rewards</p>
      </div>

      <div className="stat-card">
        <p className="stat-card-value">{userRow.current_points.toLocaleString()}</p>
        <p className="stat-card-label">Available Points</p>
      </div>

      <RedeemPanel rewards={rewards ?? []} currentPoints={userRow.current_points} />
    </div>
  )
}