import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WalletCard } from '@/components/wallet/wallet-card'
import { BadgeList } from '@/components/badges/badges-list'
import UserOnboardingTour from './user-onboarding-tour'

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
    achieved_at:   b.achieved_at,
    name:          (b.badges as any).name,
    description:   (b.badges as any).description,
    icon:          (b.badges as any).icon,
  }))

  const { data: submissions } = await adminClient
    .from('task_submissions')
    .select('status')
    .eq('user_id', user.id)

  const totalSubmissions = submissions?.length ?? 0
  const approvedCount    = submissions?.filter(s => s.status === 'approved').length ?? 0
  const pendingCount     = submissions?.filter(s => s.status === 'pending').length  ?? 0
  const rejectedCount    = submissions?.filter(s => s.status === 'rejected').length ?? 0
  const completionPct    = totalSubmissions > 0
    ? Math.round((approvedCount / totalSubmissions) * 100)
    : 0

  return (
    <div >
    <div className="space-y-6 pt-10">
    <UserOnboardingTour />
      {/* Wallet */}
      <div >
        <div className="profile-card-header">
          <p className="profile-card-title">Wallet: Complete tasks to rise tier</p>
        </div>
        {/* WalletCard handles its own loading state */}
        <WalletCard userId={user.id} />
      </div>

      {/* Streaks */}
      <div className='profile-streak-row'>
        <div >
          <p className="profile-streak-label">Current Streak</p>
          <p className="profile-streak-value">{userRow?.current_streak ?? 0}</p>
          
        </div>
        <div>
          <p className="profile-streak-label">Best Streak</p>
          <p className="profile-streak-value">{userRow?.longest_streak ?? 0}</p>
          
        </div>
      </div>

      {/* ── Task Progress ────────────────────────────── */}
      {totalSubmissions > 0 && (
        <div >
          <div className="profile-card-header">
            <p className="profile-card-title">Task Progress</p>
            <span className="profile-card-pct">{completionPct}%</span>
          </div>

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

      {/* ── Badges ───────────────────────────────────── */}
      <div >
        <div className="profile-card-header">
          <p className="profile-card-title">Badges</p>
        </div>
        <BadgeList userId={user.id} initialBadges={badges} />
      </div>

      {/* ── CTAs  */}
     
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
        <Link
          href="/usertasks"
          className="btn btn-primary justify-center py-3 rounded-xl text-sm"
        >
           Explore More Tasks
        </Link>
        <Link
          href="/redeem"
          className="btn btn-primary justify-center py-3 rounded-xl text-sm"
        >
          Redeem Points
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