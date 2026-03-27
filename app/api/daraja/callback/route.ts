import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    console.log("Daraja Callback Received:", JSON.stringify(data, null, 2));

    const result = data?.Body?.stkCallback;

    if (!result) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = result;

    if (ResultCode === 0) {
      // Payment was successful
      const meta = CallbackMetadata?.Item || [];
      const amountObj = meta.find((item: any) => item.Name === "Amount");
      const receiptObj = meta.find((item: any) => item.Name === "MpesaReceiptNumber");
      const phoneObj = meta.find((item: any) => item.Name === "PhoneNumber");

      const amount = amountObj?.Value;
      const receipt = receiptObj?.Value;
      const phone = phoneObj?.Value;

      // TODO: Update your database (Point Transactions, User Balance, etc.)
      console.log(`Payment Successful: Receipt ${receipt}, Amount ${amount}, Phone ${phone}`);
    } else {
      // Payment failed or cancelled
      console.log(`Payment Failed: ${ResultDesc}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Daraja Callback Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
