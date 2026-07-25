// app/api/webhooks/pesapal/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { getTransactionStatus } from '@/lib/pesapal/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)

  // Pesapal sends these as query params regardless of GET/POST notification type
  const orderTrackingId = searchParams.get('OrderTrackingId')
  const orderMerchantReference = searchParams.get('OrderMerchantReference')

  if (!orderTrackingId || !orderMerchantReference) {
    return NextResponse.json({ error: 'Missing tracking parameters' }, { status: 400 })
  }

  // Don't trust the notification alone — go ask Pesapal directly what actually happened
  const status = await getTransactionStatus(orderTrackingId)

  if (status.payment_status_description !== 'Completed') {
    // Not a successful payment — acknowledge receipt, but don't credit anything
    return NextResponse.json({ received: true, status: status.payment_status_description })
  }

  const adminClient = createAdminClient()

  const { data: pendingOrder } = await adminClient
    .from('pending_pesapal_orders')
    .select('org_id, points')
    .eq('merchant_reference', orderMerchantReference)
    .single()

  if (!pendingOrder) {
    console.error('No matching pending order for reference:', orderMerchantReference)
    return NextResponse.json({ error: 'Unknown order reference' }, { status: 404 })
  }

  const { error } = await adminClient.from('point_transactions').insert({
    from_entity_id: null,
    from_entity_type: 'system',
    to_entity_id: pendingOrder.org_id,
    to_entity_type: 'org',
    amount: pendingOrder.points,
    type: 'purchase',
    provider_transaction_id: orderTrackingId, // idempotency guard
    notes: `Pesapal purchase — tracking ${orderTrackingId}`,
  })

  if (error) {
    if (error.code === '23505') {
      // Already processed this exact transaction — IPN can fire more than once, this is expected
      return NextResponse.json({ received: true })
    }
    console.error('Failed to insert point_transaction:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// Pesapal may call with GET depending on config — handle both the same way
export async function GET(request: Request) {
  return POST(request)
}