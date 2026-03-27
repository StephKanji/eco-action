"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const depositSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1 KES"),
  phone: z.string().min(10, "Phone number is too short").max(13, "Phone number is too long"),
});

type DepositFormValues = z.infer<typeof depositSchema>;

export function DepositForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema as any),
    defaultValues: {
      amount: 100,
      phone: ""
    }
  });

  const onSubmit = async (data: DepositFormValues) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/daraja/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: data.amount, phone: data.phone }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: "success", text: "STK Push sent! Please check your phone to complete the payment." });
        reset();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to initiate payment." });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Deposit Points</CardTitle>
        <CardDescription>Enter your M-Pesa number to purchase points via Daraja STK Push.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">M-Pesa Phone Number</Label>
            <Input
              id="phone"
              placeholder="e.g. 0712345678 or 254712345678"
              {...register("phone")}
              disabled={isLoading}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100"
              {...register("amount")}
              disabled={isLoading}
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Pay with M-Pesa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
