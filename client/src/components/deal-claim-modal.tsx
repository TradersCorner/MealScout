import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { shareToFacebook, initFacebookSDK } from '@/lib/facebook';

interface DealClaimModalProps {
  dealId: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function DealClaimModal({ dealId, onClose, isOpen }: DealClaimModalProps) {
  const [step, setStep] = useState<'confirm' | 'posting' | 'success'>('confirm');
  const [postData, setPostData] = useState<any>(null);
  const [facebookAvailable, setFacebookAvailable] = useState(false);
  const [shareStatus, setShareStatus] = useState<'none' | 'succeeded' | 'attempted' | 'cancelled' | 'failed'>('none');
  const { toast } = useToast();

  // Initialize Facebook SDK when component mounts
  useEffect(() => {
    const initFacebook = async () => {
      try {
        await initFacebookSDK();
        setFacebookAvailable(true);
      } catch (error) {
        console.warn('Facebook SDK initialization failed:', error);
        setFacebookAvailable(false);
      }
    };
    
    if (isOpen) {
      initFacebook();
    }
  }, [isOpen]);

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

      if (!facebookAvailable) {
        throw new Error('Facebook SDK not available');
      }

      // Use Facebook sharing functionality
      await shareToFacebook({
        message: postData.facebookPostData.message,
        place: postData.facebookPostData.place,
        restaurantName: postData.restaurantName,
      });

      // Facebook sharing succeeded (clear post_id returned)
      setShareStatus('succeeded');
      setStep('success');
      
      toast({
        title: "Shared Successfully!",
        description: "Your deal has been shared on Facebook!",
      });

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      // Handle different types of Facebook errors
      if (error.message.includes('cancelled')) {
        setShareStatus('cancelled');
        setStep('success');
        toast({
          title: "Sharing Cancelled",
          description: "You cancelled Facebook sharing. Your deal is still claimed!",
        });
      } else if (error.message.includes('outcome unknown')) {
        setShareStatus('attempted');
        setStep('success');
        toast({
          title: "Sharing Window Closed",
          description: "The Facebook sharing window was closed. Your deal is still claimed!",
        });
      } else {
        setShareStatus('failed');
        setStep('success');
        toast({
          title: "Sharing Failed",
          description: "Could not share on Facebook, but your deal is claimed successfully!",
          variant: "destructive",
        });
      }
      
      // Auto close after handling error
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleSkipPost = () => {
    setShareStatus('none');
    setStep('success');
    toast({
      title: "Special Claimed",
      description:
        "Special claimed successfully! You can share on Facebook later if you'd like.",
    });
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-clean-lg border-0">
        <CardContent className="p-8">
          {step === 'confirm' && (
            <div className="text-center">
              <div className="w-16 h-16 food-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-utensils text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                Claim This Special
              </h3>
              <p className="text-muted-foreground mb-6">
                Claim this deal and optionally share it on Facebook to spread the word about great food!
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => claimDealMutation.mutate(dealId)}
                  className="w-full py-3 food-gradient-primary border-0 font-bold"
                  disabled={claimDealMutation.isPending}
                >
                  {claimDealMutation.isPending ? "Claiming..." : "Claim Special"}
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
              <h3 className="text-xl font-bold text-foreground mb-3">Share on Facebook</h3>
              <p className="text-muted-foreground mb-4">
                Ready to share on Facebook! This will post about your amazing deal at {postData.restaurantName}.
              </p>
              
              {/* Preview of the Facebook post */}
              <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left border border-border/30">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-[color:var(--accent-text)] rounded-full flex items-center justify-center">
                    <i className="fab fa-facebook-f text-white text-sm"></i>
                  </div>
                  <span className="font-semibold text-foreground">Your Name</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {postData.facebookPostData?.message ||
                    `Just claimed an amazing special at ${postData.restaurantName}! 🍽️\n\n${postData.dealTitle}\n\nFound this through MealScout - check it out! #MealScout #FoodSpecials`}
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
                  className="w-full py-3 bg-[color:var(--accent-text)] hover:bg-[color:var(--accent-text-hover)] border-0 font-bold"
                  disabled={!facebookAvailable}
                  data-testid="button-share-facebook"
                >
                  <i className="fab fa-facebook-f mr-2"></i>
                  {facebookAvailable ? 'Share on Facebook' : 'Facebook unavailable'}
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
              <h3 className="text-xl font-bold text-foreground mb-3">
                {shareStatus === "succeeded"
                  ? "Special Claimed & Shared!"
                  : "Special Claimed Successfully!"}
              </h3>
              <div className="space-y-3 mb-6">
                <p className="text-foreground font-medium">
                  ✅ Your deal has been claimed successfully!
                </p>
                {shareStatus === 'succeeded' && (
                  <p className="text-[color:var(--accent-text)] font-medium">
                    📱 Successfully shared on Facebook!
                  </p>
                )}
                {shareStatus === 'attempted' && (
                  <p className="text-muted-foreground">
                    📱 Facebook sharing window was opened - you may have shared!
                  </p>
                )}
                {shareStatus === 'cancelled' && (
                  <p className="text-muted-foreground">
                    📱 Facebook sharing was cancelled
                  </p>
                )}
                {shareStatus === 'failed' && (
                  <p className="text-muted-foreground">
                    📱 Facebook sharing failed, but your deal is still yours!
                  </p>
                )}
                {shareStatus === 'none' && (
                  <p className="text-muted-foreground">
                    📱 You can share on Facebook anytime from your claimed deals
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Show this confirmation to the restaurant when you visit!
                </p>
              </div>
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

