import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrgTasks } from '@/lib/org-tasks'

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

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Active Tasks</h1>
        <p className="page-subtitle">{tasks.length} task{tasks.length === 1 ? '' : 's'} currently live</p>
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
            <Link key={task.id} href={`/tasks/${task.id}`} className="card block">
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
  )
}