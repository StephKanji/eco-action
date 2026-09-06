import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  let org = null
  if (profile?.role === 'org') {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('org_name, description, verification_status')
      .eq('profile_id', user.id)
      .single()
    org = orgData
  }

  return (
    <div className="hero-section pt-10">
      <SettingsForm
        userId={user.id}
        email={user.email ?? ''}
        role={profile?.role ?? null}
        displayName={profile?.display_name ?? ''}
        orgName={org?.org_name ?? ''}
        orgDescription={org?.description ?? ''}
      />
    </div>
  )
}