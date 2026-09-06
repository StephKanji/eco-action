// app/api/challenges/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const SubmitSchema = z.object({
  challenge_id: z.string().uuid(),
  contribution: z.number().positive(),
  submitted_lat: z.number().optional(),
  submitted_lng: z.number().optional(),
  proof_metadata: z.object({
    lat:          z.number().optional(),
    lng:          z.number().optional(),
    captured_at:  z.string().optional(),
    notes:        z.string().max(500).optional(),
  }).optional(),
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

    // ── Parse multipart form (proof image is optional now — only
    //    required for photo-based challenges, not GPS check-ins) ─
    const formData = await req.formData()
    const file      = formData.get('proof') as File | null
    const jsonStr   = formData.get('data') as string | null

    if (!jsonStr) {
      return NextResponse.json({ error: 'Submission data is required' }, { status: 400 })
    }

    let parsedData: z.infer<typeof SubmitSchema>
    try {
      parsedData = SubmitSchema.parse(JSON.parse(jsonStr))
    } catch {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 })
    }

    const { challenge_id, contribution, proof_metadata, submitted_lat, submitted_lng } = parsedData

    // ── Verify challenge is active, and get its proof_type ───
    const { data: challenge } = await adminClient
      .from('community_challenges')
      .select('id, status, end_date, proof_type')
      .eq('id', challenge_id)
      .single()

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'active') {
      return NextResponse.json({ error: 'Challenge is not active' }, { status: 400 })
    }

    if (new Date(challenge.end_date) < new Date()) {
      return NextResponse.json({ error: 'Challenge has expired' }, { status: 400 })
    }

    // ── Validate proof matches what this challenge requires ──
    if (challenge.proof_type === 'gps_checkin') {
      if (submitted_lat === undefined || submitted_lng === undefined) {
        return NextResponse.json({ error: 'Location check-in is required' }, { status: 400 })
      }
    } else {
      if (!file) {
        return NextResponse.json({ error: 'Proof image is required' }, { status: 400 })
      }
    }

    // ── Verify user has joined this challenge ────────────────
    const { data: participant } = await adminClient
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json(
        { error: 'You must join the challenge before submitting' },
        { status: 403 }
      )
    }

    // ── Prevent duplicate submissions while one is still pending ─
    const { data: existingSubmission } = await adminClient
      .from('challenge_submissions')
      .select('id')
      .eq('challenge_id', challenge_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You already have a submission pending review for this challenge' },
        { status: 409 }
      )
    }

    // ── Upload proof image, only if one was provided ─────────
    let publicUrl: string | null = null

    if (file) {
      const fileExt     = file.name.split('.').pop() ?? 'jpg'
      const fileName    = `${challenge_id}/${user.id}/${Date.now()}.${fileExt}`
      const arrayBuffer = await file.arrayBuffer()

      const { error: uploadError } = await adminClient
        .storage
        .from('challenge-proofs')
        .upload(fileName, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload proof image' }, { status: 500 })
      }

      const { data } = adminClient
        .storage
        .from('challenge-proofs')
        .getPublicUrl(fileName)

      publicUrl = data.publicUrl
    }

    // ── Insert submission row ────────────────────────────────
    const { data: submission, error: insertError } = await adminClient
      .from('challenge_submissions')
      .insert({
        challenge_id,
        user_id:        user.id,
        proof_url:      publicUrl,
        proof_metadata: proof_metadata ?? {},
        submitted_lat:  submitted_lat ?? null,
        submitted_lng:  submitted_lng ?? null,
        contribution,
        status:         'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Submission insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record submission' }, { status: 500 })
    }

    return NextResponse.json({ success: true, submission }, { status: 201 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}