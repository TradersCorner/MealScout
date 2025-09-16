import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackHeader } from "@/components/back-header";
import { CreditCard, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

type SubscriptionStatus = 'selecting' | 'initializing' | 'requires_payment' | 'active' | 'error';

interface SubscriptionState {
  status: SubscriptionStatus;
  subscriptionId?: string;
  clientSecret?: string;
  intentType?: string;
  error?: string;
}

const PaymentForm = ({ clientSecret, intentType = 'payment', onSuccess }: { clientSecret: string, intentType?: string, onSuccess: () => void }) => {
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
      let result;
      
      if (intentType === 'setup') {
        result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/deal-creation',
          },
          redirect: 'if_required'
        });
      } else {
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: window.location.origin + '/deal-creation',
          },
          redirect: 'if_required'
        });
      }

      if (result.error) {
        toast({
          title: intentType === 'setup' ? "Setup Failed" : "Payment Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: intentType === 'setup' ? "Setup Successful!" : "Payment Successful!",
          description: "Welcome to MealScout! You can now create deals.",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: intentType === 'setup' ? "Setup Error" : "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
        data-testid="button-pay-now"
      >
        {isProcessing ? "Processing..." : "Complete Payment"}
      </Button>
    </form>
  );
};

const PlanSelector = ({ 
  hasMultipleDeals, 
  billingInterval, 
  promoCode,
  onHasMultipleDealsChange, 
  onBillingIntervalChange, 
  onPromoCodeChange,
  onContinue 
}: {
  hasMultipleDeals: boolean;
  billingInterval: 'month' | 'quarter' | 'year';
  promoCode: string;
  onHasMultipleDealsChange: (value: boolean) => void;
  onBillingIntervalChange: (value: 'month' | 'quarter' | 'year') => void;
  onPromoCodeChange: (value: string) => void;
  onContinue: () => void;
}) => {
  const getPricingDisplay = (hasMultiple: boolean, interval: string) => {
    if (interval === 'quarter') {
      // Special new user offer - only for 1 deal
      return '$100/3 months';
    } else if (interval === 'year') {
      return hasMultiple ? '$900/year' : '$600/year';
    } else {
      return hasMultiple ? '$75/month' : '$50/month';
    }
  };

  const getPricingAmount = (hasMultiple: boolean, interval: string) => {
    if (interval === 'quarter') {
      // Special new user offer - only for 1 deal
      return '$100';
    } else if (interval === 'year') {
      return hasMultiple ? '$900' : '$600';
    } else {
      return hasMultiple ? '$75' : '$50';
    }
  };

  const getDealsText = (hasMultiple: boolean) => {
    return hasMultiple ? '3 deals' : '1 deal';
  };

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Choose Your Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Single Deal Plan */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center ${
                !hasMultipleDeals 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
              onClick={() => onHasMultipleDealsChange(false)}
              data-testid="card-plan-single"
            >
              <div className="font-semibold text-gray-900 mb-2">Single Deal</div>
              <div className="text-3xl font-bold text-purple-600 mb-2">1</div>
              <div className="text-sm text-gray-600">Active deal at a time</div>
              <div className="text-lg font-semibold text-gray-900 mt-2">
                {getPricingDisplay(false, billingInterval)}
              </div>
            </div>
            
            {/* Multiple Deals Plan */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center ${
                hasMultipleDeals 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
              onClick={() => onHasMultipleDealsChange(true)}
              data-testid="card-plan-multiple"
            >
              <div className="font-semibold text-gray-900 mb-2">Multiple Deals</div>
              <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
              <div className="text-sm text-gray-600">Active deals at a time</div>
              <div className="text-lg font-semibold text-gray-900 mt-2">
                {getPricingDisplay(true, billingInterval)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Interval Selection */}
      <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Billing Frequency</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center ${
                billingInterval === 'month' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
              onClick={() => onBillingIntervalChange('month')}
              data-testid="card-billing-monthly"
            >
              <div className="font-semibold text-gray-900 mb-1">Monthly</div>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ${hasMultipleDeals ? '75' : '50'}
              </div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
            
            {/* Yearly */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center relative ${
                billingInterval === 'year' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
              onClick={() => onBillingIntervalChange('year')}
              data-testid="card-billing-yearly"
            >
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Save 50%
              </div>
              <div className="font-semibold text-gray-900 mb-1">Yearly</div>
              <div className="text-2xl font-bold text-green-600 mb-2">
                ${hasMultipleDeals ? '900' : '600'}
              </div>
              <div className="text-sm text-gray-600">for 12 months</div>
            </div>
            
            {/* Special 3-Month Offer (New Users Only) */}
            <div 
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 text-center relative ${
                billingInterval === 'quarter' 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-green-300'
              } ${hasMultipleDeals ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!hasMultipleDeals) {
                  onBillingIntervalChange('quarter');
                  onHasMultipleDealsChange(false); // Force single deal for this offer
                }
              }}
              data-testid="card-billing-quarterly"
            >
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                New Users
              </div>
              <div className="font-semibold text-gray-900 mb-1">3-Month Deal</div>
              <div className="text-2xl font-bold text-green-600 mb-2">$100</div>
              <div className="text-sm text-gray-600">1 deal for 3 months</div>
              <div className="text-xs text-gray-500 mt-1">Special offer!</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Code */}
      <Card>
        <CardContent className="p-6">
          <Label htmlFor="promoCode" className="text-base font-semibold text-gray-900 mb-2 block">
            Promo Code (Optional)
          </Label>
          <Input
            id="promoCode"
            type="text"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
            className="text-center font-mono"
            data-testid="input-promo-code"
          />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Tip: Use code "BETA" for free access
          </p>
        </CardContent>
      </Card>

      {/* Summary and Continue */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Plan Summary</h3>
            <div className="flex justify-center items-center space-x-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-semibold">{getDealsText(hasMultipleDeals)} at a time</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {getPricingAmount(hasMultipleDeals, billingInterval)}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {getPricingDisplay(hasMultipleDeals, billingInterval)}
            </div>
            {promoCode && (
              <div className="text-sm text-green-600 mb-4">
                Promo code: {promoCode}
              </div>
            )}
            <Button 
              onClick={() => {
                console.log('🚨 BUTTON CLICKED - onContinue about to be called');
                onContinue();
                console.log('🚨 BUTTON CLICKED - onContinue was called');
              }}
              className="w-full py-3 font-semibold text-sm"
              data-testid="button-continue-to-payment"
            >
              Continue to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function Subscribe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Plan selection state
  const [hasMultipleDeals, setHasMultipleDeals] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'quarter' | 'year'>('month');
  const [promoCode, setPromoCode] = useState("");
  
  // Subscription flow state
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    status: 'selecting'
  });

  const initializeSubscription = async () => {
    console.log('🚨 initializeSubscription function called!');
    setSubscriptionState({ status: 'initializing' });
    
    try {
      const res = await apiRequest("POST", "/api/subscriptions/initialize", { 
        hasMultipleDealsAddon: hasMultipleDeals,
        billingInterval: billingInterval,
        promoCode: promoCode.trim()
      });
      const data = await res.json();
      
      if (data.status === 'active') {
        // User already has an active subscription
        toast({
          title: "Already Subscribed",
          description: "You already have an active subscription!",
        });
        setLocation("/deal-creation");
        return;
      }
      
      if (data.status === 'requires_payment' && data.clientSecret) {
        setSubscriptionState({
          status: 'requires_payment',
          subscriptionId: data.subscriptionId,
          clientSecret: data.clientSecret,
          intentType: data.intentType || 'payment'
        });
      } else {
        setSubscriptionState({
          status: 'error',
          error: data.error?.message || "Unable to initialize payment. Please try again."
        });
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
      
      console.error("Error initializing subscription:", error);
      setSubscriptionState({
        status: 'error',
        error: "Failed to initialize subscription. Please try again."
      });
    }
  };

  const handlePaymentSuccess = () => {
    setLocation("/deal-creation");
  };

  const handleRetry = () => {
    setSubscriptionState({ status: 'selecting' });
  };

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

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <BackHeader
        title="Subscribe to MealScout"
        fallbackHref="/restaurant-owner-dashboard"
        icon={CreditCard}
      />

      <div className="px-4 py-6">
        {subscriptionState.status === 'selecting' && (
          <PlanSelector
            hasMultipleDeals={hasMultipleDeals}
            billingInterval={billingInterval}
            promoCode={promoCode}
            onHasMultipleDealsChange={setHasMultipleDeals}
            onBillingIntervalChange={setBillingInterval}
            onPromoCodeChange={setPromoCode}
            onContinue={initializeSubscription}
          />
        )}

        {subscriptionState.status === 'initializing' && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
              <p className="text-muted-foreground" data-testid="text-initializing">Initializing your subscription...</p>
            </div>
          </div>
        )}

        {subscriptionState.status === 'requires_payment' && subscriptionState.clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret: subscriptionState.clientSecret }}>
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Complete Your Payment</h3>
                  <p className="text-sm text-gray-600">
                    {hasMultipleDeals ? '3 deals' : '1 deal'} plan • {billingInterval === 'quarter' ? '$100/3 months' : billingInterval === 'year' ? '$450/year' : hasMultipleDeals ? '$75/month' : '$50/month'}
                  </p>
                </CardContent>
              </Card>
              <PaymentForm 
                clientSecret={subscriptionState.clientSecret} 
                intentType={subscriptionState.intentType}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </Elements>
        )}

        {subscriptionState.status === 'error' && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Card>
              <CardContent className="p-6 text-center">
                <i className="fas fa-exclamation-triangle text-destructive text-3xl mb-4"></i>
                <h2 className="text-lg font-semibold text-foreground mb-2">Setup Error</h2>
                <p className="text-muted-foreground mb-4" data-testid="text-error-message">
                  {subscriptionState.error}
                </p>
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}