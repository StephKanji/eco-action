import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role, not anon
)

const ACCOUNTS = [
  { email: 'org31@test.com', password: 'Test1234!', role: 'org', name: 'Test Org 31' },
  { email: 'org32@test.com', password: 'Test1234!', role: 'org', name: 'Test Org 32' },
  { email: 'org33@test.com', password: 'Test1234!', role: 'org', name: 'Test Org 33' },
  { email: 'org34@test.com', password: 'Test1234!', role: 'org', name: 'Test Org 34' },
  { email: 'org35@test.com', password: 'Test1234!', role: 'org', name: 'Test Org 35' },
  { email: 'org36@test.com', password: 'Test1234!', role: 'org', name: 'Test Org 36' }

]

async function seed() {
  for (const acc of ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true, // skip email verification for test accounts
    })

    if (error) {
      console.error(`Failed: ${acc.email}`, error.message)
      continue
    }

    const userId = data.user.id

    await supabase.from('profiles').insert({ id: userId, role: acc.role, display_name: acc.name })

    if (acc.role === 'user') {
      await supabase.from('users').insert({ id: userId })
    } else if (acc.role === 'org') {
      await supabase.from('organizations').insert({
        profile_id: userId,
        org_name: acc.name,
        contact_email: acc.email,
        verification_status: 'verified', // skip admin approval for test convenience
      })
    }

    console.log(`Created: ${acc.email} (${acc.role})`)
  }
}

seed()