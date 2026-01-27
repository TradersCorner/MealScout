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
import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements, } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Load Stripe publishable key
var stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");
function PaymentForm(_a) {
    var _this = this;
    var clientSecret = _a.clientSecret, totalCents = _a.totalCents, breakdown = _a.breakdown, onSuccess = _a.onSuccess, onCancel = _a.onCancel;
    var stripe = useStripe();
    var elements = useElements();
    var toast = useToast().toast;
    var _b = useState(false), isProcessing = _b[0], setIsProcessing = _b[1];
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var error, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!stripe || !elements) {
                        return [2 /*return*/];
                    }
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, stripe.confirmPayment({
                            elements: elements,
                            confirmParams: {
                                return_url: "".concat(window.location.origin, "/parking-pass?booking=success"),
                            },
                            redirect: "if_required",
                        })];
                case 2:
                    error = (_a.sent()).error;
                    if (error) {
                        toast({
                            title: "Payment Failed",
                            description: error.message || "An error occurred during payment.",
                            variant: "destructive",
                        });
                    }
                    else {
                        toast({
                            title: "Parking Pass Confirmed!",
                            description: "Your parking spot has been reserved.",
                        });
                        onSuccess();
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    toast({
                        title: "Payment Error",
                        description: err_1.message || "An unexpected error occurred.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      {/* Pricing Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between text-gray-700">
          <span>Host Location Fee</span>
          <span className="font-medium">
            ${(breakdown.hostPrice / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-gray-700">
          <span>MealScout Platform Fee (per day)</span>
          <span className="font-medium">
            ${(breakdown.platformFee / 100).toFixed(2)}
          </span>
        </div>
        {breakdown.creditsApplied ? (<div className="flex items-center justify-between text-green-700">
            <span>Credits Applied</span>
            <span className="font-medium">
              -${(breakdown.creditsApplied / 100).toFixed(2)}
            </span>
          </div>) : null}
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
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!stripe || isProcessing}>
          {isProcessing ? (<>
              <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
              Processing...
            </>) : ("Pay $".concat((totalCents / 100).toFixed(2)))}
        </Button>
      </div>

      {/* Terms Notice */}
      <p className="text-xs text-gray-500 text-center">
        By confirming payment, you acknowledge bookings are non-refundable.
      </p>
    </form>);
}
export function BookingPaymentModal(_a) {
    var _this = this;
    var open = _a.open, onOpenChange = _a.onOpenChange, passId = _a.passId, truckId = _a.truckId, slotTypes = _a.slotTypes, eventDetails = _a.eventDetails, onSuccess = _a.onSuccess;
    var toast = useToast().toast;
    var _b = useState(false), isLoading = _b[0], setIsLoading = _b[1];
    var _c = useState(null), clientSecret = _c[0], setClientSecret = _c[1];
    var _d = useState(null), bookingData = _d[0], setBookingData = _d[1];
    var _e = useState(null), creditBalance = _e[0], setCreditBalance = _e[1];
    var _f = useState(""), creditsToApply = _f[0], setCreditsToApply = _f[1];
    useEffect(function () {
        if (open && !clientSecret) {
            loadCreditBalance();
            initiateBooking();
        }
    }, [open]);
    var loadCreditBalance = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/payout/balance")];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        return [2 /*return*/];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    setCreditBalance(Number(data.balance || 0));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Failed to load credit balance:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var initiateBooking = function () { return __awaiter(_this, void 0, void 0, function () {
        var creditCents, res, data_1, data, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    creditCents = Math.max(0, Math.floor(Number(creditsToApply || 0) * 100));
                    return [4 /*yield*/, fetch("/api/parking-pass/".concat(passId, "/book"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                truckId: truckId,
                                slotTypes: slotTypes,
                                applyCreditsCents: creditCents > 0 ? creditCents : undefined,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()];
                case 3:
                    data_1 = _a.sent();
                    throw new Error(data_1.message || "Failed to initiate booking");
                case 4: return [4 /*yield*/, res.json()];
                case 5:
                    data = _a.sent();
                    setClientSecret(data.clientSecret);
                    setBookingData({
                        totalCents: data.totalCents,
                        breakdown: data.breakdown,
                    });
                    return [3 /*break*/, 8];
                case 6:
                    err_2 = _a.sent();
                    toast({
                        title: "Booking Failed",
                        description: err_2.message || "Could not initiate booking. Please try again.",
                        variant: "destructive",
                    });
                    onOpenChange(false);
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleClose = function () {
        setClientSecret(null);
        setBookingData(null);
        setCreditsToApply("");
        onOpenChange(false);
    };
    var handleSuccess = function () {
        handleClose();
        onSuccess();
    };
    return (<Dialog open={open} onOpenChange={handleClose}>
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
              {eventDetails.slotSummary && (<p className="text-xs text-gray-500">
                  Slots: {eventDetails.slotSummary}
                </p>)}
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
            <input type="number" min="0" step="0.01" value={creditsToApply} onChange={function (e) { return setCreditsToApply(e.target.value); }} className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm" placeholder="0.00"/>
            <p className="mt-1 text-xs text-gray-500">
              You can refresh pricing after setting credits.
            </p>
          </div>
          <Button type="button" variant="outline" className="mt-3 w-full" onClick={initiateBooking} disabled={isLoading}>
            Refresh Pricing
          </Button>
        </div>

        {isLoading && (<div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600"/>
            <span className="ml-3 text-gray-600">Preparing payment...</span>
          </div>)}

        {!isLoading && clientSecret && bookingData && (<Elements stripe={stripePromise} options={{
                clientSecret: clientSecret,
                appearance: {
                    theme: "stripe",
                    variables: {
                        colorPrimary: "#ea580c",
                    },
                },
            }}>
            <PaymentForm clientSecret={clientSecret} totalCents={bookingData.totalCents} breakdown={bookingData.breakdown} onSuccess={handleSuccess} onCancel={handleClose}/>
          </Elements>)}
      </DialogContent>
    </Dialog>);
}
