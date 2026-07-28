import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId, org_name } = await request.json()

  if (!userId || !org_name) {
    return NextResponse.json({ error: 'userId and org_name are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Handle profile — create or fix if exists with wrong role. Mirrors
  // register-user's pattern so a double-submit from /redirect (double
  // click, slow network, back-button retry) doesn't hit a duplicate-key
  // error on profiles.id.
  const { data: existing } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()

  if (!existing) {
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({ id: userId, role: 'org', display_name: org_name })

    if (profileError) {
      console.error('❌ profile insert failed:', profileError.message)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    console.log('✅ profile created with role: org')
  } else if (existing.role !== 'org') {
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'org', display_name: org_name })
      .eq('id', userId)

    if (updateError) {
      console.error('❌ profile role update failed:', updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    console.log('✅ profile role corrected to: org')
  }

  // Note: the organizations row (org_name, kra_pin, description, etc.)
  // is intentionally NOT created here — that happens on the org
  // completion form, where those fields are actually collected.

  return NextResponse.json({ success: true })
}