'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const RegisterOrgSchema = z.object({
  org_name: z.string().min(2, 'Organisation name is required'),
  contact_email: z.string().email('Invalid email address'),
  kra_pin: z.string().min(11, 'Enter a valid KRA PIN').max(11),
  description: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterOrgState = {
  errors?: {
    org_name?: string[]
    contact_email?: string[]
    kra_pin?: string[]
    description?: string[]
    password?: string[]
    general?: string[]
  }
  success?: boolean
}

export async function registerOrganization(
  _prevState: RegisterOrgState,
  formData: FormData
): Promise<RegisterOrgState> {
  const validated = RegisterOrgSchema.safeParse({
    org_name: formData.get('org_name'),
    contact_email: formData.get('contact_email'),
    kra_pin: formData.get('kra_pin'),
    description: formData.get('description'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { org_name, contact_email, kra_pin, description, password } = validated.data
  const supabase = await createClient()

  // in registerOrganization
console.log('🔗 org emailRedirectTo:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=org`)


  const { data, error } = await supabase.auth.signUp({
    email: contact_email,
    password,
    options: {
      data: { display_name: org_name, kra_pin, description },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=org`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { errors: { contact_email: ['This email is already registered'] } }
    }
    return { errors: { general: [error.message] } }
  }

  // Session exists = email confirmations disabled (dev only)
  // Profile + org rows are created here since callback won't be hit via email link
  if (data.session && data.user) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminClient = createAdminClient()

    const userId = data.user.id

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({ id: userId, role: 'org', display_name: org_name })

    if (profileError && profileError.code !== '23505') {
      return { errors: { general: [profileError.message] } }
    }

    const { error: orgError } = await adminClient
      .from('organizations')
      .insert({
        profile_id: userId,
        org_name,
        contact_email,
        kra_pin,
        description: description ?? null,
      })

    if (orgError && orgError.code !== '23505') {
      return { errors: { general: [orgError.message] } }
    }

    redirect('/register/organization/pending')
  }

  // Normal flow — email confirmation required
  redirect('/register/organization/verify-email')
}