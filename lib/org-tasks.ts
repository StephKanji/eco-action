// lib/queries/org-tasks.ts
import { createAdminClient } from '@/lib/supabase/admin'

export type OrgTask = {
  id: string
  title: string
  status: string
  reward_points: number
  created_at: string
  deadline: string | null
}

export async function getOrgTasks(orgId: string, status?: string): Promise<OrgTask[]> {
  const adminClient = createAdminClient()

  let query = adminClient
    .from('tasks')
    .select('id, title, status, reward_points, created_at, deadline')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data } = await query
  return data ?? []
}