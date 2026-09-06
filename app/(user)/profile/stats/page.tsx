import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BadgeList } from '@/components/badges/badges-list'
import { ImpactTally } from '@/components/profile/impact-tally'
import { requireRole } from '@/lib/auth/guard'

export default async function ProfileStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { role } = await requireRole(['user'])

  const adminClient = createAdminClient()

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

  const { data: impactData } = await adminClient
    .from('task_submissions')
    .select('tasks!inner(category)')
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const impactByCategory = (impactData ?? []).reduce((acc, row) => {
    const category = (row.tasks as any)?.category ?? 'other'
    acc[category] = (acc[category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const { data: submissions } = await adminClient
    .from('task_submissions')
    .select('status')
    .eq('user_id', user.id)

  const totalSubmissions = submissions?.length ?? 0
  const approvedCount = submissions?.filter(s => s.status === 'approved').length ?? 0
  const pendingCount = submissions?.filter(s => s.status === 'pending').length ?? 0
  const rejectedCount = submissions?.filter(s => s.status === 'rejected').length ?? 0
  const completionPct = totalSubmissions > 0
    ? Math.round((approvedCount / totalSubmissions) * 100)
    : 0

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Statistics &amp; Rewards</h1>
        <p className="page-subtitle">Your badges, progress, and environmental impact</p>
      </div>

      {/* ── Badges ───────────────────────────────────── */}
      <div>
        <div className="profile-card-header">
          <p className="profile-card-title">Badges</p>
        </div>
        <BadgeList userId={user.id} initialBadges={badges} />
      </div>

      {/* ── Task Progress ────────────────────────────── */}
      {totalSubmissions > 0 && (
        <div>
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

      {/* ── Impact ───────────────────────────────────── */}
      <ImpactTally impactByCategory={impactByCategory} />

      <Link
        href="/profile"
        className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Click Here to Go Back to Profile
      </Link>
    </div>
  )
}