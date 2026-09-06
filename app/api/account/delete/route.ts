import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Delete child rows first — unclear whether FKs cascade, so this is
  // explicit rather than relying on that. Order matters: organizations
  // and users both reference profiles, so they go before profiles itself.
  const { error: orgDeleteError } = await adminClient
    .from('organizations')
    .delete()
    .eq('profile_id', user.id)

  if (orgDeleteError) {
    console.error('❌ organizations delete failed:', orgDeleteError.message)
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
  }

  const { error: userRowDeleteError } = await adminClient
    .from('users')
    .delete()
    .eq('id', user.id)

  if (userRowDeleteError) {
    console.error('❌ users row delete failed:', userRowDeleteError.message)
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
  }

  const { error: profileDeleteError } = await adminClient
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileDeleteError) {
    console.error('❌ profile delete failed:', profileDeleteError.message)
    return NextResponse.json({ error: 'Failed to delete account data' }, { status: 500 })
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id)

  if (authDeleteError) {
    console.error('❌ auth user delete failed:', authDeleteError.message)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}