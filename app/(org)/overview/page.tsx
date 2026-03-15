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

  // Fetch quick stats
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

  const statusStyles: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700' },
    verified: { label: 'Verified',       color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected',       color: 'bg-red-100 text-red-700' },
  }

  const status = statusStyles[org.verification_status] ?? statusStyles.pending
  const isVerified = org.verification_status === 'verified'

  const memberSince = new Date(org.created_at).toLocaleDateString('en-KE', {
    month: 'long', year: 'numeric'
  })

  return (
    
    <div >
      <div className="max-w-4xl mx-auto pt-40 space-y-6">

        {/* Header card */}
        <div className="card">
          <div className="flex items-center gap-4">
            
          
            <div className="flex-1 min-w-0">
              
              <p className="text-xs text-gray-400 mt-0.5">Since {memberSince}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${status.color}`}>
              {status.label}
            </span>
          </div>

          {org.description && (
            <p className="text-sm text-gray-500 mt-4 leading-relaxed">
              {org.description}
            </p>
          )}

          {/* Contact */}
        <div >
          <p className="text-xs text-gray-400 mt-0.5">
            Contact Email
          </p>
          <p className="text-sm text-gray-800">{org.contact_email}</p>
        </div>
        </div>

        {/* Pending notice */}
        {org.verification_status === 'pending' && (
          <div className="card">
            <p className="text-sm font-medium text-yellow-800">
              ⏳ Awaiting admin approval
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Your organisation is under review. You will be notified once approved.
            </p>
          </div>
        )}

      

        {/* Stats row — only if verified */}
        {isVerified && (
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <div>
                <p className="text-xl font-bold text-gray-900">{totalTasks ?? 0}</p>
                <p className="text-xs text-gray-400">Active Tasks</p>
                 <p className="text-xl font-bold text-gray-900">{pendingReviews ?? 0}</p>
                <p className="text-xs text-gray-400">Pending Reviews</p>
              <p className="text-xl font-bold text-gray-900">
                {org.points_balance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">Available Points</p>
              
              <p className="text-xl font-bold text-gray-900">
                {org.escrow_balance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">In Escrow</p>
              </div>
            </div>
            <div>
              <div className="space-y-3">
                <Link
              href="/tasks/new"
              className="card-strong"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-semibold">Create New Task</p>
                  <p className="text-xs font-normal">
                    Post an eco task for users
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/submissions"
              className="card-strong
            "
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-semibold">Review Submissions</p>
                  <p className="text-xsfont-normal">
                    {pendingReviews
                      ? `${pendingReviews} awaiting your review`
                      : 'No pending reviews'}
                  </p>
                </div>
              </div>
            </Link>
            </div>
            </div>
          </div>
        )}

        

      </div>
    </div>
  )
}