import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDarajaToken, generateDarajaPassword, formatPhoneNumber } from '@/lib/daraja'

export async function POST(req: Request) {
  try {
    // Authenticate the org user making the request
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId, phone } = await req.json()

    if (!packageId || !phone) {
      return NextResponse.json({ error: 'packageId and phone are required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Resolve org from the authenticated user
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, org_name')
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

    const formattedPhone = formatPhoneNumber(phone)
    const token = await getDarajaToken()
    const { password, timestamp } = generateDarajaPassword()

    const shortcode = process.env.DARAJA_SHORTCODE!
    const callbackUrl = process.env.DARAJA_CALLBACK_URL!

    const stkUrl =
      process.env.DARAJA_ENV === 'production'
        ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(pkg.price_kes),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: 'EcoAction',
      TransactionDesc: `${pkg.name} — ${pkg.points.toLocaleString()} points`,
    }

    const response = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.ResponseCode !== '0') {
      return NextResponse.json(
        { success: false, error: data.errorMessage || 'STK Push failed' },
        { status: 400 }
      )
    }

    // Stash the pending order so the callback can credit the org later
    const { error: pendingError } = await adminClient.from('pending_daraja_orders').insert({
      checkout_request_id: data.CheckoutRequestID,
      org_id: org.id,
      package_id: pkg.id,
      points: pkg.points,
      amount_kes: pkg.price_kes,
      phone: formattedPhone,
      status: 'pending',
    })

    if (pendingError) {
      // STK push already sent — log but don't fail the request
      console.error('Failed to record pending_daraja_orders:', pendingError)
    }

    return NextResponse.json({ success: true, checkoutRequestId: data.CheckoutRequestID })
  } catch (error: any) {
    console.error('Daraja STK Push Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
