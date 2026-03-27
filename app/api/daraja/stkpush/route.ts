import { NextResponse } from "next/server";
import { getDarajaToken, generateDarajaPassword, formatPhoneNumber } from "@/lib/daraja";

export async function POST(req: Request) {
  try {
    const { amount, phone } = await req.json();

    if (!amount || !phone) {
      return NextResponse.json({ error: "Amount and phone are required" }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const token = await getDarajaToken();
    const { password, timestamp } = generateDarajaPassword();

    const shortcode = process.env.DARAJA_SHORTCODE!;
    const callbackUrl = process.env.DARAJA_CALLBACK_URL!; // e.g. https://your-domain.ngrok-free.app/api/daraja/callback

    const stkUrl = process.env.DARAJA_ENV === "production"
      ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
      : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", // or CustomerBuyGoodsOnline
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "EcoAction", // Add any specific reference
      TransactionDesc: "Payment for Points",
    };

    const response = await fetch(stkUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ResponseCode === "0") {
      return NextResponse.json({ success: true, data });
    } else {
      return NextResponse.json({ success: false, error: data.errorMessage || "STK Push failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Daraja STK Push Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
