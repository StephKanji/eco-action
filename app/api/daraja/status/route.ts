import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const checkoutRequestId = searchParams.get('checkoutRequestId')

  if (!checkoutRequestId) {
    return NextResponse.json({ error: 'checkoutRequestId is required' }, { status: 400 })
  }

  // Ensure the request comes from an authenticated org user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const { data: order } = await adminClient
    .from('pending_daraja_orders')
    .select('status, points, amount_kes, mpesa_receipt')
    .eq('checkout_request_id', checkoutRequestId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  return NextResponse.json({
    status: order.status,           // 'pending' | 'completed' | 'failed'
    points: order.points,
    amount_kes: order.amount_kes,
    mpesa_receipt: order.mpesa_receipt,
  })
}
