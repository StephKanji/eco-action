// app/api/challenges/review/route.ts
// Org approves or rejects a challenge submission.
// On approval: calls the Edge Function to update progress + distribute if target met.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const ReviewSchema = z.object({
  submission_id:    z.string().uuid(),
  decision:         z.enum(['approved', 'rejected']),
  rejection_reason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase    = await createClient()
    const adminClient = createAdminClient()

    // ── Auth check ───────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Role check — must be an org ──────────────────────────
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, verification_status')
      .eq('profile_id', user.id)
      .single()

    if (!org || org.verification_status !== 'verified') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ── Validate body ────────────────────────────────────────
    const body   = await req.json()
    const parsed = ReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { submission_id, decision, rejection_reason } = parsed.data

    // ── Fetch submission with challenge info ─────────────────
    const { data: submission } = await adminClient
      .from('challenge_submissions')
      .select(`
        id, status, user_id, contribution, challenge_id,
        community_challenges!inner (
          id, org_id, status, end_date
        )
      `)
      .eq('id', submission_id)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // ── Verify this org owns the challenge ───────────────────
    const challenge = submission.community_challenges as any
    if (challenge.org_id !== org.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ── Check submission is still pending ────────────────────
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: `Submission already ${submission.status}` },
        { status: 409 }
      )
    }

   

    // ── Update submission status ─────────────────────────────
    const { error: updateError } = await adminClient
      .from('challenge_submissions')
      .update({
        status:           decision,
        rejection_reason: decision === 'rejected' ? (rejection_reason ?? null) : null,
        reviewed_by:      user.id,
        reviewed_at:      new Date().toISOString(),
      })
      .eq('id', submission_id)

    if (updateError) {
      console.error('Submission update error:', updateError)
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
    }

    // ── On approval: call Edge Function to update progress ───
    if (decision === 'approved') {
      const edgeFnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-challenge-progress`

      const edgeResponse = await fetch(edgeFnUrl, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          challenge_id:  submission.challenge_id,
          user_id:       submission.user_id,
          submission_id: submission.id,
          contribution:  submission.contribution,
        }),
      })

      if (!edgeResponse.ok) {
        const edgeError = await edgeResponse.json()
        console.error('Edge Function error:', edgeError)
        // Don't fail the whole request — submission is already approved.
        // Progress update failure is logged; cron job will catch it.
        return NextResponse.json({
          success: true,
          warning: 'Submission approved but progress update failed — will retry automatically',
        })
      }

      const edgeResult = await edgeResponse.json()

      return NextResponse.json({
        success:    true,
        decision,
        target_met: edgeResult.target_met,
        challenge:  edgeResult.challenge,
      })
    }

    // ── Rejection path ───────────────────────────────────────
    return NextResponse.json({ success: true, decision })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}