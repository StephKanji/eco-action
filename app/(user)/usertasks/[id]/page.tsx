import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const adminClient = createAdminClient()

  const { data: task } = await adminClient
    .from('tasks')
    .select(`*, organizations (org_name, description)`)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!task) notFound()

  const { data: existing } = await adminClient
    .from('task_submissions')
    .select('id, status')
    .eq('task_id', id)
    .eq('user_id', user.id)
    .single()

  // Add these two lines back
  const org = task.organizations as any
  const deadline = new Date(task.deadline)
  const daysLeft = Math.ceil(
    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )  

  return (
    <div className="max-w-2xl mx-auto pt-2"> 

      <div className="mt-5 space-y-6">

        {/* Header */}
        <div>
          <p className="hero-title" style={{ fontSize: '2.25rem' }}>
            {org?.org_name}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-green-600">
              +{task.reward_points} pts
            </span>
            <span className={`text-sm font-medium
              ${daysLeft <= 2 ? 'text-red-500' : 'text-gray-400'}`}>
              Deadline: {daysLeft} days left
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            {task.description}
          </p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          {task.location_name && (
            <div className="rounded-xl border p-4">
              <p className="text-xs text-gray-400 mb-1">Location</p>
              <p className="text-sm font-medium">📍 {task.location_name}</p>
            </div>
          )}
          <div className="rounded-xl border p-4">
            <p className="text-xs text-gray-400 mb-1">Proof Required</p>
            <p className="text-sm font-medium capitalize">
              {task.proof_type.replace('_', ' ')}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-gray-400 mb-1">Deadline</p>
            <p className="text-sm font-medium">
              {deadline.toLocaleDateString('en-KE', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
          {task.max_participants && (
            <div className="rounded-xl border p-4">
              <p className="text-xs text-gray-400 mb-1">Max Participants</p>
              <p className="text-sm font-medium">👥 {task.max_participants}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        {existing ? (
          <div className={`w-full p-4 rounded-xl text-center text-sm font-medium
            ${existing.status === 'approved'
              ? 'bg-green-50 text-green-700'
              : existing.status === 'rejected'
              ? 'bg-red-50 text-red-700'
              : 'bg-yellow-50 text-yellow-700'}`}>
            {existing.status === 'approved' && '✅ Submission approved — points credited!'}
            {existing.status === 'rejected' && '❌ Submission was rejected'}
            {existing.status === 'pending' && '⏳ Submission under review'}
          </div>
        ) : (
          <Link
            href={`/usertasks/${task.id}/submit`}
            className="block w-full py-3 px-6 rounded-xl bg-green-600 text-white 
                       font-semibold text-center hover:bg-green-700 transition-colors"
          >
            Accept & Submit Proof →
          </Link>
        )}
        <Link href="/usertasks" className="text-sm text-gray-500 hover:text-gray-700">
        Explore Page
      </Link>
      </div>
    </div>
  )
}