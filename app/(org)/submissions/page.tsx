import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ApproveButton, RejectButton } from '@/components/submissions/review-button'


export default async function OrgSubmissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  // Get org for this user
  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name, verification_status')
    .eq('profile_id', user.id)
    .single()

  if (!org || org.verification_status !== 'verified') redirect('/login')

 // Fetch all pending submissions for this org's tasks
  const { data: submissions } = await adminClient
    .from('task_submissions')
    .select(`
      id, status, proof_url, proof_metadata, submitted_at,
      tasks!inner (id, title, reward_points, org_id),
      users!inner (id)
    `)
    .eq('tasks.org_id', org.id)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  // Fetch recently reviewed (last 10)
  const { data: reviewed } = await adminClient
    .from('task_submissions')
    .select(`
      id, status, proof_url, submitted_at, reviewed_at,
      tasks!inner (id, title, reward_points, org_id)
    `)
    .eq('tasks.org_id', org.id)
    .in('status', ['approved', 'rejected'])
    .order('reviewed_at', { ascending: false })
    .limit(10)

  // Generate signed URLs for pending submissions
  const submissionsWithSignedUrls = await Promise.all(
    (submissions ?? []).map(async (sub) => {
      const path = sub.proof_url.split('/task-proofs/')[1]
      const { data } = await adminClient.storage
        .from('task-proofs')
        .createSignedUrl(path, 3600)
      return { ...sub, signed_url: data?.signedUrl ?? sub.proof_url }
    })
  )


  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <Link href="/overview" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Submission Review</h1>
        <p className="text-sm text-gray-500 mt-1">
          {submissions?.length ?? 0} pending review
        </p>
      </div>

      {/* Pending submissions */}
      {!submissions || submissions.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed 
                        border-gray-200 rounded-2xl">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium">All caught up!</p>
          <p className="text-sm mt-1">No pending submissions</p>
        </div>
      ) : (
        <div className="space-y-4 mb-12">
          {submissionsWithSignedUrls.map(sub => {
            const task = sub.tasks as any
            const submittedAt = sub.submitted_at
              ? new Date(sub.submitted_at).toLocaleDateString('en-KE', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })
              : 'Unknown date'

            return (
              <div key={sub.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

                {/* Task name + reward */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Task</p>
                    <p className="font-semibold text-gray-900">{task.title}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600 shrink-0">
                    +{task.reward_points} pts
                  </span>
                </div>

                {/* Proof image */}
                <div className="rounded-xl overflow-hidden bg-gray-100 mb-4 
                                relative h-56">
                  <img
                    src={(sub as any).signed_url}
                    alt="Submission proof"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Metadata */}
                <p className="text-xs text-gray-400 mb-4">
                  Submitted {submittedAt}
                </p>

                {/* Action buttons */}
                <div className="flex gap-3">
  <ApproveButton submissionId={sub.id} orgId={org.id} />
  <RejectButton submissionId={sub.id} orgId={org.id} />
</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recently reviewed */}
      {reviewed && reviewed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Reviewed
          </h2>
          <div className="space-y-2">
            {reviewed.map(sub => {
              const task = sub.tasks as any
              return (
                <div key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl
                             bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-700 truncate flex-1">
                    {task.title}
                  </p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ml-3
                    ${sub.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'}`}>
                    {sub.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}