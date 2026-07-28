import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'login' | null

  const supabase = await createClient()

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user) {
      console.error('code exchange failed:', error?.message)
      return NextResponse.redirect(new URL('/login?error=invalid_code', origin))
    }
    return await handleUser(data.user, type, origin)
  }

  if (token_hash) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })
    if (error || !data.user) {
      console.error('token_hash exchange failed:', error?.message)
      return NextResponse.redirect(new URL('/login?error=invalid_token', origin))
    }
    return await handleUser(data.user, type, origin)
  }

  return NextResponse.redirect(new URL('/login?error=missing_code', origin))
}

async function handleUser(user: any, type: string | null, origin: string) {
  const adminClient = createAdminClient()

  const { data: existing, error: existingError } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('❌ profile lookup failed:', existingError.message)
    return NextResponse.redirect(new URL('/login?error=profile_lookup_failed', origin))
  }

  const destinations: Record<string, string> = {
    user: '/profile',
    org: '/register/organization/pending',
    admin: '/dashboards',
  }

  if (type === 'login') {
    if (!existing) {
      console.log('❌ [callback] Google login attempt, no account found')
      return NextResponse.redirect(new URL('/login?error=no_account', origin))
    }
    console.log('✅ [callback] existing account logging in, role:', existing.role)
    return NextResponse.redirect(new URL(destinations[existing.role] ?? '/login', origin))
  }

  // Registration path: password-confirmation link, or a first-time Google
  // sign-up. Role isn't decided here anymore — that happens on /redirect.
  if (existing) {
    // This account already has a role, so it isn't actually a first-time
    // signup — most likely a returning user who ended up back on a
    // registration/confirmation link.
    console.log('✅ [callback] existing account hit registration flow, role:', existing.role)
    return NextResponse.redirect(new URL('/login?message=account_exists', origin))
  }

  console.log('✅ [callback] new account confirmed, sending to role selection:', user.id)
  return NextResponse.redirect(new URL('/redirect', origin))
}