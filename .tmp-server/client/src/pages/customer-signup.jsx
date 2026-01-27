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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Mail, Eye, EyeOff, UserPlus } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { SEOHead } from "@/components/seo-head";
import { PASSWORD_REGEX, PASSWORD_REQUIREMENTS, } from "@/utils/passwordPolicy";
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp";
var signupSchema = z
    .object({
    email: z.string().email("Valid email is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    otpCode: z.string().optional(),
    password: z
        .string()
        .min(1, PASSWORD_REQUIREMENTS)
        .regex(PASSWORD_REGEX, PASSWORD_REQUIREMENTS),
    confirmPassword: z.string().min(1, "Please confirm your password"),
})
    .refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
export default function CustomerSignup() {
    var _this = this;
    var _a = useLocation(), setLocation = _a[1];
    var toast = useToast().toast;
    var _b = useState(false), showPassword = _b[0], setShowPassword = _b[1];
    var _c = useState(false), showConfirmPassword = _c[0], setShowConfirmPassword = _c[1];
    var _d = useState(false), otpSending = _d[0], setOtpSending = _d[1];
    var _e = useState(false), otpSent = _e[0], setOtpSent = _e[1];
    var requirePhoneVerification = false;
    var searchParams = new URLSearchParams(window.location.search);
    var role = searchParams.get("role");
    var initialAccountType = role === "business" ? "business" : role === "host" ? "host" : "diner";
    var _f = useState(initialAccountType), accountType = _f[0], setAccountType = _f[1];
    var SIGNUP_DRAFT_KEY = "mealscout:customer-signup-draft";
    var defaultValues = useMemo(function () {
        var base = {
            email: "",
            firstName: "",
            lastName: "",
            phone: "",
            otpCode: "",
            password: "",
            confirmPassword: "",
        };
        if (typeof window === "undefined")
            return base;
        try {
            var stored = window.localStorage.getItem(SIGNUP_DRAFT_KEY);
            if (!stored)
                return base;
            var parsed = JSON.parse(stored);
            // Never pre-fill passwords from storage for safety
            delete parsed.password;
            delete parsed.confirmPassword;
            return __assign(__assign({}, base), parsed);
        }
        catch (_a) {
            return base;
        }
    }, []);
    var form = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: defaultValues,
    });
    // Persist non-sensitive draft so interrupted users can resume later
    useEffect(function () {
        var subscription = form.watch(function (value) {
            try {
                var password = value.password, confirmPassword = value.confirmPassword, rest = __rest(value, ["password", "confirmPassword"]);
                window.localStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(rest));
            }
            catch (_a) {
                // ignore storage errors
            }
        });
        return function () { return subscription.unsubscribe(); };
    }, [form]);
    var customerSignupMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var confirmPassword, signupData, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        confirmPassword = data.confirmPassword, signupData = __rest(data, ["confirmPassword"]);
                        return [4 /*yield*/, apiRequest("POST", "/api/auth/customer/register", signupData)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== "undefined") {
                            window.localStorage.removeItem(SIGNUP_DRAFT_KEY);
                        }
                        if (payload === null || payload === void 0 ? void 0 : payload.user) {
                            queryClient.setQueryData(["/api/auth/user"], payload.user);
                        }
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryClient.refetchQueries({ queryKey: ["/api/auth/user"] })];
                    case 2:
                        _a.sent();
                        toast({
                            title: "Welcome to MealScout!",
                            description: "Account created successfully. You're now logged in!",
                        });
                        window.location.href = "/";
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            toast({
                title: "Signup Failed",
                description: error.message || "Failed to create account",
                variant: "destructive",
            });
        },
    });
    var businessSignupMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var confirmPassword, signupData, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        confirmPassword = data.confirmPassword, signupData = __rest(data, ["confirmPassword"]);
                        return [4 /*yield*/, apiRequest("POST", "/api/auth/restaurant/register", signupData)];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (payload) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof window !== "undefined") {
                            window.localStorage.removeItem(SIGNUP_DRAFT_KEY);
                        }
                        if (payload === null || payload === void 0 ? void 0 : payload.user) {
                            queryClient.setQueryData(["/api/auth/user"], payload.user);
                        }
                        return [4 /*yield*/, queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, queryClient.refetchQueries({ queryKey: ["/api/auth/user"] })];
                    case 2:
                        _a.sent();
                        toast({
                            title: "Welcome to MealScout for Business!",
                            description: "Account created successfully. Let's finish setting up your restaurant.",
                        });
                        window.location.href = "/restaurant-signup";
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            toast({
                title: "Business signup failed",
                description: error.message || "Failed to create business account",
                variant: "destructive",
            });
        },
    });
    var onSubmit = function (data) {
        if (accountType === "business") {
            var digitsOnly = (data.phone || "").replace(/\D/g, "");
            if (!digitsOnly || digitsOnly.length < 10) {
                form.setError("phone", {
                    type: "manual",
                    message: "Valid phone number is required for business accounts",
                });
                return;
            }
            if (requirePhoneVerification && !data.otpCode) {
                form.setError("otpCode", {
                    type: "manual",
                    message: "Verification code is required",
                });
                return;
            }
            businessSignupMutation.mutate(data);
        }
        else if (accountType === "host") {
            // Hosts signup as customers but we can add host-specific flow later
            if (requirePhoneVerification && !data.otpCode) {
                form.setError("otpCode", {
                    type: "manual",
                    message: "Verification code is required",
                });
                return;
            }
            customerSignupMutation.mutate(data);
        }
        else {
            if (requirePhoneVerification && !data.otpCode) {
                form.setError("otpCode", {
                    type: "manual",
                    message: "Verification code is required",
                });
                return;
            }
            customerSignupMutation.mutate(data);
        }
    };
    var handleSendOtp = function () { return __awaiter(_this, void 0, void 0, function () {
        var phone, digitsOnly, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    phone = form.getValues("phone") || "";
                    digitsOnly = phone.replace(/\D/g, "");
                    if (!digitsOnly || digitsOnly.length < 10) {
                        form.setError("phone", {
                            type: "manual",
                            message: "Enter a valid phone number before sending a code",
                        });
                        return [2 /*return*/];
                    }
                    setOtpSending(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, apiRequest("POST", "/api/auth/phone/send-code", {
                            phone: digitsOnly,
                        })];
                case 2:
                    _a.sent();
                    setOtpSent(true);
                    toast({
                        title: "Code sent",
                        description: "Check your phone for the verification code.",
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: "Failed to send code",
                        description: error_1.message || "Please try again.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setOtpSending(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var isSubmitting = customerSignupMutation.isPending || businessSignupMutation.isPending;
    return (<div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex flex-col">
      <SEOHead title="Sign Up - MealScout | Create Free Account" description="Join MealScout for free and start discovering exclusive food deals from local restaurants. Save your favorites, track deals, and never miss amazing dining discounts." keywords="sign up, create account, register, join mealscout, free account, food deals signup" canonicalUrl="https://mealscout.us/customer-signup" noIndex={true}/>
      <BackHeader title="Create Account" fallbackHref="/" icon={UserPlus} className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"/>

      <main className="flex-1 px-4 py-2 max-w-md mx-auto flex flex-col justify-between">
        {/* Top: hero + form */}
        <div>
          {/* Welcome Section (highly compressed) */}
          <div className="text-center mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl mb-1 flex items-center justify-center mx-auto shadow-md ring-2 ring-white/70">
              <UserPlus className="w-5 h-5 text-white drop-shadow"/>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
              Create Your MealScout Account
            </h2>
            <p className="text-gray-600 text-xs leading-snug max-w-sm mx-auto">
              {accountType === "business"
            ? "Create your login so we can connect your restaurant or truck, list your deals, and pass savings directly to your regulars."
            : accountType === "host"
                ? "Organize events and invite food trucks to your location. Free forever to unlock local food truck supply."
                : "Save favorite deals and never miss new drops from local spots."}
            </p>
          </div>

          {/* Signup Form */}
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-4">
            {/* Account type selection inside form */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-full bg-white border border-gray-200 shadow-sm text-[11px] font-medium text-gray-700 overflow-hidden">
                <button type="button" onClick={function () { return setAccountType("diner"); }} className={"px-3 py-1 transition-colors ".concat(accountType === "diner"
            ? "bg-orange-500 text-white"
            : "bg-transparent text-gray-700 hover:bg-gray-100")}>
                  Diner
                </button>
                <button type="button" onClick={function () { return setAccountType("host"); }} className={"px-3 py-1 border-l border-gray-200 transition-colors ".concat(accountType === "host"
            ? "bg-orange-500 text-white"
            : "bg-transparent text-gray-700 hover:bg-gray-100")}>
                  Host / Event Organizer
                </button>
                <button type="button" onClick={function () { return setAccountType("business"); }} className={"px-3 py-1 border-l border-gray-200 transition-colors ".concat(accountType === "business"
            ? "bg-orange-500 text-white"
            : "bg-transparent text-gray-700 hover:bg-gray-100")}>
                  Restaurant / Food Truck
                </button>
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Sign Up with Email
              </h3>
              <p className="text-gray-600 text-xs">
                {accountType === "business"
            ? "This login powers your business dashboard. Pricing stays transparent and your discounts go straight to your guests."
            : accountType === "host"
                ? "This login lets you post events and connect with food trucks. No monthly fees, just bring food to your spot."
                : "Create your account to get started with local food deals."}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="firstName" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input data-testid="input-first-name" autoComplete="given-name" placeholder="John" {...field}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>
                  <FormField control={form.control} name="lastName" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input data-testid="input-last-name" autoComplete="family-name" placeholder="Doe" {...field}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>
                </div>

                <FormField control={form.control} name="email" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                          <Input data-testid="input-email" type="email" autoComplete="email" placeholder="john@example.com" className="pl-10" {...field}/>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>);
        }}/>

                <FormField control={form.control} name="phone" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input data-testid="input-phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" {...field}/>
                          {requirePhoneVerification && (<Button type="button" variant="outline" onClick={handleSendOtp} disabled={otpSending}>
                              {otpSending
                        ? "Sending..."
                        : otpSent
                            ? "Resend"
                            : "Send code"}
                            </Button>)}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>);
        }}/>

                {requirePhoneVerification && (<FormField control={form.control} name="otpCode" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
                            <InputOTPGroup>
                              {[0, 1, 2, 3, 4, 5].map(function (index) { return (<InputOTPSlot key={index} index={index}/>); })}
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
            }}/>)}

                <FormField control={form.control} name="password" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input data-testid="input-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter password" {...field}/>
                          <button data-testid="button-toggle-password" type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>);
        }}/>

                <FormField control={form.control} name="confirmPassword" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input data-testid="input-confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirm password" {...field}/>
                          <button data-testid="button-toggle-confirm-password" type="button" onClick={function () {
                    return setShowConfirmPassword(!showConfirmPassword);
                }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showConfirmPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>);
        }}/>

                <Button data-testid="button-create-account" type="submit" disabled={isSubmitting} className="w-full py-3 font-semibold text-base rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                  {isSubmitting ? (<div className="animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full"/>) : null}
                  Create Account
                </Button>
              </form>
            </Form>

            {/* Divider + Login Link (compressed) */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <span>Already have an account?</span>
              <Link href="/login">
                <button type="button" className="text-blue-600 underline hover:text-blue-700" data-testid="button-sign-in">
                  Sign in
                </button>
              </Link>
            </div>

            {/* Trust indicators (compressed) */}
            <div className="mt-3 border-t border-gray-200 pt-2 flex items-center justify-center gap-4 text-[11px] leading-tight text-gray-500">
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>
                  {accountType === "business"
            ? "Transparent pricing"
            : "Local restaurants & trucks"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <span>
                  {accountType === "business"
            ? "You control every discount"
            : "Secure"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>
                  {accountType === "business"
            ? "Local diners get the savings"
            : "Instant Access"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Legal Links */}
        <div className="mt-2 text-center">
          <p className="text-[11px] text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms-of-service">
              <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">
                Terms of Service
              </span>
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy">
              <span className="text-blue-600 underline hover:text-blue-700 cursor-pointer">
                Privacy Policy
              </span>
            </Link>
          </p>
        </div>
      </main>
    </div>);
}
