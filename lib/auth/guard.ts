import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const ROLE_DASHBOARDS: Record<string, string> = {
  user: '/profile',
  org: '/overview',
  admin: '/dashboards',
}

export async function requireRole(allowedRoles: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect(profile ? (ROLE_DASHBOARDS[profile.role] ?? '/login') : '/login')
  }

  return { user, role: profile.role }
}

// Use on auth pages (login, register) — bounces away if already signed in.
export async function redirectIfAuthenticated() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  redirect(profile ? (ROLE_DASHBOARDS[profile.role] ?? '/profile') : '/profile')
}