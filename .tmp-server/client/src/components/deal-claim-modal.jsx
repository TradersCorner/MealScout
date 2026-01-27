var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { shareToFacebook, initFacebookSDK } from '@/lib/facebook';
export default function DealClaimModal(_a) {
    var _this = this;
    var _b;
    var dealId = _a.dealId, onClose = _a.onClose, isOpen = _a.isOpen;
    var _c = useState('confirm'), step = _c[0], setStep = _c[1];
    var _d = useState(null), postData = _d[0], setPostData = _d[1];
    var _e = useState(false), facebookAvailable = _e[0], setFacebookAvailable = _e[1];
    var _f = useState('none'), shareStatus = _f[0], setShareStatus = _f[1];
    var toast = useToast().toast;
    // Initialize Facebook SDK when component mounts
    useEffect(function () {
        var initFacebook = function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, initFacebookSDK()];
                    case 1:
                        _a.sent();
                        setFacebookAvailable(true);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.warn('Facebook SDK initialization failed:', error_1);
                        setFacebookAvailable(false);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        if (isOpen) {
            initFacebook();
        }
    }, [isOpen]);
    var claimDealMutation = useMutation({
        mutationFn: function (dealId) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest('POST', "/api/deals/".concat(dealId, "/claim"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        }); },
        onSuccess: function (data) {
            setPostData(data);
            setStep('posting');
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to claim deal",
                variant: "destructive",
            });
            onClose();
        },
    });
    var handleFacebookPost = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!(postData === null || postData === void 0 ? void 0 : postData.facebookPostData)) {
                        throw new Error('No post data available');
                    }
                    if (!facebookAvailable) {
                        throw new Error('Facebook SDK not available');
                    }
                    // Use Facebook sharing functionality
                    return [4 /*yield*/, shareToFacebook({
                            message: postData.facebookPostData.message,
                            place: postData.facebookPostData.place,
                            restaurantName: postData.restaurantName,
                        })];
                case 1:
                    // Use Facebook sharing functionality
                    _a.sent();
                    // Facebook sharing succeeded (clear post_id returned)
                    setShareStatus('succeeded');
                    setStep('success');
                    toast({
                        title: "Shared Successfully!",
                        description: "Your deal has been shared on Facebook!",
                    });
                    // Auto close after success
                    setTimeout(function () {
                        onClose();
                    }, 2000);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    // Handle different types of Facebook errors
                    if (error_2.message.includes('cancelled')) {
                        setShareStatus('cancelled');
                        setStep('success');
                        toast({
                            title: "Sharing Cancelled",
                            description: "You cancelled Facebook sharing. Your deal is still claimed!",
                        });
                    }
                    else if (error_2.message.includes('outcome unknown')) {
                        setShareStatus('attempted');
                        setStep('success');
                        toast({
                            title: "Sharing Window Closed",
                            description: "The Facebook sharing window was closed. Your deal is still claimed!",
                        });
                    }
                    else {
                        setShareStatus('failed');
                        setStep('success');
                        toast({
                            title: "Sharing Failed",
                            description: "Could not share on Facebook, but your deal is claimed successfully!",
                            variant: "destructive",
                        });
                    }
                    // Auto close after handling error
                    setTimeout(function () {
                        onClose();
                    }, 2000);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleSkipPost = function () {
        setShareStatus('none');
        setStep('success');
        toast({
            title: "Special Claimed",
            description: "Special claimed successfully! You can share on Facebook later if you'd like.",
        });
        setTimeout(function () {
            onClose();
        }, 2000);
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardContent className="p-8">
          {step === 'confirm' && (<div className="text-center">
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
                <Button onClick={function () { return claimDealMutation.mutate(dealId); }} className="w-full py-3 food-gradient-primary border-0 font-bold" disabled={claimDealMutation.isPending}>
                  {claimDealMutation.isPending ? "Claiming..." : "Claim Special"}
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full py-3">
                  Cancel
                </Button>
              </div>
            </div>)}

          {step === 'posting' && postData && (<div className="text-center">
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
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <i className="fab fa-facebook-f text-white text-sm"></i>
                  </div>
                  <span className="font-semibold text-foreground">Your Name</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {((_b = postData.facebookPostData) === null || _b === void 0 ? void 0 : _b.message) ||
                "Just claimed an amazing special at ".concat(postData.restaurantName, "! \uD83C\uDF7D\uFE0F\n\n").concat(postData.dealTitle, "\n\nFound this through MealScout - check it out! #MealScout #FoodSpecials")}
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
                <Button onClick={handleFacebookPost} className="w-full py-3 bg-blue-600 hover:bg-blue-700 border-0 font-bold" disabled={!facebookAvailable} data-testid="button-share-facebook">
                  <i className="fab fa-facebook-f mr-2"></i>
                  {facebookAvailable ? 'Share on Facebook' : 'Facebook unavailable'}
                </Button>
                <Button onClick={handleSkipPost} variant="outline" className="w-full py-3">
                  Skip & Continue
                </Button>
              </div>
            </div>)}

          {step === 'success' && (<div className="text-center">
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
                {shareStatus === 'succeeded' && (<p className="text-blue-600 font-medium">
                    📱 Successfully shared on Facebook!
                  </p>)}
                {shareStatus === 'attempted' && (<p className="text-muted-foreground">
                    📱 Facebook sharing window was opened - you may have shared!
                  </p>)}
                {shareStatus === 'cancelled' && (<p className="text-muted-foreground">
                    📱 Facebook sharing was cancelled
                  </p>)}
                {shareStatus === 'failed' && (<p className="text-muted-foreground">
                    📱 Facebook sharing failed, but your deal is still yours!
                  </p>)}
                {shareStatus === 'none' && (<p className="text-muted-foreground">
                    📱 You can share on Facebook anytime from your claimed deals
                  </p>)}
                <p className="text-sm text-muted-foreground mt-4">
                  Show this confirmation to the restaurant when you visit!
                </p>
              </div>
              <Button onClick={onClose} className="w-full py-3 food-gradient-primary border-0 font-bold">
                Got It!
              </Button>
            </div>)}
        </CardContent>
      </Card>
    </div>);
}
