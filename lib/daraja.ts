export async function getDarajaToken() {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY!;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET!;
  const authUrl = process.env.DARAJA_ENV === "production" 
    ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" 
    : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await fetch(authUrl, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
    // Prevent caching for new tokens
    cache: "no-store", 
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with Daraja");
  }

  const data = await response.json();
  return data.access_token as string;
}

export function generateDarajaPassword() {
  const shortcode = process.env.DARAJA_SHORTCODE!;
  const passkey = process.env.DARAJA_PASSKEY!;
  
  const date = new Date();
  const timestamp =
    date.getFullYear() +
    ("0" + (date.getMonth() + 1)).slice(-2) +
    ("0" + date.getDate()).slice(-2) +
    ("0" + date.getHours()).slice(-2) +
    ("0" + date.getMinutes()).slice(-2) +
    ("0" + date.getSeconds()).slice(-2);

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  return { password, timestamp };
}

export function formatPhoneNumber(phone: string) {
  let formatted = phone.replace(/\D/g, "");
  if (formatted.startsWith("0")) {
    formatted = "254" + formatted.slice(1);
  } else if (formatted.startsWith("7") || formatted.startsWith("1")) {
    formatted = "254" + formatted;
  } else if (formatted.startsWith("+")) {
    formatted = formatted.replace("+", "");
  }
  return formatted;
}
