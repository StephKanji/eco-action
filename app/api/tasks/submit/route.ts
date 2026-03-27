import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'


export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { task_id, proof_url, proof_metadata } = await req.json()

    if (!task_id || !proof_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Verify task exists and is active — include max_participants for capacity check
    const { data: task } = await adminClient
      .from('tasks')
      .select('id, status, min_tier_id, deadline, org_id, max_participants')
      .eq('id', task_id)
      .maybeSingle()

    if (!task || task.status !== 'active') {
      return NextResponse.json({ error: 'Task not found or no longer active' }, { status: 404 })
    }

    // Check deadline hasn't passed
    if (new Date(task.deadline) < new Date()) {
      return NextResponse.json({ error: 'Task deadline has passed' }, { status: 400 })
    }

    // Fetch user row — use maybeSingle() so missing rows return null instead of throwing
    const { data: userRow } = await adminClient
      .from('users')
      .select('tier_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!userRow) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle() as any

      if (profile?.role !== 'user') {
        return NextResponse.json({ error: 'Only registered users can submit tasks' }, { status: 403 })
      }

      // Lazily fix missing user row — but treat this as a hard failure if it doesn't resolve
      const { error: fixError } = await adminClient
        .from('users')
        .insert({ id: user.id } as any)

      if (fixError) {
        return NextResponse.json({ error: 'Failed to find user record' }, { status: 500 })
      }
    }

    // Check tier requirement — use explicit fallback of 1 when userRow is null (freshly inserted)
    if (task.min_tier_id) {
      const activeTierId = userRow?.tier_id ?? 1
      if (activeTierId < task.min_tier_id) {
        return NextResponse.json({
          error: 'You do not meet the tier requirement for this task'
        }, { status: 403 })
      }
    }

    // Check for duplicate submission — maybeSingle() so zero rows returns null cleanly
    const { data: existing } = await adminClient
      .from('task_submissions')
      .select('id')
      .eq('task_id', task_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        error: 'You have already submitted proof for this task'
      }, { status: 409 })
    }

    // Check task capacity if a participant cap is set
    if (task.max_participants) {
      const { count } = await adminClient
        .from('task_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('task_id', task_id)
        .neq('status', 'rejected')

      if (count !== null && count >= task.max_participants) {
        return NextResponse.json({ error: 'Task is full' }, { status: 409 })
      }
    }

    // Insert submission — DB unique constraint on (user_id, task_id) is the real race guard
    const { error: insertError } = await adminClient
      .from('task_submissions')
      .insert({
        task_id,
        user_id: user.id,
        proof_url,
        proof_metadata,
        status: 'pending',
      })

    if (insertError) {
      // Unique violation — concurrent duplicate submission slipped past the app-level check
      if (insertError.code === '23505') {
        return NextResponse.json({
          error: 'You have already submitted proof for this task'
        }, { status: 409 })
      }

      console.error('Submission insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit proof' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('submit proof error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}