var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Calendar } from "lucide-react";
export default function EventSignup() {
    var _this = this;
    var _a = useAuth(), user = _a.user, isAuthenticated = _a.isAuthenticated, isLoading = _a.isLoading, refetch = _a.refetch;
    var _b = useLocation(), setLocation = _b[1];
    var toast = useToast().toast;
    var _c = useState(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var isEventCoordinator = (user === null || user === void 0 ? void 0 : user.userType) === "event_coordinator";
    var _d = useState({
        eventName: "",
        date: "",
        city: "",
        expectedCrowd: "",
        contactEmail: (user === null || user === void 0 ? void 0 : user.email) || "",
        contactPhone: "",
        notes: "",
    }), formData = _d[0], setFormData = _d[1];
    var handleChange = function (e) {
        var _a;
        setFormData(__assign(__assign({}, formData), (_a = {}, _a[e.target.name] = e.target.value, _a)));
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, data, isCoordinator, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("/api/events/signup", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(__assign(__assign({}, formData), { userId: user === null || user === void 0 ? void 0 : user.id })),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to submit event request");
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    isCoordinator = (data === null || data === void 0 ? void 0 : data.userType) === "event_coordinator";
                    if (!isCoordinator) return [3 /*break*/, 5];
                    return [4 /*yield*/, refetch()];
                case 4:
                    _a.sent();
                    toast({
                        title: "Request submitted",
                        description: "You can now post events from your dashboard.",
                    });
                    setLocation("/event-coordinator/dashboard");
                    return [2 /*return*/];
                case 5:
                    toast({
                        title: "Request submitted",
                        description: "We will follow up soon.",
                    });
                    setLocation("/");
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    console.error("Event signup error:", error_1);
                    toast({
                        title: "Submission failed",
                        description: "Please try again or contact support.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 8];
                case 7:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />

      <div className="container max-w-2xl mx-auto px-4 py-12">
        {isLoading ? null : !isAuthenticated ? (<Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Calendar className="w-8 h-8 text-blue-600"/>
                Log in to request event access
              </CardTitle>
              <CardDescription className="text-lg">
                You will submit a request to become an event coordinator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={function () { return setLocation("/login?redirect=/event-signup"); }}>
                Log in to continue
              </Button>
            </CardContent>
          </Card>) : isEventCoordinator ? (<Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Calendar className="w-8 h-8 text-blue-600"/>
                You are already an event coordinator
              </CardTitle>
              <CardDescription className="text-lg">
                Go to your dashboard to post events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={function () { return setLocation("/event-coordinator/dashboard"); }}>
                Open dashboard
              </Button>
            </CardContent>
          </Card>) : (<Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600"/>
              Request event coordinator access
            </CardTitle>
            <CardDescription className="text-lg">
              Share your event details and we will follow up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div>
                <Label htmlFor="eventName">Event Name *</Label>
                <Input id="eventName" name="eventName" value={formData.eventName} onChange={handleChange} required placeholder="Summer Block Party"/>
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="date">Event Date *</Label>
                <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required/>
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} required placeholder="San Francisco"/>
              </div>

              {/* Expected Crowd */}
              <div>
                <Label htmlFor="expectedCrowd">Expected Crowd *</Label>
                <Input id="expectedCrowd" name="expectedCrowd" type="number" value={formData.expectedCrowd} onChange={handleChange} required placeholder="200"/>
              </div>

              {/* Contact Email */}
              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} required placeholder="you@example.com"/>
              </div>

              {/* Contact Phone */}
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input id="contactPhone" name="contactPhone" type="tel" value={formData.contactPhone} onChange={handleChange} placeholder="(555) 123-4567"/>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Details</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={4} placeholder="Space available, power outlets, special requests..."/>
              </div>

              {/* Trust Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">
                  ✓ Event organizers are always free
                  <br />
                  ✓ No hidden fees, now or later
                  <br />✓ We only charge booking fees to trucks
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Request Food Trucks (Free)"}
              </Button>
            </form>
          </CardContent>
        </Card>)}
      </div>
    </div>);
}
