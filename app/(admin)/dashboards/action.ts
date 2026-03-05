'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function approveOrganization(orgId: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('organizations')
    .update({ verification_status: 'verified' })
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/organizations')
  return { success: true }
}

export async function rejectOrganization(orgId: string, reason?: string) {
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('organizations')
    .update({ verification_status: 'rejected' })
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/organizations')
  return { success: true }
}