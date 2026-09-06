// app/(org)/tasks/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import EditTaskForm from './edit-task-form'

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!org) redirect('/login')

  const { data: task } = await adminClient
    .from('tasks')
    .select('id, org_id, title, description, category, proof_type, reward_points, status, deadline, max_participants')
    .eq('id', id)
    .single()

  if (!task || task.org_id !== org.id) redirect('/overview/active-tasks')

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Edit Task</h1>
        <p className="page-subtitle">Reward points can't be changed after a task goes live — everything else can.</p>
      </div>
      <EditTaskForm task={task} />
    </div>
  )
}