import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { CreditCard, Calendar, AlertCircle, CheckCircle } from "lucide-react";

interface SubscriptionStatus {
  status: string;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
}

export default function SubscriptionManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: subscriptionStatus, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    enabled: !!user,
  });

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [keepAdsLive, setKeepAdsLive] = useState(true);

  const pauseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/pause");
    },
    onSuccess: () => {
      toast({
        title: "Subscription Paused",
        description: "Your subscription is paused. You can resume anytime.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Pause Failed",
        description: error.message || "Failed to pause subscription",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/cancel", { keepAdsLive });
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: keepAdsLive 
          ? "Your subscription will end at billing period end. Your deals remain live until then."
          : "Your subscription will end at billing period end. Your deals will be removed immediately.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'canceled':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'past_due':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Past Due</Badge>;
      case 'none':
        return <Badge variant="secondary">No Subscription</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your MealScout restaurant subscription</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>
              Your subscription status and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status</span>
              {getStatusBadge(subscriptionStatus?.status || 'none')}
            </div>

            {subscriptionStatus?.status === 'active' && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Current Period Ends
                  </span>
                  <span className="text-sm">
                    {subscriptionStatus.currentPeriodEnd ? formatDate(subscriptionStatus.currentPeriodEnd) : 'N/A'}
                  </span>
                </div>

                {subscriptionStatus.cancelAtPeriodEnd && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Subscription will cancel at the end of the billing period
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Subscription Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Create unlimited meal deals
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Reach customers within 10km radius
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Analytics and insights dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Priority customer support
                    </li>
                  </ul>
                </div>
              </>
            )}

            {subscriptionStatus?.status === 'none' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You don't have an active subscription. Subscribe to start creating deals and reaching more customers.
                </p>
                <Link href="/subscribe">
                  <Button className="w-full" data-testid="button-subscribe-now">
                    Subscribe Now - $49/month
                  </Button>
                </Link>
              </div>
            )}

            {subscriptionStatus?.status === 'active' && !subscriptionStatus.cancelAtPeriodEnd && (
              <div className="pt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                    data-testid="button-pause-subscription"
                  >
                    {pauseMutation.isPending ? "Pausing..." : "Pause"}
                  </Button>
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        data-testid="button-cancel-subscription"
                      >
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                          Your subscription will end at the current billing period end ({subscriptionStatus?.currentPeriodEnd ? formatDate(subscriptionStatus.currentPeriodEnd) : 'N/A'}).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="keep-ads-live" 
                            checked={keepAdsLive}
                            onCheckedChange={(checked) => setKeepAdsLive(checked as boolean)}
                          />
                          <label 
                            htmlFor="keep-ads-live" 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Keep my deals visible until billing period ends
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {keepAdsLive 
                            ? "Your deals will remain active and discoverable until your subscription officially ends." 
                            : "Your deals will be removed immediately upon cancellation."}
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Keep Subscription
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Pause: Temporarily stop billing. Cancel: End subscription at period end.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>
              View your past invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Billing history will be available after your first payment.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4">
          <Link href="/restaurant-owner-dashboard">
            <Button variant="outline" data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/deal-creation">
            <Button data-testid="button-create-deal">
              Create New Deal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}