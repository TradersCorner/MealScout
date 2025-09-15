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
import { BackHeader } from "@/components/back-header";
import { CreditCard } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

// Helper function for pricing display
const getPricingDisplay = (hasMultipleDeals: boolean, billingInterval: string) => {
  if (billingInterval === 'quarter') {
    return '$100/3 months';
  } else if (billingInterval === 'year') {
    return '$450/year';
  } else {
    // Monthly pricing
    return hasMultipleDeals ? '$75/month' : '$50/month';
  }
};

const getPricingAmount = (hasMultipleDeals: boolean, billingInterval: string) => {
  if (billingInterval === 'quarter') {
    return '$100';
  } else if (billingInterval === 'year') {
    return '$450';
  } else {
    return hasMultipleDeals ? '$75' : '$50';
  }
};

const SubscribeForm = ({ hasMultipleDealsAddon, billingInterval }: { hasMultipleDealsAddon: boolean, billingInterval: string }) => {
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
          description: "Welcome to MealScout! You can now create deals.",
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
{isProcessing ? "Processing..." : `Subscribe Now - ${getPricingDisplay(hasMultipleDealsAddon, billingInterval)}`}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [hasMultipleDealsAddon, setHasMultipleDealsAddon] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'quarter' | 'year'>('month');
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  // Check if user is new (never had a subscription)
  const isNewUser = !user?.stripeSubscriptionId;

  const createSubscription = async (multipleDeals: boolean, interval: string = billingInterval) => {
    setIsCreatingSubscription(true);
    setClientSecret("");
    setSubscriptionError("");
    
    try {
      const res = await apiRequest("POST", "/api/create-subscription", { 
        hasMultipleDealsAddon: multipleDeals,
        billingInterval: interval
      });
      const data = await res.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.error) {
        setSubscriptionError(data.error.message);
      } else {
        setSubscriptionError("Unable to initialize payment. Please try again.");
      }
    } catch (error: any) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth/google/restaurant";
        }, 500);
        return;
      }
      
      // Handle subscription errors
      {
        console.error("Error creating subscription:", error);
        setSubscriptionError("Failed to initialize subscription. Please try again.");
      }
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  // Create subscription when auth status changes or billing options change
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    createSubscription(hasMultipleDealsAddon, billingInterval);
  }, [isAuthenticated, isLoading, hasMultipleDealsAddon, billingInterval]);

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
            <Button onClick={() => window.location.href = "/api/auth/google/restaurant"} className="w-full">
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
        <BackHeader
          title="Subscription"
          fallbackHref="/restaurant-owner-dashboard"
          icon={CreditCard}
        />

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
        <BackHeader
          title="Subscription"
          fallbackHref="/restaurant-owner-dashboard"
          icon={CreditCard}
        />
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
        <BackHeader
          title="Subscription"
          fallbackHref="/restaurant-owner-dashboard"
          icon={CreditCard}
        />

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
      <BackHeader
        title="Complete Subscription"
        fallbackHref="/restaurant-owner-dashboard"
        icon={CreditCard}
      />

      <div className="px-4 py-6">
        {/* Billing Interval Selection */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Choose Your Billing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Monthly */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center ${
                  billingInterval === 'month' 
                    ? 'border-purple-500 bg-purple-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
                onClick={() => setBillingInterval('month')}
                data-testid="card-billing-monthly"
              >
                <div className="font-semibold text-gray-900 mb-1">Monthly</div>
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  ${hasMultipleDealsAddon ? '75' : '50'}
                </div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
              
              {/* Quarterly */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center ${
                  billingInterval === 'quarter' 
                    ? 'border-purple-500 bg-purple-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
                onClick={() => setBillingInterval('quarter')}
                data-testid="card-billing-quarterly"
              >
                <div className="font-semibold text-gray-900 mb-1">Quarterly</div>
                <div className="text-2xl font-bold text-purple-600 mb-2">$100</div>
                <div className="text-sm text-gray-600">for 3 months</div>
                <div className="text-xs text-green-600 font-semibold">~$33.33/month</div>
              </div>
              
              {/* Yearly */}
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center ${
                  billingInterval === 'year' 
                    ? 'border-purple-500 bg-purple-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
                onClick={() => setBillingInterval('year')}
                data-testid="card-billing-yearly"
              >
                <div className="font-semibold text-gray-900 mb-1">Yearly</div>
                <div className="text-2xl font-bold text-purple-600 mb-2">$450</div>
                <div className="text-sm text-gray-600">for 12 months</div>
                <div className="text-xs text-green-600 font-semibold">$37.50/month</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Base Subscription */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6 text-center">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {getPricingAmount(false, billingInterval)}
            </div>
            <div className="text-gray-600 text-lg mb-4">
              {billingInterval === 'quarter' ? '/3 months' : billingInterval === 'year' ? '/year' : '/month'}
            </div>
            <div className="font-semibold text-gray-900 mb-4">Base subscription includes 1 active deal</div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Edit and update your deal anytime to promote different offers - breakfast specials, 
              lunch combos, dinner deals, or seasonal items.
            </p>
          </CardContent>
        </Card>

        {/* Multiple Deals Addon */}
        <Card className="mb-6 bg-white border-orange-200">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Multiple Deals?</h3>
              {billingInterval === 'month' ? (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-4xl font-bold text-orange-600">+$25</span>
                  <span className="text-gray-600 text-lg">for 2 additional deals</span>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {billingInterval === 'quarter' ? 'Same $100' : 'Same $450'}
                  </div>
                  <span className="text-gray-600 text-lg">
                    {billingInterval === 'quarter' ? 'quarterly price' : 'yearly price'} includes 3 deals
                  </span>
                </div>
              )}
              <p className="text-gray-600 leading-relaxed">
                Mix it up and promote up to 3 deals at the same time.
              </p>
            </div>

            {/* Plan Selection */}
            <div className="space-y-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  !hasMultipleDealsAddon 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
                onClick={() => setHasMultipleDealsAddon(false)}
                data-testid="card-single-deal"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Single Deal - {getPricingDisplay(false, billingInterval)}
                    </div>
                    <div className="text-sm text-gray-600">1 active deal included</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    !hasMultipleDealsAddon ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {!hasMultipleDealsAddon && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                  </div>
                </div>
              </div>

              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  hasMultipleDealsAddon 
                    ? 'border-orange-500 bg-orange-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
                onClick={() => setHasMultipleDealsAddon(true)}
                data-testid="card-multiple-deals"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Multiple Deals - {getPricingDisplay(true, billingInterval)}
                    </div>
                    <div className="text-sm text-gray-600">3 active deals total (1 base + 2 additional)</div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    hasMultipleDealsAddon ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                  }`}>
                    {hasMultipleDealsAddon && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Included */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Base Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Base Plan Features
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-green-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-deal">1 active deal included</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-green-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-edit">Edit deal anytime</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-green-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-analytics">Performance analytics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-green-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-targeting">Customer targeting</span>
                  </div>
                </div>
              </div>

              {/* Multiple Deals Features */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Multiple Deals Add-on
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-orange-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-featured">Featured deal options</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-orange-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-multiple">Up to 3 active deals</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-orange-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-support">Priority support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check text-orange-500 w-4"></i>
                    <span className="text-sm text-gray-700" data-testid="text-feature-cancel">Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Examples */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Pricing Examples:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-blue-600 font-bold text-lg mb-2">Single Deal</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {getPricingDisplay(false, billingInterval)}
                </div>
                <div className="text-sm text-gray-600">1 breakfast special</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-orange-600 font-bold text-lg mb-2">Multiple Deals</div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {getPricingDisplay(true, billingInterval)}
                </div>
                <div className="text-sm text-gray-600">Breakfast, lunch & dinner</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-4" data-testid="text-payment-title">Payment Information</h3>
          
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscribeForm hasMultipleDealsAddon={hasMultipleDealsAddon} billingInterval={billingInterval} />
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
            <Link href="/terms-of-service">
              <span className="text-primary underline hover:text-primary/80 cursor-pointer">Terms of Service</span>
            </Link> and{" "}
            <Link href="/privacy-policy">
              <span className="text-primary underline hover:text-primary/80 cursor-pointer">Privacy Policy</span>
            </Link>. 
            You can cancel your subscription at any time.
          </p>
        </div>
      </div>
    </div>
  );
};
