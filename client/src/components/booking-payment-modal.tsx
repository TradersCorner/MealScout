import { useState, useEffect, useRef } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface BookingPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passId: string;
  truckId: string;
  slotTypes: string[];
  eventDetails: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    hostName: string;
    hostPrice?: number;
    slotSummary?: string;
  };
  onSuccess: () => void;
}

interface PaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  truckId: string;
  totalCents: number;
  breakdown: {
    hostPrice: number;
    platformFee: number;
    creditsApplied?: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({
  clientSecret,
  paymentIntentId,
  truckId,
  totalCents,
  breakdown,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const waitForBookingConfirmation = async () => {
    const startedAt = Date.now();
    const timeoutMs = 25_000;

    while (Date.now() - startedAt < timeoutMs) {
      try {
        const res = await fetch(
          `/api/bookings/payment-intent/${encodeURIComponent(
            paymentIntentId,
          )}?truckId=${encodeURIComponent(truckId)}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.status === "confirmed") return "confirmed" as const;
          if (data?.status === "credited") return "credited" as const;
        }
      } catch {
        // ignore transient network issues; keep polling
      }

      await new Promise((r) => setTimeout(r, 1500));
    }

    return "pending" as const;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/parking-pass?booking=success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        });
      } else {
        const status = await waitForBookingConfirmation();
        if (status === "credited") {
          toast({
            title: "Booking Unavailable",
            description:
              "Payment succeeded but the spot was no longer available. Credits were issued to your account.",
            variant: "destructive",
          });
          onSuccess();
          return;
        }

        toast({
          title: "Parking Pass Confirmed!",
          description:
            status === "pending"
              ? "Payment received. Your booking will appear shortly."
              : "Your parking spot has been reserved.",
        });
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pricing Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-700">
          <span>Host Location Fee</span>
          <span className="font-medium">
            ${(breakdown.hostPrice / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-gray-700">
          <span>MealScout Platform Fee</span>
          <span className="font-medium">
            ${(breakdown.platformFee / 100).toFixed(2)}
          </span>
        </div>
        {breakdown.creditsApplied ? (
          <div className="flex items-center justify-between text-green-700">
            <span>Credits Applied</span>
            <span className="font-medium">
              -${(breakdown.creditsApplied / 100).toFixed(2)}
            </span>
          </div>
        ) : null}
        <div className="border-t border-gray-300 pt-2 flex items-center justify-between font-semibold text-gray-900">
          <span>Total</span>
          <span className="text-lg">${(totalCents / 100).toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-600 pt-1">
          All fees included. No hidden charges.
        </p>
      </div>

      {/* Stripe Payment Element */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <PaymentElement />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${(totalCents / 100).toFixed(2)}`
          )}
        </Button>
      </div>

      {/* Terms Notice */}
      <p className="text-xs text-gray-500 text-center">
        By confirming payment, you acknowledge bookings are non-refundable.
      </p>
    </form>
  );
}

export function BookingPaymentModal({
  open,
  onOpenChange,
  passId,
  truckId,
  slotTypes,
  eventDetails,
  onSuccess,
}: BookingPaymentModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<{
    totalCents: number;
    breakdown: { hostPrice: number; platformFee: number; creditsApplied?: number };
  } | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditsToApply, setCreditsToApply] = useState("");
  const cancelOnInitiateRef = useRef(false);

  useEffect(() => {
    if (open) {
      cancelOnInitiateRef.current = false;
      if (!stripePromise) {
        toast({
          title: "Payments Unavailable",
          description: "Stripe is not configured for this environment.",
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }
      loadCreditBalance();
    }
  }, [open]);

  const cancelCheckout = async (intentId: string) => {
    try {
      await fetch(
        `/api/bookings/payment-intent/${encodeURIComponent(intentId)}/cancel?truckId=${encodeURIComponent(
          truckId,
        )}`,
        { method: "POST" },
      );
    } catch {
      // Best effort; pending holds will eventually expire.
    }
  };

  const loadCreditBalance = async () => {
    try {
      const res = await fetch("/api/payout/balance");
      if (!res.ok) return;
      const data = await res.json();
      setCreditBalance(Number(data.balance || 0));
    } catch (error) {
      console.error("Failed to load credit balance:", error);
    }
  };

  const initiateBooking = async () => {
    setIsLoading(true);
    try {
      const creditCents = Math.max(
        0,
        Math.floor(Number(creditsToApply || 0) * 100),
      );
      const res = await fetch(`/api/parking-pass/${passId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckId,
          slotTypes,
          applyCreditsCents: creditCents > 0 ? creditCents : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initiate booking");
      }

      const data = await res.json();
      if (cancelOnInitiateRef.current) {
        const intentId = String(data.paymentIntentId || "").trim();
        if (intentId) {
          await cancelCheckout(intentId);
        }
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId || null);
      setBookingData({
        totalCents: data.totalCents,
        breakdown: data.breakdown,
      });
    } catch (err: any) {
      toast({
        title: "Booking Failed",
        description:
          err.message || "Could not initiate booking. Please try again.",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setClientSecret(null);
    setPaymentIntentId(null);
    setBookingData(null);
    setCreditsToApply("");
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleCancel = () => {
    const intentId = paymentIntentId;
    cancelOnInitiateRef.current = isLoading;
    resetState();
    onOpenChange(false);

    if (intentId) {
      void cancelCheckout(intentId);
    }
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Parking Pass</DialogTitle>
          <DialogDescription>
            <div className="space-y-1 text-sm text-gray-600 pt-2">
              <p className="font-semibold text-gray-900">{eventDetails.name}</p>
              <p>{eventDetails.hostName}</p>
              <p>
                {eventDetails.date} - {eventDetails.startTime} -{" "}
                {eventDetails.endTime}
              </p>
              {eventDetails.slotSummary && (
                <p className="text-xs text-gray-500">
                  Slots: {eventDetails.slotSummary}
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Available Credits
              </p>
              <p className="text-lg font-semibold text-gray-900">
                ${(creditBalance || 0).toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-gray-500 text-right">
              Credits reduce the platform fee.
            </p>
          </div>
          <div className="mt-3">
            <label className="text-xs font-medium text-gray-600">
              Apply Credits
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={creditsToApply}
              onChange={(e) => setCreditsToApply(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can refresh pricing after setting credits.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={initiateBooking}
            disabled={isLoading || Boolean(clientSecret)}
          >
            {clientSecret ? "Pricing locked" : "Continue to payment"}
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <span className="ml-3 text-gray-600">Preparing payment...</span>
          </div>
        )}

        {!isLoading && clientSecret && paymentIntentId && bookingData && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#ea580c",
                },
              },
            }}
          >
            <PaymentForm
              clientSecret={clientSecret}
              paymentIntentId={paymentIntentId}
              truckId={truckId}
              totalCents={bookingData.totalCents}
              breakdown={bookingData.breakdown}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
