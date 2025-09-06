import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
          return_url: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to LocalEats! You can now create deals.",
        });
        setLocation("/deal-creation");
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-border rounded-lg p-4">
        <PaymentElement 
          options={{
            layout: "tabs"
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full py-3 font-semibold text-sm"
        disabled={!stripe || !elements || isProcessing}
        data-testid="button-subscribe"
      >
        {isProcessing ? "Processing..." : "Subscribe Now - $49/month"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/get-or-create-subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setSubscriptionError("Unable to initialize payment. Please try again.");
        }
      })
      .catch((error) => {
        if (isUnauthorizedError(error)) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/api/login";
          }, 500);
          return;
        }
        console.error("Error creating subscription:", error);
        setSubscriptionError("Failed to initialize subscription. Please try again.");
      });
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground mb-4">Please log in to subscribe</p>
            <Button onClick={() => window.location.href = "/api/login"} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-muted mr-3" data-testid="button-back">
                <i className="fas fa-arrow-left text-foreground"></i>
              </button>
            </Link>
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">Subscription</h1>
          </div>
        </header>

        <div className="px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <Card>
            <CardContent className="p-6 text-center">
              <i className="fas fa-exclamation-triangle text-destructive text-3xl mb-4"></i>
              <h2 className="text-lg font-semibold text-foreground mb-2">Setup Error</h2>
              <p className="text-muted-foreground mb-4" data-testid="text-error-message">{subscriptionError}</p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show message if Stripe is not configured
  if (!stripePromise) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-muted mr-3" data-testid="button-back">
                <i className="fas fa-arrow-left text-foreground"></i>
              </button>
            </Link>
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">Subscription</h1>
          </div>
        </header>
        <div className="px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <Card>
            <CardContent className="p-6 text-center">
              <i className="fas fa-cog text-muted-foreground text-3xl mb-4"></i>
              <h2 className="text-lg font-semibold text-foreground mb-2">Payment Setup Required</h2>
              <p className="text-muted-foreground mb-4">Stripe payment processing is not yet configured.</p>
              <Link href="/deal-creation">
                <Button className="w-full mb-2">Create Deals (Demo Mode)</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-muted mr-3" data-testid="button-back">
                <i className="fas fa-arrow-left text-foreground"></i>
              </button>
            </Link>
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">Subscription</h1>
          </div>
        </header>

        <div className="px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
            <p className="text-muted-foreground" data-testid="text-loading">Setting up your subscription...</p>
          </div>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted mr-3" data-testid="button-back">
              <i className="fas fa-arrow-left text-foreground"></i>
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">Complete Subscription</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Plan Summary */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-crown text-white text-xl"></i>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2" data-testid="text-plan-title">LocalEats Restaurant Plan</h2>
              <p className="text-muted-foreground text-sm" data-testid="text-plan-subtitle">Everything you need to promote your deals</p>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center space-x-3">
                <i className="fas fa-check text-accent w-4"></i>
                <span className="text-sm text-foreground" data-testid="text-feature-unlimited">Unlimited deal postings</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-check text-accent w-4"></i>
                <span className="text-sm text-foreground" data-testid="text-feature-analytics">Performance analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-check text-accent w-4"></i>
                <span className="text-sm text-foreground" data-testid="text-feature-featured">Featured deal options</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-check text-accent w-4"></i>
                <span className="text-sm text-foreground" data-testid="text-feature-support">Priority customer support</span>
              </div>
            </div>

            <div className="text-center border-t border-border pt-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-bold text-primary" data-testid="text-price">$49</span>
                <span className="text-muted-foreground" data-testid="text-price-period">/month</span>
              </div>
              <p className="text-xs text-accent font-medium mt-1" data-testid="text-trial-info">30-day free trial • Cancel anytime</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-4" data-testid="text-payment-title">Payment Information</h3>
          
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm />
          </Elements>
        </div>

        {/* Security Notice */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <i className="fas fa-shield-alt text-accent"></i>
            <span className="text-sm font-medium text-foreground" data-testid="text-security-title">Secure Payment</span>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-security-desc">
            Your payment information is encrypted and secure. Powered by Stripe.
          </p>
        </div>

        {/* Terms */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground" data-testid="text-terms">
            By subscribing, you agree to our{" "}
            <span className="text-primary underline">Terms of Service</span> and{" "}
            <span className="text-primary underline">Privacy Policy</span>. 
            You can cancel your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
};
