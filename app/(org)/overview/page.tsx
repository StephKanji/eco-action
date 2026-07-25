import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function OrgOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name, contact_email, description, verification_status, created_at, points_balance, escrow_balance')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  const { count: totalTasks } = await adminClient
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.id)
    .eq('status', 'active')

  const { count: pendingReviews } = await adminClient
    .from('task_submissions')
    .select('*, tasks!inner(org_id)', { count: 'exact', head: true })
    .eq('tasks.org_id', org.id)
    .eq('status', 'pending')

  const { count: activeChallenges } = await adminClient
    .from('community_challenges')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', org.id)
    .eq('status', 'active')

  const { count: pendingChallengeReviews } = await adminClient
    .from('challenge_submissions')
    .select('*, community_challenges!inner(org_id)', { count: 'exact', head: true })
    .eq('community_challenges.org_id', org.id)
    .eq('status', 'pending')

  const statusStyles: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
    verified: { label: 'Verified', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  }

  const status = statusStyles[org.verification_status] ?? statusStyles.pending
  const isVerified = org.verification_status === 'verified'


  return (
    <div className="space-y-6 hero-root pt-10">

      {/* ── Header card ─────────────────────────────────── */}
      <div >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="page-title truncate">{org.org_name}</h1>
            <p className="text-xs text-gray-400 mt-1">Member since </p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${status.color}`}>
            {status.label}
          </span>
        </div>

        {org.description && (
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">{org.description}</p>
        )}

        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Contact Email</p>
          <p className="text-sm text-gray-800 mt-0.5">{org.contact_email}</p>
        </div>
      </div>

      {/* ── Pending notice ──────────────────────────────── */}
      {org.verification_status === 'pending' && (
        <div className="rounded-xl p-4 bg-yellow-50 border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800"> Awaiting admin approval</p>
          <p className="text-xs text-yellow-700 mt-1">
            Your organisation is under review. You will be notified once approved.
          </p>
        </div>
      )}



      {/* ── Task Progress ────────────────────────────── */}
      {isVerified && (
        <>
          <div>
            <div className="profile-card-header">
              <p className="profile-card-title">Task Progress</p>
            </div>
            <div className="profile-status-grid">
              <div className="profile-status-chip approved">
                <p className="profile-status-lbl">total</p>
                <p className="profile-status-num">{totalTasks ?? 0}</p>
              </div>
              <div className="profile-status-chip pending">

                <p className="profile-status-lbl">Pending</p>
                <p className="profile-status-num">{pendingReviews ?? 0}</p>
              </div>
              <div className="profile-status-chip rejected">
                <p className="profile-status-lbl">Active</p>
                <p className="profile-status-num">{activeChallenges ?? 0}</p>
              </div>
              <div className="profile-status-chip challenge">
                <p className="stat-card-label">Challenge Reviews</p>
                <p className="stat-card-value">{pendingChallengeReviews ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Points row */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <p className="stat-card-value">{org.points_balance.toLocaleString()}</p>
                <p className="stat-card-label">Available Points</p>
              </div>
              <div className="stat-card">
                <p className="stat-card-value">{org.escrow_balance.toLocaleString()}</p>
                <p className="stat-card-label">In Escrow</p>
              </div>
            </div>
          </div>
          <div>
            <Link href="/wallet" className="card-strong" style={{ display: 'block', marginTop: '12px' }}>
    <div className="flex items-center gap-3">
      <div>
        <p className="font-semibold text-white">Purchase Points</p>
        <p className="text-xs text-white/70 mt-0.5">Top up your balance to fund new tasks</p>
      </div>
    </div>
  </Link>
          </div>

          {/* ── Individual task actions ──────────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Individual Tasks
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="/tasks/new" className="card-strong">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-white">Create New Task</p>
                    <p className="text-xs text-white/70 mt-0.5">Post an eco task for users</p>
                  </div>
                </div>
              </Link>
              <Link href="/submissions" className="card-strong">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-white">Review Submissions</p>
                    <p className="text-xs text-white/70 mt-0.5">
                      {pendingReviews
                        ? `${pendingReviews} awaiting your review`
                        : 'No pending reviews'}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* ── Community challenge actions ──────────────── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Community Challenges
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="/challenges/new" className="card-strong">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-white">Create Community Challenge</p>
                    <p className="text-xs text-white/70 mt-0.5">
                      Rally the community around a shared goal
                    </p>
                  </div>
                </div>
              </Link>
              <Link href="/challenges/submissions" className="card-strong">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-white">Challenge Reviews</p>
                    <p className="text-xs text-white/70 mt-0.5">
                      {pendingChallengeReviews
                        ? `${pendingChallengeReviews} awaiting your review`
                        : 'No pending reviews'}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

    </div>
  )
}