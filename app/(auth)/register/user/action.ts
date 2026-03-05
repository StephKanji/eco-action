'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const RegisterUserSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterUserState = {
  errors?: {
    display_name?: string[]
    email?: string[]
    password?: string[]
    general?: string[]
  }
  success?: boolean
}

export async function registerUser(
  _prevState: RegisterUserState,
  formData: FormData
): Promise<RegisterUserState> {
  const validated = RegisterUserSchema.safeParse({
    display_name: formData.get('display_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { display_name, email, password } = validated.data
  const supabase = await createClient()


  // in registerUser  
  console.log('🔗 user emailRedirectTo:', `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`)

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name, role: 'user' },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { errors: { email: ['This email is already registered'] } }
    }
    return { errors: { general: [error.message] } }
  }

  // Supabase returns a session-less user when email confirmation is required.
  // If a session exists, the email was already confirmed (e.g. confirmations disabled).
  if (data.session) {
    redirect('/dashboard')
  }

  redirect('/register/user/verify-email')
}