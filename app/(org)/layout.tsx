import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'org') redirect('/login')

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('verification_status')
    .eq('profile_id', user.id)
    .single()

  if (org?.verification_status === 'pending') {
    redirect('/register/organization/pending')
  }

  if (org?.verification_status === 'rejected') {
    redirect('/register/organization/rejected')
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  )
}