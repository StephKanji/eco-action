import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'signup' | 'org' | null
  const next = searchParams.get('next') ?? '/'

  // Build base client
  const supabase = await createClient()

  // PKCE flow — code exchange
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user) {
      console.error('code exchange failed:', error?.message)
      return NextResponse.redirect(new URL('/login?error=invalid_code', origin))
    }
    return await handleUser(data.user, searchParams.get('type'), origin, supabase)
  }

  // Token hash flow — email confirmation
  if (token_hash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })
    if (error || !data.user) {
      console.error('token_hash exchange failed:', error?.message)
      return NextResponse.redirect(new URL('/login?error=invalid_token', origin))
    }
    return await handleUser(data.user, searchParams.get('type'), origin, supabase)
  }

  return NextResponse.redirect(new URL('/login?error=missing_code', origin))
}

async function handleUser(
  user: any,
  type: string | null,
  origin: string,
  supabase: any
) {
  const meta = user.user_metadata
  const adminClient = createAdminClient()

  console.log('✅ [callback] user confirmed:', user.id, 'type:', type)

  // Idempotency check
  const { data: existing } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (existing) {
    const destinations: Record<string, string> = {
      user: '/profile',
      org: '/register/organization/pending',
      admin: '/dashboard',
    }
    return NextResponse.redirect(
      new URL(destinations[existing.role] ?? '/login', origin)
    )
  }

  if (type === 'org') {
    console.log('✅ [callback] creating org profile...')

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({ id: user.id, role: 'org', display_name: meta.display_name })

    if (profileError) {
      console.error('❌ profile insert failed:', profileError.message)
      return NextResponse.redirect(new URL('/register/organization?error=profile_failed', origin))
    }

    const { error: orgError } = await adminClient
      .from('organizations')
      .insert({
        profile_id: user.id,
        org_name: meta.display_name,
        contact_email: user.email,
        kra_pin: meta.kra_pin,
        description: meta.description ?? null,
      })

    if (orgError) {
      console.error('❌ org insert failed:', orgError.message)
      await adminClient.auth.admin.deleteUser(user.id)
      return NextResponse.redirect(new URL('/register/organization?error=org_failed', origin))
    }

    console.log('✅ [callback] org row created')

    const { data: tokenData, error: tokenError } = await adminClient
      .from('approval_tokens')
      .insert({ org_id: user.id })
      .select('token')
      .single()

    if (!tokenError && tokenData) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      await fetch(`${baseUrl}/api/send-admin-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: meta.display_name,
          contact_email: user.email,
          kra_pin: meta.kra_pin,
          description: meta.description ?? '',
          approveUrl: `${baseUrl}/api/admin/review?token=${tokenData.token}&action=approve`,
          rejectUrl: `${baseUrl}/api/admin/review?token=${tokenData.token}&action=reject`,
        }),
      })
      console.log('✅ [callback] admin notified')
    }

    return NextResponse.redirect(new URL('/register/organization/pending', origin))

  } else {
    console.log('✅ [callback] creating user profile...')

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({ id: user.id, role: 'user', display_name: meta.display_name })

    if (profileError) {
      console.error('❌ profile insert failed:', profileError.message)
      return NextResponse.redirect(new URL('/register/user?error=profile_failed', origin))
    }

    const { error: userRowError } = await adminClient
      .from('users')
      .insert({ id: user.id })

    if (userRowError) {
      console.error('❌ user row insert failed:', userRowError.message)
      await adminClient.auth.admin.deleteUser(user.id)
      return NextResponse.redirect(new URL('/register/user?error=user_failed', origin))
    }

    console.log('✅ [callback] user row created, redirecting to profile')
    return NextResponse.redirect(new URL('/profile', origin))
  }
}