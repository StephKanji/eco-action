// lib/pesapal/client.ts
const BASE_URL = process.env.PESAPAL_ENV === 'live'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3'

let cachedToken: { token: string; expiresAt: number } | null = null

// Tokens last 5 minutes — cache briefly so we don't re-auth on every single call in a short window
async function getPesapalToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const res = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  })

  const data = await res.json()
  if (!data.token) {
    throw new Error(`Pesapal auth failed: ${JSON.stringify(data)}`)
  }

  // Cache for 4 minutes (buffer under the real 5-minute expiry)
  cachedToken = { token: data.token, expiresAt: Date.now() + 4 * 60 * 1000 }
  return data.token
}

export async function submitOrderRequest(order: {
  id: string
  currency: string
  amount: number
  description: string
  callback_url: string
  billing_address: {
    email_address: string
    phone_number?: string
    country_code?: string
    first_name?: string
    last_name?: string
  }
}) {
  const token = await getPesapalToken()

  const res = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...order,
      notification_id: process.env.PESAPAL_IPN_ID,
    }),
  })

  return res.json()
}

export async function getTransactionStatus(orderTrackingId: string) {
  const token = await getPesapalToken()

  const res = await fetch(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return res.json()
}