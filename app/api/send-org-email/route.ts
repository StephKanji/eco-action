import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, org_name, contact_email, kra_pin, description } = await req.json()

    if (!userId || !org_name || !contact_email || !kra_pin) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Idempotency — skip if profile already exists
    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existing) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({ id: userId, role: 'org', display_name: org_name })

      if (profileError) {
        console.error('profile insert failed:', profileError.message)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    // Idempotency — skip if org already exists
    const { data: existingOrg } = await adminClient
      .from('organizations')
      .select('id')
      .eq('profile_id', userId)
      .single()

    if (!existingOrg) {
      const { error: orgError } = await adminClient
        .from('organizations')
        .insert({
          profile_id:    userId,
          org_name,
          contact_email,
          kra_pin,
          description:   description ?? null,
        })

      if (orgError) {
        console.error('org insert failed:', orgError.message)
        return NextResponse.json({ error: orgError.message }, { status: 500 })
      }

      // Generate approval token
      const { data: tokenData, error: tokenError } = await adminClient
        .from('approval_tokens')
        .insert({ org_id: userId })
        .select('token')
        .single()

      if (!tokenError && tokenData) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        await fetch(`${baseUrl}/api/send-admin-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_name,
            contact_email,
            kra_pin,
            description: description ?? '',
            approveUrl: `${baseUrl}/api/admin/review?token=${tokenData.token}&action=approve`,
            rejectUrl:  `${baseUrl}/api/admin/review?token=${tokenData.token}&action=reject`,
          }),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('register-org error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
