'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function approveOrganization(orgId: string) {
  const adminClient = createAdminClient()

  // 1. Fetch org details first
  const { data: org, error: fetchError } = await adminClient
    .from('organizations')
    .select('org_name, contact_email')
    .eq('id', orgId)
    .single()

  if (fetchError || !org) {
    return { error: fetchError?.message ?? 'Organisation not found' }
  }

  // 2. Update status
  const { error } = await adminClient
    .from('organizations')
    .update({
      verification_status: 'verified',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  // 3. Notify org
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-org-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to:       org.contact_email,
      org_name: org.org_name,
      approved: true,
    }),
  })

  revalidatePath('/dashboards')
  return { success: true }
}

export async function rejectOrganization(orgId: string, reason?: string) {
  const adminClient = createAdminClient()

  // 1. Fetch org details first
  const { data: org, error: fetchError } = await adminClient
    .from('organizations')
    .select('org_name, contact_email')
    .eq('id', orgId)
    .single()

  if (fetchError || !org) {
    return { error: fetchError?.message ?? 'Organisation not found' }
  }

  // 2. Update status
  const { error } = await adminClient
    .from('organizations')
    .update({
      verification_status: 'rejected',
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason ?? null,
    })
    .eq('id', orgId)

  if (error) {
    return { error: error.message }
  }

  // 3. Notify org
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-org-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to:       org.contact_email,
      org_name: org.org_name,
      approved: false,
      reason,
    }),
  })

  revalidatePath('/dashboards')
  return { success: true }
}