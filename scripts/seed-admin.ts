import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createAdminClient } from '@/lib/supabase/admin'

async function seedAdmin() {
  const adminClient = createAdminClient()

  const email    = process.env.ADMIN_EMAIL!
  const password = process.env.ADMIN_PASSWORD!

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local')
  }

  let userId: string

  // 1. Try to create auth user
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError) {
    if (!authError.message.includes('already registered')) {
      throw new Error(`Auth error: ${authError.message}`)
    }

    // Auth user exists — look up their ID
    console.log('⚠️  Auth user already exists, looking up ID...')
    const { data: list, error: listError } =
      await adminClient.auth.admin.listUsers()

    if (listError) throw new Error(`List error: ${listError.message}`)

    const existing = list.users.find((u) => u.email === email)
    if (!existing) throw new Error('Could not find existing admin user')

    userId = existing.id
  } else {
    userId = authData.user.id
  }

  // 2. Upsert profile — handles both fresh and retry cases
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert(
      { id: userId, role: 'admin', display_name: 'Admin' },
      { onConflict: 'id' }
    )

  if (profileError) {
    throw new Error(`Profile error: ${profileError.message}`)
  }

  console.log(`✅ Admin ready: ${email} (id: ${userId})`)
}

seedAdmin().catch((err) => {
  console.error(err)
  process.exit(1)
})