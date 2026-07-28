import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId, kra_pin, description } = await request.json()

  if (!userId || !kra_pin) {
    return NextResponse.json({ error: 'userId and kra_pin are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { data: authUser } = await adminClient.auth.admin.getUserById(userId)
  const contactEmail = authUser?.user?.email ?? ''

  const { error: orgError } = await adminClient
    .from('organizations')
    .insert({
      profile_id: userId,
      org_name: profile.display_name,
      contact_email: contactEmail,
      kra_pin,
      description: description ?? null,
    })

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 })
  }

  const { data: tokenData } = await adminClient
    .from('approval_tokens')
    .insert({ org_id: userId })
    .select('token')
    .single()

  if (tokenData) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    await fetch(`${baseUrl}/api/send-admin-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_name: profile.display_name,
        contact_email: contactEmail,
        kra_pin,
        description: description ?? '',
        approveUrl: `${baseUrl}/api/admin/review?token=${tokenData.token}&action=approve`,
        rejectUrl: `${baseUrl}/api/admin/review?token=${tokenData.token}&action=reject`,
      }),
    })
  }

  return NextResponse.json({ success: true })
}