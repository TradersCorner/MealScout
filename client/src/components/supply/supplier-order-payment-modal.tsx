import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const formatMoney = (cents: number) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

function PaymentForm(props: {
  orderId: string;
  clientSecret: string;
  totalCents: number;
  onPaid: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const waitForPaid = async () => {
    const startedAt = Date.now();
    const timeoutMs = 35_000;

    while (Date.now() - startedAt < timeoutMs) {
      try {
        const res = await fetch(`/api/supplier-orders/${encodeURIComponent(props.orderId)}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => null);
        if (res.ok && String(data?.paymentStatus || "") === "paid") return true;
      } catch {
        // ignore
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    return false;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/suppliers`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        });
        return;
      }

      const ok = await waitForPaid();
      toast({
        title: ok ? "Payment received" : "Payment processing",
        description: ok
          ? "Your order is marked as paid."
          : "Payment received. This may take a moment to reflect on your order.",
      });
      props.onPaid();
    } catch (err: any) {
      toast({
        title: "Payment error",
        description: err?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-lg border p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total due</span>
          <span className="font-semibold">{formatMoney(props.totalCents)}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Bank transfer (ACH) is typically the lowest-cost option for large payments.
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <PaymentElement />
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={props.onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!stripe || isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatMoney(props.totalCents)}`
          )}
        </Button>
      </div>
    </form>
  );
}

export function SupplierOrderPaymentModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onPaid?: () => void;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalCents, setTotalCents] = useState<number>(0);

  useEffect(() => {
    if (!props.open) {
      setClientSecret(null);
      setTotalCents(0);
      return;
    }

    if (!stripePromise) {
      toast({
        title: "Payments unavailable",
        description: "Stripe is not configured for this environment.",
        variant: "destructive",
      });
      props.onOpenChange(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/supplier-orders/${encodeURIComponent(props.orderId)}/pay-intent`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message || "Failed to start payment");
        setClientSecret(String(data?.clientSecret || ""));
        setTotalCents(Number(data?.totalCents || 0) || 0);
      } catch (err: any) {
        toast({
          title: "Unable to start payment",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
        props.onOpenChange(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [props.open, props.orderId, props, toast]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay supplier</DialogTitle>
          <DialogDescription>
            Pay through MealScout. ACH is recommended for large orders.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !clientSecret ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading payment…
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              orderId={props.orderId}
              clientSecret={clientSecret}
              totalCents={totalCents}
              onPaid={() => {
                props.onPaid?.();
                props.onOpenChange(false);
              }}
              onCancel={() => props.onOpenChange(false)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}

