import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// ⚠️  DEV ONLY — simulates the Safaricom STK callback locally so you don't
// need a public URL. This endpoint is blocked in production.
export async function POST(req: Request) {
  if (process.env.DARAJA_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { checkoutRequestId } = await req.json()

  if (!checkoutRequestId) {
    return NextResponse.json({ error: 'checkoutRequestId is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Make sure the pending order exists
  const { data: order } = await adminClient
    .from('pending_daraja_orders')
    .select('org_id, points, amount_kes, status')
    .eq('checkout_request_id', checkoutRequestId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Pending order not found' }, { status: 404 })
  }

  if (order.status === 'completed') {
    return NextResponse.json({ alreadyCompleted: true })
  }

  // Generate a fake M-Pesa receipt that looks realistic
  const fakeReceipt = 'SIM' + randomUUID().replace(/-/g, '').slice(0, 9).toUpperCase()

  // Build the same payload Safaricom would send, then POST it to our own callback
  const callbackPayload = {
    Body: {
      stkCallback: {
        MerchantRequestID: 'dev-sim-' + randomUUID(),
        CheckoutRequestID: checkoutRequestId,
        ResultCode: 0,
        ResultDesc: 'The service request is processed successfully.',
        CallbackMetadata: {
          Item: [
            { Name: 'Amount',              Value: order.amount_kes },
            { Name: 'MpesaReceiptNumber',  Value: fakeReceipt },
            { Name: 'TransactionDate',     Value: new Date().toISOString().replace(/\D/g, '').slice(0, 14) },
            { Name: 'PhoneNumber',         Value: '254700000000' },
          ],
        },
      },
    },
  }

  // Call our own callback route internally
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/daraja/callback`
  const res = await fetch(callbackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(callbackPayload),
  })

  const result = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: 'Callback failed', detail: result }, { status: 500 })
  }

  return NextResponse.json({ simulated: true, fakeReceipt })
}
