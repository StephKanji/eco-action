import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrgTasks } from '@/lib/org-tasks'
import { getOrgChallenges } from '@/lib/org-challenges'

export default async function ActiveTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  const tasks = await getOrgTasks(org.id, 'active')

  // Fetch both — upcoming challenges are shown too, so participants can
  // join ahead of the start date to prepare. Submissions stay gated to
  // 'active' server-side in /api/challenges/submit.
  const [liveChallenges, upcomingChallenges] = await Promise.all([
    getOrgChallenges(org.id, 'active'),
    getOrgChallenges(org.id, 'upcoming'),
  ])

  const totalChallenges = liveChallenges.length + upcomingChallenges.length

  return (
    <div className="space-y-10 hero-root pt-10">
      <div className="space-y-6">

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="page-title text-xl">Individual Tasks</h2>
           <p className="page-subtitle">{tasks.length} task{tasks.length === 1 ? '' : 's'} currently live</p>
          </div>
          <Link
            href="/tasks/new"
            className="text-sm text-green-600 font-medium hover:underline shrink-0"
          >
            + New Task
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">No active tasks right now.</p>
            <Link href="/tasks/new" className="text-sm text-green-600 font-medium hover:underline mt-2 inline-block">
              Create your first task →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}/edit`} className="card block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {task.reward_points.toLocaleString()} points · Created{' '}
                      {new Date(task.created_at).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {task.deadline && (
                        <>
                          {' '}· Deadline{' '}
                          {new Date(task.deadline).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 bg-green-100 text-green-700">
                    {task.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Community Challenges ─────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="page-title text-xl">Community Challenges</h2>
            <p className="page-subtitle">
              {totalChallenges} challenge{totalChallenges === 1 ? '' : 's'} live or opening for participants
            </p>
          </div>
          <Link
            href="/challenges/new"
            className="text-sm text-green-600 font-medium hover:underline shrink-0"
          >
            + New Challenge
          </Link>
        </div>

        {totalChallenges === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">No challenges right now.</p>
            <Link href="/challenges/new" className="text-sm text-green-600 font-medium hover:underline mt-2 inline-block">
              Start a community challenge →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Live Now */}
            {liveChallenges.length > 0 && (
              <div className="space-y-3">
                <p className="org-section-label">Live Now</p>
                {liveChallenges.map((challenge) => (
<Link key={challenge.id} href={`/challenges/${challenge.id}/edits`} className="card block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{challenge.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {challenge.reward_pool.toLocaleString()} pt pool · Ends{' '}
                          {new Date(challenge.end_date).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {challenge.max_participants && (
                            <> · Max {challenge.max_participants.toLocaleString()} participants</>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 bg-green-100 text-green-700">
                        Live
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Starting Soon — open for early sign-up so participants can prepare */}
            {upcomingChallenges.length > 0 && (
              <div className="space-y-3">
                <p className="org-section-label">Starting Soon</p>
                {upcomingChallenges.map((challenge) => (
<Link key={challenge.id} href={`/challenges/${challenge.id}/edit`} className="card block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{challenge.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {challenge.reward_pool.toLocaleString()} pt pool · Starts{' '}
                          {new Date(challenge.start_date).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {challenge.max_participants && (
                            <> · Max {challenge.max_participants.toLocaleString()} participants</>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 bg-yellow-100 text-yellow-700">
                        Opens soon
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  )
}