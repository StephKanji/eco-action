// lib/africastalking/client.ts
import AfricasTalking from 'africastalking'

const credentials = {
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!, // 'sandbox' for testing
}

const africasTalking = AfricasTalking(credentials)
const airtimeService = africasTalking.AIRTIME

export async function sendAirtime(phoneNumber: string, amountKes: number) {
  const response = await airtimeService.send({
    recipients: [
      {
        phoneNumber,
        currencyCode: 'KES',
        amount: amountKes.toString(),
      },
    ],
  })
  return response
}