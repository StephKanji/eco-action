import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TaskChallengeTabs } from '@/components/tabs/task-challenge-tabs'

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting:      ' Tree Planting',
  waste_collection:   ' Waste Collection',
  recycling:          ' Recycling',
  clean_energy:       ' Clean Energy',
  water_conservation: ' Water Conservation',
  other:              ' Other',
}

const PROOF_LABELS: Record<string, string> = {
  photo:       ' Photo',
  gps_checkin: ' GPS Check-in',
  qr_scan:     ' QR Scan',
  receipt:     ' Receipt',
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending:  { label: '⏳ Submitted',  className: 'bg-yellow-50 text-yellow-600' },
  approved: { label: '✓ Approved',    className: 'bg-blue-50 text-blue-600' },
  rejected: { label: '✕ Rejected',    className: 'bg-red-50 text-red-500' },
}

export default async function TaskFeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: userRow } = await adminClient
    .from('users')
    .select('tier_id, current_points')
    .eq('id', user.id)
    .single()

  const { data: tasks } = await adminClient
    .from('tasks')
    .select(`
      id, title, description, category, reward_points,
      proof_type, min_tier_id, max_participants, deadline,
      location_name, created_at,
      organizations (org_name)
    `)
    .eq('status', 'active')
    .or(`min_tier_id.is.null,min_tier_id.lte.${userRow?.tier_id ?? 1}`)
    .gt('deadline', new Date().toISOString())
    .order('created_at', { ascending: false })

  const taskIds = (tasks ?? []).map(t => t.id)

  // Participant counts + the current user's own submission status per task —
  // there's no stored count column on `tasks` (unlike community_challenges),
  // so we aggregate from task_submissions ourselves.
  const { data: submissions } = taskIds.length
    ? await adminClient
        .from('task_submissions')
        .select('task_id, user_id, status')
        .in('task_id', taskIds)
    : { data: [] as { task_id: string; user_id: string; status: string }[] }

  const participantCounts: Record<string, number> = {}
  const myStatusByTask: Record<string, string> = {}

  for (const sub of submissions ?? []) {
    // Rejected submissions don't count as active participation.
    if (sub.status !== 'rejected') {
      participantCounts[sub.task_id] = (participantCounts[sub.task_id] ?? 0) + 1
    }
    if (sub.user_id === user.id) {
      myStatusByTask[sub.task_id] = sub.status
    }
  }

  return (
    <div className="space-y-6 mt">
       <div className="pt-15">

<TaskChallengeTabs />
     </div>

      {/* Header */}
      <div>
        <h1 className="page-title">Eco Actions</h1>
        <p className="page-subtitle">Complete tasks or join community challenges to earn points</p>
      </div>

    

      {/* Task list */}
      {!tasks || tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🌿</span>
          <h2 className="text-lg font-semibold text-gray-700">No tasks available yet</h2>
          <p className="text-sm text-gray-400 mt-1">Check back soon — new tasks are added regularly.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => {
            const deadline = new Date(task.deadline)
            const daysLeft = Math.ceil(
              (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            const org = task.organizations as any
            const joinedCount = participantCounts[task.id] ?? 0
            const myStatus = myStatusByTask[task.id]
            // Only count toward the cap if the CURRENT user hasn't already
            // submitted — otherwise a user who already submitted would see
            // their own task as blocked once the cap fills behind them.
            const spotsFull = task.max_participants != null
              && joinedCount >= task.max_participants
              && !myStatus

            const cardContent = (
              <>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium truncate">
                      {org?.org_name ?? 'Organization'}
                    </p>
                    <h2 className="font-semibold text-gray-900 mt-0.5 leading-snug">
                      {task.title}
                    </h2>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-green-600">+{task.reward_points}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {task.description}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                    {CATEGORY_LABELS[task.category] ?? task.category}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {PROOF_LABELS[task.proof_type] ?? task.proof_type}
                  </span>
                  {task.location_name && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                      📍 {task.location_name}
                    </span>
                  )}

                  {/* Participant count — shows fill against the cap when one exists */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${spotsFull ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-600'}`}>
                    👥 {joinedCount}{task.max_participants ? ` / ${task.max_participants}` : ''}
                    {spotsFull ? ' (full)' : ''}
                  </span>

                  {/* Current user's own submission status, if they've already submitted */}
                  {myStatus && STATUS_LABELS[myStatus] && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABELS[myStatus].className}`}>
                      {STATUS_LABELS[myStatus].label}
                    </span>
                  )}

                  <span className={`text-xs px-2 py-1 rounded-full ml-auto font-medium
                    ${daysLeft <= 2
                      ? 'bg-red-50 text-red-600'
                      : daysLeft <= 7
                      ? 'bg-yellow-50 text-yellow-600'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                    ⏰ {daysLeft}d left
                  </span>
                </div>
              </>
            )

            // Full tasks (that this user hasn't already submitted to) render
            // as a non-interactive card instead of a link — blocks reaching
            // the submission form entirely rather than just styling the badge.
            if (spotsFull) {
              return (
                <div
                  key={task.id}
                  aria-disabled="true"
                  className="m-5 space-y-4 opacity-60 cursor-not-allowed"
                >
                  <div className="p-5 btn-ghost space-y-4">
                    {cardContent}
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={task.id}
                href={`/usertasks/${task.id}`}
                className="m-5 space-y-4"
              >
                <div className="p-5 btn-ghost space-y-4">
                  {cardContent}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}