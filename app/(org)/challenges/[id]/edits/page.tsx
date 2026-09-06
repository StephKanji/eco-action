// app/(org)/challenges/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import EditChallengeForm from './edit-challenge-form'

export default async function EditChallengePage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: challenge } = await adminClient
    .from('community_challenges')
    .select('id, org_id, title, description, category, reward_pool, end_date, status, max_participants')
    .eq('id', id)
    .single()

  if (!challenge || challenge.org_id !== org.id) redirect('/overview/active-tasks')

  return (
    <div className="space-y-6 hero-root pt-10">
      <div>
        <h1 className="page-title">Edit Challenge</h1>
        <p className="page-subtitle">Reward pool can't be changed after publishing — everything else can.</p>
      </div>
      <EditChallengeForm challenge={challenge} />
    </div>
  )
}