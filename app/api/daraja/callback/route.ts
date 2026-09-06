import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const data = await req.json()

    const result = data?.Body?.stkCallback
    if (!result) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = result

    if (ResultCode !== 0) {
      // Payment failed or was cancelled — log and acknowledge
      console.log(`Daraja payment failed/cancelled: ${ResultDesc} (CheckoutRequestID: ${CheckoutRequestID})`)
      return NextResponse.json({ received: true })
    }

    // Extract metadata from the callback
    const meta: { Name: string; Value: string | number }[] = CallbackMetadata?.Item ?? []
    const amount  = meta.find((i) => i.Name === 'Amount')?.Value
    const receipt = meta.find((i) => i.Name === 'MpesaReceiptNumber')?.Value as string | undefined
    const phone   = meta.find((i) => i.Name === 'PhoneNumber')?.Value

    if (!receipt) {
      console.error('Daraja callback missing MpesaReceiptNumber', data)
      return NextResponse.json({ error: 'Missing receipt number' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Look up the pending order created during STK push, keyed by CheckoutRequestID
    const { data: pendingOrder, error: lookupError } = await adminClient
      .from('pending_daraja_orders')
      .select('org_id, package_id, points, amount_kes')
      .eq('checkout_request_id', CheckoutRequestID)
      .single()

    if (lookupError || !pendingOrder) {
      console.error('No matching pending_daraja_orders for CheckoutRequestID:', CheckoutRequestID, lookupError)
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 })
    }

    // Insert point_transaction — provider_transaction_id (receipt) guards idempotency
    const { error: txError } = await adminClient.from('point_transactions').insert({
      from_entity_id: null,
      from_entity_type: 'system',
      to_entity_id: pendingOrder.org_id,
      to_entity_type: 'org',
      amount: pendingOrder.points,
      type: 'purchase',
      provider_transaction_id: receipt,
      notes: `M-Pesa purchase — receipt ${receipt}, KES ${amount}, phone ${phone}`,
    })

    if (txError) {
      if (txError.code === '23505') {
        // Already processed — M-Pesa can fire callbacks more than once, this is expected
        console.log('Duplicate Daraja callback ignored, receipt:', receipt)
        return NextResponse.json({ received: true })
      }
      console.error('Failed to insert point_transaction for Daraja:', txError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Mark the pending order as completed
    await adminClient
      .from('pending_daraja_orders')
      .update({ status: 'completed', mpesa_receipt: receipt })
      .eq('checkout_request_id', CheckoutRequestID)

    console.log(`Daraja payment credited: ${pendingOrder.points} pts to org ${pendingOrder.org_id}, receipt ${receipt}`)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Daraja Callback Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
