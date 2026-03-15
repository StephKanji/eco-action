
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WalletCard } from '@/components/wallet/wallet-card'
import { BadgeList } from '@/components/badges/badges-list'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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


  // Fetch earned badges
  const { data: earnedBadges } = await adminClient
    .from('user_milestones')
    .select(`
      milestone_key, achieved_at,
      badges!inner (name, description, icon)
    `)
    .eq('user_id', user.id)
    .order('achieved_at', { ascending: true })

  const badges = (earnedBadges ?? []).map(b => ({
    milestone_key: b.milestone_key,
    achieved_at: b.achieved_at,
    name: (b.badges as any).name,
    description: (b.badges as any).description,
    icon: (b.badges as any).icon,
  }))

  const { data: submissions } = await adminClient
    .from('task_submissions')
    .select('status')
    .eq('user_id', user.id)

  const totalSubmissions = submissions?.length ?? 0
  const approvedCount = submissions?.filter(s => s.status === 'approved').length ?? 0
  const pendingCount = submissions?.filter(s => s.status === 'pending').length ?? 0
  const rejectedCount = submissions?.filter(s => s.status === 'rejected').length ?? 0

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-KE', {
      month: 'long', year: 'numeric',
    })
    : '—'

  const tierLabels: Record<number, { label: string; color: string; bg: string; icon: string; moto: string }> = {
    1: { label: 'Seedling', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '🌱', moto: 'Start small, grow strong.' },
    2: { label: 'Sprout', color: 'text-lime-700', bg: 'bg-lime-50 border-lime-200', icon: '🌿', moto: 'Keep pushing, you\'re thriving!' },
    3: { label: 'Guardian', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: '🛡️', moto: 'Protect the planet, one task at a time.' },
    4: { label: 'Champion', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🏆', moto: 'Lead the change, inspire others.' },
    5: { label: 'EcoLegend', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '🌍', moto: 'Inspire others to make a difference.' },
  }

  const tier = tierLabels[userRow?.tier_id ?? 1]
  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?'
  const completionPct = totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0

  return (
    <div>
      <div className="card mt-50 space-x-15 items-center ">

        {/* ── Hero Header ── */}
        <div >
          <div aria-hidden="true" />

          <div className="flex-1 min-w-0">

            <p className="text-xs text-gray-400 mt-0.5">Since {memberSince}</p>
          </div>
        </div>
        {/* Wallet */}
        <WalletCard userId={user.id} />
        {/* Badges */}
        <div>
          <BadgeList userId={user.id} initialBadges={badges} />
        </div>

        {/* Streaks */}
        <div className="profile-streak-row">
          <div className="profile-streak-card">
            <p className="profile-streak-value">{userRow?.current_streak ?? 0}</p>
            <p className="profile-streak-label">Current Streak</p>
          </div>
          <div className="profile-streak-card">
            <p className="profile-streak-value">{userRow?.longest_streak ?? 0}</p>
            <p className="profile-streak-label">Best Streak</p>
          </div>
        </div>

      </div>

      {/* ── Content Stack ── */}
      <div className="profile-streak-row">

        {/* Task Progress */}
        {totalSubmissions > 0 && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">Task Progress</h2>
              <span className="profile-card-pct">{completionPct}%</span>
            </div>

            {/* Bar */}
            <div className="profile-progress-track">
              <div
                className="profile-progress-fill"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="profile-progress-meta">
              <span>{approvedCount} completed</span>
              <span>{totalSubmissions} submitted</span>
            </div>

            {/* Breakdown */}
            <div className="profile-status-grid">
              <div className="profile-status-chip approved">
                <p className="profile-status-num">{approvedCount}</p>
                <p className="profile-status-lbl">Approved</p>
              </div>
              <div className="profile-status-chip pending">
                <p className="profile-status-num">{pendingCount}</p>
                <p className="profile-status-lbl">Pending</p>
              </div>
              <div className="profile-status-chip rejected">
                <p className="profile-status-num">{rejectedCount}</p>
                <p className="profile-status-lbl">Rejected</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <Link href="/usertasks" className="flex items-center justify-between w-full px-5 py-4
             rounded-2xl bg-white border border-gray-100 text-gray-900
             font-semibold hover:border-green-300 hover:bg-green-50
             transition-colors shadow-sm">
          <div className="profile-cta-text">
            <span className="profile-cta-main">Explore Tasks</span>
            <span className="profile-cta-sub">Find eco tasks near you</span>
          </div>
          <span className="profile-cta-arrow">→</span>
        </Link>

        <Link
          href="/transactions"
          className="flex items-center justify-between w-full px-5 py-4
             rounded-2xl bg-white border border-gray-100 text-gray-900
             font-semibold hover:border-green-300 hover:bg-green-50
             transition-colors shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💳</span>
            <div className="text-left">
              <p className="font-semibold">Transaction History</p>
              <p className="text-xs text-gray-400 font-normal">
                View your transactions
              </p>
            </div>
          </div>
          <span className="text-gray-300">→</span>
        </Link>



      </div>
    </div>
  )
}