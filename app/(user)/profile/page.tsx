import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WalletCard } from '@/components/wallet/wallet-card'
import UserOnboardingTour from './user-onboarding-tour'
import { requireRole } from '@/lib/auth/guard'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { role } = await requireRole(['user'])

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role, display_name, created_at')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'user') redirect('/login')

  const { data: userRow } = await adminClient
    .from('users')
    .select('current_points, lifetime_points, current_streak, longest_streak, tier_id')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <div className="space-y-6 pt-10">
        <UserOnboardingTour />

        {/* Wallet */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="profile-card-title pb-5">Welcome, {profile?.display_name || user.email}</p>
              {/* WalletCard handles its own loading state */}
              <WalletCard userId={user.id} />
            </div>

            <Link
              href="/redeem"
              className="btn btn-primary justify-center py-3 rounded-xl text-sm"
            >
              Redeem Airtime Points
            </Link>
          </div>
        </div>

        {/* Streaks */}
        <div className='profile-streak-row'>
          <div>
            <p className="profile-streak-label">Current Streak</p>
            <p className="profile-streak-value">{userRow?.current_streak ?? 0}</p>
          </div>
          <div>
            <p className="profile-streak-label">Best Streak</p>
            <p className="profile-streak-value">{userRow?.longest_streak ?? 0}</p>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          <Link
            href="/usertasks"
            className="btn btn-primary justify-center py-3 rounded-xl text-sm"
          >
            Explore More Tasks
          </Link>

          <Link
            href="/profile/stats"
            className="btn btn-primary justify-center py-3 rounded-xl text-sm"
          >
            Statistics &amp; Rewards
          </Link>

          <Link
            href="/transactions"
            className="btn btn-primary justify-center py-3 rounded-xl text-sm"
          >
            Transaction History
          </Link>
        </div>
      </div>
    </div>
  )
}