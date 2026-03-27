import { DepositForm } from "@/components/wallet/deposit-form";

export const metadata = {
  title: "Billing & Subscriptions - Eco Action",
  description: "Manage your point balance and billing information.",
};

export default function BillingPage() {
  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Deposits</h1>
        <p className="text-muted-foreground">
          Top up your organization's escrow and point balance.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <DepositForm />
        </div>
        
        <div className="space-y-4">
          {/* We can render the wallet card or transaction history here in the future */}
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h3 className="font-semibold leading-none tracking-tight mb-2">Daraja Integration Info</h3>
            <p className="text-sm text-muted-foreground">
              To test the payments, ensure you have correctly added `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_PASSKEY`, and `DARAJA_SHORTCODE` securely in your `.env.local` file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
