'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginState = {
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { errors: { general: [error.message] } }
  }

  if (!data.user) {
    return { errors: { general: ['Login failed. Please try again.'] } }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role ?? 'user'

  // Guard org accounts before redirecting
  if (role === 'org') {
    const adminClient = createAdminClient()

    const { data: org } = await adminClient
      .from('organizations')
      .select('verification_status')
      .eq('profile_id', data.user.id)
      .single()

    if (org?.verification_status === 'pending') {
      // Sign them back out — don't leave an active session
      await supabase.auth.signOut()
      return {
        errors: {
          general: ['Your organisation is pending approval. You will be notified by email.'],
        },
      }
    }

    if (org?.verification_status === 'rejected') {
      await supabase.auth.signOut()
      return {
        errors: {
          general: ['Your organisation registration was not verified. Please contact support.'],
        },
      }
    }
  }

  const ROLE_DASHBOARDS: Record<string, string> = {
    user: '/profile',
    org: '/overview',
    admin: '/dashboards',
  }

  redirect(ROLE_DASHBOARDS[role])
}