// One-off script — run locally with: node register-ipn.mjs
// Fill in your real values below before running, then delete this file (don't commit it).

const CONSUMER_KEY = 'qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW';
const CONSUMER_SECRET = 'osGQ364R49cXKeOYSpaOnT++rHs=';
const IPN_URL = 'https://eco-action-beta.vercel.app/api/webhooks/pesapal'; // your IPN endpoint
const BASE_URL = 'https://cybqa.pesapal.com/pesapalv3';   

async function main() {
  // Step 1: get auth token
  const authRes = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET,
    }),
  });

  const authData = await authRes.json();
  console.log('Auth response:', authData);

  if (!authData.token) {
    console.error('Failed to get token — check your consumer key/secret.');
    return;
  }

  // Step 2: register IPN
  const ipnRes = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${authData.token}`,
    },
    body: JSON.stringify({
      url: IPN_URL,
      ipn_notification_type: 'POST',
    }),
  });

  const ipnData = await ipnRes.json();
  console.log('IPN registration response:', ipnData);
}

main().catch(console.error);
