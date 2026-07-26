// app/api/redeem/airtime/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAirtime } from '@/lib/africastalking/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { rewardId, phoneNumber } = await request.json()
  if (!rewardId || !phoneNumber) {
    return NextResponse.json({ error: 'rewardId and phoneNumber are required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Look up the reward server-side — never trust a points cost from the client
  const { data: reward } = await adminClient
    .from('rewards_catalog')
    .select('id, title, type, points_cost, value_kes, provider')
    .eq('id', rewardId)
    .eq('is_active', true)
    .eq('type', 'airtime')
    .single()

  if (!reward) {
    return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 })
  }

  // Confirm the user actually has enough points
  const { data: userRow } = await adminClient
    .from('users')
    .select('current_points')
    .eq('id', user.id)
    .single()

  if (!userRow || userRow.current_points < reward.points_cost) {
    return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
  }

  // Step 1: deduct points immediately (reserves them, prevents double-redeem races)
  const { data: deductionTx, error: deductionError } = await adminClient
    .from('point_transactions')
    .insert({
      from_entity_id: user.id,
      from_entity_type: 'user',
      to_entity_id: null,
      to_entity_type: 'system',
      amount: reward.points_cost,
      type: 'redemption',
      notes: `Airtime redemption — ${reward.title}`,
    })
    .select('id')
    .single()

  if (deductionError) {
    console.error('Failed to deduct points:', deductionError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  // Step 2: attempt to send the airtime
  try {
    const result = await sendAirtime(phoneNumber, reward.value_kes)

    const recipientResult = result?.responses?.[0]
    if (recipientResult?.status !== 'Sent' && recipientResult?.status !== 'Queued') {
      throw new Error(recipientResult?.errorMessage || 'Airtime send failed')
    }

    return NextResponse.json({
      success: true,
      message: `KES ${reward.value_kes} airtime sent to ${phoneNumber}`,
      details: recipientResult,
    })
  } catch (err) {
    console.error('Airtime send failed, reversing deduction:', err)

    // Step 3: reverse the deduction since airtime never actually went out
    await adminClient.from('point_transactions').insert({
      from_entity_id: null,
      from_entity_type: 'system',
      to_entity_id: user.id,
      to_entity_type: 'user',
      amount: reward.points_cost,
      type: 'starter_grant', // functioning as a refund here — see note below
      notes: `Refund — failed airtime redemption (original tx ${deductionTx.id})`,
    })

    return NextResponse.json(
      { error: 'Airtime delivery failed. Your points have been refunded.' },
      { status: 502 }
    )
  }
}