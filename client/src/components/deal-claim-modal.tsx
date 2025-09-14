import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { postToFacebook, checkInToPlace } from '@/lib/facebook';

interface DealClaimModalProps {
  dealId: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function DealClaimModal({ dealId, onClose, isOpen }: DealClaimModalProps) {
  const [step, setStep] = useState<'confirm' | 'posting' | 'success'>('confirm');
  const [postData, setPostData] = useState<any>(null);
  const { toast } = useToast();

  const claimDealMutation = useMutation({
    mutationFn: async (dealId: string) => {
      const response = await apiRequest('POST', `/api/deals/${dealId}/claim`);
      return response;
    },
    onSuccess: (data) => {
      setPostData(data);
      setStep('posting');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim deal",
        variant: "destructive",
      });
      onClose();
    },
  });

  const handleFacebookPost = async () => {
    try {
      if (!postData?.facebookPostData) {
        throw new Error('No post data available');
      }

      // Use Facebook check-in functionality
      await checkInToPlace({
        message: postData.facebookPostData.message,
        place: postData.facebookPostData.place,
        restaurantName: postData.restaurantName,
      });

      setStep('success');
      
      toast({
        title: "Success!",
        description: "Deal claimed and posted to Facebook!",
      });

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to post to Facebook, but deal was claimed successfully!",
        variant: "destructive",
      });
      setStep('success');
    }
  };

  const handleSkipPost = () => {
    setStep('success');
    toast({
      title: "Deal Claimed",
      description: "Deal claimed successfully! You can post to Facebook later.",
    });
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="p-8">
          {step === 'confirm' && (
            <div className="text-center">
              <div className="w-16 h-16 food-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-utensils text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Claim This Deal</h3>
              <p className="text-muted-foreground mb-6">
                To claim this deal, you'll need to check in at the restaurant on Facebook and tag MealScout.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => claimDealMutation.mutate(dealId)}
                  className="w-full py-3 food-gradient-primary border-0 font-bold"
                  disabled={claimDealMutation.isPending}
                >
                  {claimDealMutation.isPending ? "Claiming..." : "Claim Deal"}
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full py-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {step === 'posting' && postData && (
            <div className="text-center">
              <div className="w-16 h-16 food-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-facebook-f text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Check In & Post</h3>
              <p className="text-muted-foreground mb-4">
                Ready to post to Facebook! This will check you in at {postData.restaurantName} and share your amazing deal.
              </p>
              
              {/* Preview of the Facebook post */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left border border-border/30">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <i className="fab fa-facebook-f text-white text-sm"></i>
                  </div>
                  <span className="font-semibold text-foreground">Your Name</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {postData.facebookPostData?.message || `Just claimed an amazing deal at ${postData.restaurantName}! 🍽️\n\n${postData.dealTitle}\n\nFound this through DealScout - check it out! #DealScout #FoodDeals`}
                </p>
                <div className="mt-3 p-3 bg-background rounded-lg border border-border/50">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-map-marker-alt text-primary"></i>
                    <span className="text-sm font-medium text-foreground">{postData.restaurantName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{postData.restaurantAddress}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleFacebookPost}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 border-0 font-bold"
                >
                  <i className="fab fa-facebook-f mr-2"></i>
                  Post to Facebook
                </Button>
                <Button
                  onClick={handleSkipPost}
                  variant="outline"
                  className="w-full py-3"
                >
                  Skip & Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 food-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Success!</h3>
              <p className="text-muted-foreground mb-6">
                Your deal has been claimed successfully. Show this to the restaurant when you visit!
              </p>
              <Button
                onClick={onClose}
                className="w-full py-3 food-gradient-primary border-0 font-bold"
              >
                Got It!
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}