import { createAdminClient } from '@/lib/supabase/admin'

export type OrgChallenge = {
  id: string
  title: string
  category: string
  status: string
  reward_pool: number
  start_date: string
  end_date: string
  max_participants: number | null
}

export async function getOrgChallenges(orgId: string, status?: string): Promise<OrgChallenge[]> {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('community_challenges')
    .select('id, title, category, status, reward_pool, start_date, end_date, max_participants')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data } = await query
  return data ?? []
}