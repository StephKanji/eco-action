// app/api/challenges/create/route.ts
// Org creates a community challenge.
// Validates input, escrows reward_pool from org balance, inserts challenge.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateChallengeSchema = z.object({
  title:           z.string().min(5).max(100),
  description:     z.string().min(20).max(2000),
  category:        z.enum(['tree_planting', 'waste_collection', 'recycling', 'clean_energy', 'water_conservation', 'other']),
  target_value:    z.number().positive(),
  target_unit:     z.string().min(1).max(50),  // e.g. 'trees', 'kg_plastic'
  reward_pool:     z.number().int().positive(),
  start_date:      z.string().datetime(),
  end_date:        z.string().datetime(),
  cover_image_url: z.string().url().optional(),
  max_participants: z.number().int().positive().optional(),
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

    // ── Role check — must be a verified org ─────────────────
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, points_balance, escrow_balance, verification_status')
      .eq('profile_id', user.id)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (org.verification_status !== 'verified') {
      return NextResponse.json({ error: 'Organization is not verified' }, { status: 403 })
    }

    // ── Validate body ────────────────────────────────────────
    const body = await req.json()
    const parsed = CreateChallengeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // ── Date validation ──────────────────────────────────────
    const startDate = new Date(data.start_date)
    const endDate   = new Date(data.end_date)

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      )
    }

    // ── Balance check — org must have enough points to escrow
    if (org.points_balance < data.reward_pool) {
      return NextResponse.json(
        { error: 'Insufficient points balance to fund this challenge reward pool' },
        { status: 400 }
      )
    }

   
    const { data: challenge, error: insertError } = await adminClient
      .from('community_challenges')
      .insert({
        org_id:          org.id,
        title:           data.title,
        description:     data.description,
        category:        data.category,
        target_value:    data.target_value,
        target_unit:     data.target_unit,
        reward_pool:     data.reward_pool,
        start_date:      data.start_date,
        end_date:        data.end_date,
        cover_image_url: data.cover_image_url ?? null,
        max_participants: data.max_participants ?? null,
        status: startDate <= new Date() ? 'active' : 'upcoming',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Challenge insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
    }

    // ── Escrow reward_pool from org balance ──────────────────
    // Move points_balance → escrow_balance atomically
    const { error: escrowError } = await adminClient
      .from('organizations')
      .update({
        points_balance:  org.points_balance  - data.reward_pool,
        escrow_balance:  org.escrow_balance  + data.reward_pool,
      })
      .eq('id', org.id)

    if (escrowError) {
      // Rollback: delete the challenge we just created
      await adminClient
        .from('community_challenges')
        .delete()
        .eq('id', challenge.id)

      console.error('Escrow error:', escrowError)
      return NextResponse.json({ error: 'Failed to escrow reward pool' }, { status: 500 })
    }

    // ── Record the escrow transaction ────────────────────────
    await adminClient
      .from('point_transactions')
      .insert({
        from_entity_id:   org.id,
        from_entity_type: 'org',
        to_entity_id:     null,
        to_entity_type:   'system',
        amount:           data.reward_pool ,
        type:             'escrow_lock',
        reference_id:     challenge.id,
      })

    return NextResponse.json({ success: true, challenge }, { status: 201 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}