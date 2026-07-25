// app/api/checkout/pesapal/route.ts
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { submitOrderRequest } from '@/lib/pesapal/client'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { packageId } = await request.json()
  if (!packageId) {
    return NextResponse.json({ error: 'packageId is required' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: org } = await adminClient
    .from('organizations')
    .select('id, org_name, contact_email')
    .eq('profile_id', user.id)
    .single()

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Never trust a price from the client — look it up server-side
  const { data: pkg } = await adminClient
    .from('points_packages')
    .select('id, name, points, price_kes')
    .eq('id', packageId)
    .eq('is_active', true)
    .single()

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found or inactive' }, { status: 404 })
  }

  // This becomes our merchant reference — we'll need it to look the org/package back up
  // once the IPN notification arrives, since Pesapal only sends back an OrderTrackingId
  const orderMerchantRef = randomUUID()

  // Stash the pending order so the webhook can resolve it later
  const { error: pendingError } = await adminClient.from('pending_pesapal_orders').insert({
    merchant_reference: orderMerchantRef,
    org_id: org.id,
    package_id: pkg.id,
    points: pkg.points,
    amount_kes: pkg.price_kes,
  })

  if (pendingError) {
    console.error('Failed to record pending order:', pendingError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const result = await submitOrderRequest({
    id: orderMerchantRef,
    currency: 'KES',
    amount: pkg.price_kes,
    description: `${pkg.name} — ${pkg.points.toLocaleString()} points`,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?pesapal_return=true`,
    billing_address: {
      email_address: org.contact_email,
      phone_number: '254700000000', // sandbox dummy number — replace with a real org phone field later
      country_code: 'KE',
      first_name: org.org_name,
        },
  })

  if (result.error) {
    console.error('Pesapal order submission failed:', result.error)
    return NextResponse.json({ error: 'Payment provider error' }, { status: 500 })
  }

  return NextResponse.json({ redirect_url: result.redirect_url })
}