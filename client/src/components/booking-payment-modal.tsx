import { useState, useEffect } from "react";
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

// Load Stripe publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

interface BookingPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  truckId: string;
  eventDetails: {
    name: string;
    date: string;
    startTime: string;
    endTime: string;
    hostName: string;
    hostPrice?: number;
  };
  onSuccess: () => void;
}

interface PaymentFormProps {
  clientSecret: string;
  totalCents: number;
  breakdown: {
    hostPrice: number;
    platformFee: number;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({
  clientSecret,
  totalCents,
  breakdown,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

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
          return_url: `${window.location.origin}/truck-discovery?booking=success`,
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
        toast({
          title: "Booking Confirmed!",
          description: "Your parking spot has been reserved.",
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
        By confirming payment, you agree to the booking terms and cancellation
        policy.
      </p>
    </form>
  );
}

export function BookingPaymentModal({
  open,
  onOpenChange,
  eventId,
  truckId,
  eventDetails,
  onSuccess,
}: BookingPaymentModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<{
    bookingId: string;
    totalCents: number;
    breakdown: { hostPrice: number; platformFee: number };
  } | null>(null);

  useEffect(() => {
    if (open && !clientSecret) {
      initiateBooking();
    }
  }, [open]);

  const initiateBooking = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truckId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initiate booking");
      }

      const data = await res.json();
      setClientSecret(data.clientSecret);
      setBookingData({
        bookingId: data.bookingId,
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

  const handleClose = () => {
    setClientSecret(null);
    setBookingData(null);
    onOpenChange(false);
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Your Booking</DialogTitle>
          <DialogDescription>
            <div className="space-y-1 text-sm text-gray-600 pt-2">
              <p className="font-semibold text-gray-900">{eventDetails.name}</p>
              <p>{eventDetails.hostName}</p>
              <p>
                {eventDetails.date} • {eventDetails.startTime} -{" "}
                {eventDetails.endTime}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <span className="ml-3 text-gray-600">Preparing payment...</span>
          </div>
        )}

        {!isLoading && clientSecret && bookingData && (
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
              totalCents={bookingData.totalCents}
              breakdown={bookingData.breakdown}
              onSuccess={handleSuccess}
              onCancel={handleClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
