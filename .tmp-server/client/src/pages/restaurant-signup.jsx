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
import { useReducer, useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Mail, Eye, EyeOff, CheckCircle, Upload, ArrowLeft, ArrowRight, } from "lucide-react";
import DocumentUpload from "@/components/document-upload";
import { BackHeader } from "@/components/back-header";
import { Store } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
import { HOST_ONBOARDING_COPY as COPY } from "@/copy/hostOnboarding.copy";
import { PASSWORD_REGEX, PASSWORD_REQUIREMENTS, } from "@/utils/passwordPolicy";
/**
 * Host Onboarding v1  COPY LOCK
 * User-facing strings must come from HOST_ONBOARDING_COPY.
 * No inline labels, helper text, or validation messages.
 */
var restaurantSchema = z.object({
    name: z.string().min(1, COPY.validation.restaurant.nameRequired),
    address: z.string().min(1, COPY.validation.restaurant.addressRequired),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required"),
    phone: z.string().min(10, COPY.validation.restaurant.phoneInvalid),
    businessType: z.enum(["restaurant", "bar", "food_truck"], {
        required_error: COPY.validation.restaurant.businessTypeRequired,
    }),
    cuisineType: z.string().min(1, COPY.validation.restaurant.cuisineRequired),
    description: z
        .string()
        .max(500, "Description must be less than 500 characters")
        .optional(),
    websiteUrl: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
    instagramUrl: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
    facebookPageUrl: z
        .string()
        .url("Must be a valid URL")
        .optional()
        .or(z.literal("")),
    hasParking: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    hasOutdoorSeating: z.boolean().default(false),
    acceptTerms: z
        .boolean()
        .refine(function (val) { return val === true; }, COPY.validation.restaurant.acceptTermsRequired),
});
var signupSchema = z
    .object({
    email: z.string().email(COPY.validation.signup.emailInvalid),
    firstName: z.string().min(1, COPY.validation.signup.firstNameRequired),
    lastName: z.string().min(1, COPY.validation.signup.lastNameRequired),
    phone: z.string().min(10, COPY.validation.signup.phoneInvalid),
    password: z
        .string()
        .min(1, PASSWORD_REQUIREMENTS)
        .regex(PASSWORD_REGEX, COPY.validation.signup.passwordTooShort),
    confirmPassword: z
        .string()
        .min(1, COPY.validation.signup.confirmPasswordRequired),
})
    .refine(function (data) { return data.password === data.confirmPassword; }, {
    message: COPY.validation.signup.passwordsMismatch,
    path: ["confirmPassword"],
});
var loginSchema = z.object({
    email: z.string().email(COPY.validation.login.emailInvalid),
    password: z.string().min(1, COPY.validation.login.passwordRequired),
});
function assertNever(x) {
    throw new Error("Unhandled case: ".concat(JSON.stringify(x)));
}
function hostOnboardingTransition(state, event) {
    switch (state.step) {
        case "restaurant":
            if (event.type === "GO_TO_VERIFICATION") {
                return { step: "verification" };
            }
            return state;
        case "verification":
            if (event.type === "BACK_TO_RESTAURANT") {
                return { step: "restaurant" };
            }
            return state;
        default:
            return assertNever(state);
    }
}
export default function RestaurantSignup() {
    var _this = this;
    var _a = useLocation(), setLocation = _a[1];
    var toast = useToast().toast;
    var _b = useAuth(), user = _b.user, isAuthenticated = _b.isAuthenticated, isLoading = _b.isLoading;
    var queryClient = useQueryClient();
    var _c = useState("signup"), authMode = _c[0], setAuthMode = _c[1];
    var _d = useState(false), isHost = _d[0], setIsHost = _d[1];
    var _e = useState(false), hostCheckDone = _e[0], setHostCheckDone = _e[1];
    // Detect if this authenticated user is a host/event coordinator
    useEffect(function () {
        if (!user) {
            setIsHost(false);
            setHostCheckDone(true);
            return;
        }
        var cancelled = false;
        setHostCheckDone(false);
        fetch("/api/hosts/me")
            .then(function (res) {
            if (cancelled)
                return;
            setIsHost(res.ok);
        })
            .catch(function () {
            if (cancelled)
                return;
            setIsHost(false);
        })
            .finally(function () {
            if (cancelled)
                return;
            setHostCheckDone(true);
        });
        return function () {
            cancelled = true;
        };
    }, [user === null || user === void 0 ? void 0 : user.id]);
    // Redirect admin/staff away from this flow to their dashboard
    useEffect(function () {
        if (!isAuthenticated || !user)
            return;
        if (user.userType === "admin" || user.userType === "staff") {
            setLocation("/restaurant-owner-dashboard");
        }
    }, [isAuthenticated, user, setLocation]);
    // Hosts/event coordinators are not restaurants/food trucks – send them to host tools
    useEffect(function () {
        if (!isAuthenticated || !user || !hostCheckDone)
            return;
        if (user.userType === "customer" && isHost) {
            setLocation("/host/dashboard");
        }
    }, [isAuthenticated, user, isHost, hostCheckDone, setLocation]);
    var _f = useState(false), showPassword = _f[0], setShowPassword = _f[1];
    var _g = useState(false), showConfirmPassword = _g[0], setShowConfirmPassword = _g[1];
    var _h = useState(false), showLoginPassword = _h[0], setShowLoginPassword = _h[1];
    var _j = useState(""), claimQuery = _j[0], setClaimQuery = _j[1];
    var _k = useState([]), claimResults = _k[0], setClaimResults = _k[1];
    var _l = useState(false), claimLoading = _l[0], setClaimLoading = _l[1];
    var _m = useState(null), claimSelection = _m[0], setClaimSelection = _m[1];
    var _o = useState(""), claimError = _o[0], setClaimError = _o[1];
    var _p = useReducer(hostOnboardingTransition, {
        step: "restaurant",
    }), onboardingState = _p[0], dispatchOnboarding = _p[1];
    var _q = useState(null), createdRestaurant = _q[0], setCreatedRestaurant = _q[1];
    var _r = useState([]), verificationDocuments = _r[0], setVerificationDocuments = _r[1];
    var currentStep = onboardingState.step;
    var RESTAURANT_DRAFT_KEY = "mealscout:restaurant-signup-draft";
    var restaurantDefaultValues = useMemo(function () {
        var base = {
            name: "",
            address: "",
            city: "",
            state: "",
            phone: "",
            businessType: "food_truck",
            cuisineType: "",
            description: "",
            websiteUrl: "",
            instagramUrl: "",
            facebookPageUrl: "",
            hasParking: false,
            hasWifi: false,
            hasOutdoorSeating: false,
            acceptTerms: false,
        };
        if (typeof window === "undefined")
            return base;
        try {
            var stored = window.localStorage.getItem(RESTAURANT_DRAFT_KEY);
            if (!stored)
                return base;
            var parsed = JSON.parse(stored);
            return __assign(__assign({}, base), parsed);
        }
        catch (_a) {
            return base;
        }
    }, []);
    var form = useForm({
        resolver: zodResolver(restaurantSchema),
        defaultValues: restaurantDefaultValues,
    });
    var signupForm = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            email: "",
            firstName: "",
            lastName: "",
            phone: "",
            password: "",
            confirmPassword: "",
        },
    });
    var loginForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });
    var selectedBusinessType = form.watch("businessType");
    useEffect(function () {
        if (selectedBusinessType !== "food_truck" && claimSelection) {
            setClaimSelection(null);
            setClaimResults([]);
            setClaimQuery("");
            setClaimError("");
        }
    }, [selectedBusinessType, claimSelection]);
    // Persist restaurant business details so owners can resume onboarding
    useEffect(function () {
        var subscription = form.watch(function (value) {
            try {
                window.localStorage.setItem(RESTAURANT_DRAFT_KEY, JSON.stringify(value));
            }
            catch (_a) {
                // ignore storage errors
            }
        });
        return function () { return subscription.unsubscribe(); };
    }, [form]);
    var signupMutation = useMutation({
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
                            title: COPY.notifications.signup.successTitle,
                            description: COPY.notifications.signup.successDescription,
                        });
                        // Reload to ensure auth state is consistent across the app
                        window.location.reload();
                        return [2 /*return*/];
                }
            });
        }); },
        onError: function (error) {
            toast({
                title: COPY.notifications.signup.errorTitle,
                description: error.message || COPY.notifications.signup.errorDescription,
                variant: "destructive",
            });
        },
    });
    var loginMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/auth/restaurant/login", data)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            toast({
                title: COPY.notifications.login.successTitle,
                description: COPY.notifications.login.successDescription,
            });
            // Reload to update auth state
            window.location.reload();
        },
        onError: function (error) {
            toast({
                title: COPY.notifications.login.errorTitle,
                description: error.message || COPY.notifications.login.errorDescription,
                variant: "destructive",
            });
        },
    });
    var createRestaurantMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var res, payload, requestData, res, payload, signupData, requestData, res, payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(claimSelection && data.businessType === "food_truck")) return [3 /*break*/, 3];
                        return [4 /*yield*/, apiRequest("POST", "/api/truck-claims", {
                                listingId: claimSelection.id,
                                restaurantData: data,
                            })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 2:
                        payload = _a.sent();
                        return [2 /*return*/, (payload === null || payload === void 0 ? void 0 : payload.restaurant) || payload];
                    case 3:
                        if (!(isAuthenticated && user)) return [3 /*break*/, 6];
                        requestData = {
                            userData: {
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                phone: user.phone || data.phone, // Use restaurant phone if user doesn't have one
                                // No password needed for authenticated users
                            },
                            restaurantData: {
                                name: data.name,
                                address: data.address,
                                city: data.city,
                                state: data.state,
                                phone: data.phone,
                                businessType: data.businessType,
                                cuisineType: data.cuisineType,
                                description: data.description,
                                websiteUrl: data.websiteUrl,
                                instagramUrl: data.instagramUrl,
                                facebookPageUrl: data.facebookPageUrl,
                                amenities: {
                                    parking: data.hasParking,
                                    wifi: data.hasWifi,
                                    outdoor_seating: data.hasOutdoorSeating,
                                },
                            },
                            subscriptionPlan: "month",
                        };
                        return [4 /*yield*/, apiRequest("POST", "/api/restaurants/signup", requestData)];
                    case 4:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 5:
                        payload = _a.sent();
                        return [2 /*return*/, (payload === null || payload === void 0 ? void 0 : payload.restaurant) || payload];
                    case 6:
                        signupData = signupForm.getValues();
                        requestData = {
                            userData: {
                                email: signupData.email,
                                firstName: signupData.firstName,
                                lastName: signupData.lastName,
                                phone: signupData.phone,
                                password: signupData.password,
                            },
                            restaurantData: {
                                name: data.name,
                                address: data.address,
                                city: data.city,
                                state: data.state,
                                phone: data.phone,
                                businessType: data.businessType,
                                cuisineType: data.cuisineType,
                                description: data.description,
                                websiteUrl: data.websiteUrl,
                                instagramUrl: data.instagramUrl,
                                facebookPageUrl: data.facebookPageUrl,
                                amenities: {
                                    parking: data.hasParking,
                                    wifi: data.hasWifi,
                                    outdoor_seating: data.hasOutdoorSeating,
                                },
                            },
                            subscriptionPlan: "month",
                        };
                        return [4 /*yield*/, apiRequest("POST", "/api/restaurants/signup", requestData)];
                    case 7:
                        res = _a.sent();
                        return [4 /*yield*/, res.json()];
                    case 8:
                        payload = _a.sent();
                        return [2 /*return*/, (payload === null || payload === void 0 ? void 0 : payload.restaurant) || payload];
                }
            });
        }); },
        onSuccess: function (restaurant) {
            setCreatedRestaurant(restaurant);
            dispatchOnboarding({ type: "GO_TO_VERIFICATION" });
            toast({
                title: COPY.notifications.restaurant.successTitle,
                description: COPY.notifications.restaurant.successDescription,
            });
        },
        onError: function (error) {
            if (isUnauthorizedError(error)) {
                toast({
                    title: COPY.notifications.restaurant.unauthorizedTitle,
                    description: error.message ||
                        COPY.notifications.restaurant.unauthorizedDescription,
                    variant: "destructive",
                });
                setTimeout(function () {
                    window.location.href = "/api/auth/google/restaurant";
                }, 500);
                return;
            }
            toast({
                title: COPY.notifications.restaurant.errorTitle,
                description: error.message || COPY.notifications.restaurant.errorDescription,
                variant: "destructive",
            });
        },
    });
    var createVerificationRequestMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!createdRestaurant || verificationDocuments.length === 0) {
                            throw new Error("Restaurant or documents missing");
                        }
                        return [4 /*yield*/, apiRequest("POST", "/api/restaurants/".concat(createdRestaurant.id, "/verification/request"), {
                                documents: verificationDocuments,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: COPY.notifications.verification.successTitle,
                description: COPY.notifications.verification.successDescription,
            });
            setLocation("/subscribe");
        },
        onError: function (error) {
            toast({
                title: COPY.notifications.verification.errorTitle,
                description: error.message || COPY.notifications.verification.errorDescription,
                variant: "destructive",
            });
        },
    });
    var onSubmit = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var acceptTerms, restaurantData, restaurant, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    acceptTerms = data.acceptTerms, restaurantData = __rest(data, ["acceptTerms"]);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, createRestaurantMutation.mutateAsync(restaurantData)];
                case 2:
                    restaurant = _a.sent();
                    // Normal flow continues to verification step
                    setCreatedRestaurant(restaurant);
                    dispatchOnboarding({ type: "GO_TO_VERIFICATION" });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error in restaurant signup:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleRestaurantInvalid = function (errors) {
        var firstError = Object.values(errors)[0];
        toast({
            title: "Check the form",
            description: (firstError === null || firstError === void 0 ? void 0 : firstError.message) || "Please fix the highlighted fields.",
            variant: "destructive",
        });
    };
    var handleVerificationSubmit = function () {
        if (verificationDocuments.length === 0) {
            toast({
                title: COPY.notifications.verification.missingDocsTitle,
                description: COPY.notifications.verification.missingDocsDescription,
                variant: "destructive",
            });
            return;
        }
        createVerificationRequestMutation.mutate();
    };
    var handleSkipVerification = function () {
        toast({
            title: COPY.notifications.verification.skippedTitle,
            description: COPY.notifications.verification.skippedDescription,
        });
        setLocation("/subscribe");
    };
    var handleClaimSearch = function () { return __awaiter(_this, void 0, void 0, function () {
        var query, res, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = claimQuery.trim();
                    if (!query) {
                        setClaimResults([]);
                        setClaimError("");
                        return [2 /*return*/];
                    }
                    setClaimLoading(true);
                    setClaimError("");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, apiRequest("GET", "/api/truck-claims/search?q=".concat(encodeURIComponent(query)))];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    setClaimResults(Array.isArray(data) ? data : []);
                    if (!data || data.length === 0) {
                        setClaimError(COPY.forms.restaurant.claimNoResults);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    setClaimError(error_2.message || COPY.forms.restaurant.claimNoResults);
                    return [3 /*break*/, 6];
                case 5:
                    setClaimLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var applyClaimSelection = function (listing) {
        setClaimSelection(listing);
        setClaimResults([]);
        setClaimQuery(listing.externalId || listing.name || "");
        form.setValue("name", listing.name || "");
        form.setValue("address", listing.address || "");
        form.setValue("city", listing.city || "");
        form.setValue("state", listing.state || "");
        form.setValue("phone", listing.phone || "");
    };
    var onSignup = function (data) {
        signupMutation.mutate(data);
    };
    var onLogin = function (data) {
        loginMutation.mutate(data);
    };
    if (isLoading || (!hostCheckDone && isAuthenticated)) {
        return (<div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"/>
      </div>);
    }
    if (!isAuthenticated) {
        return (<div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <BackHeader title={COPY.unauth.headerTitle} fallbackHref="/" icon={Store} className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"/>

        <div className="px-3 py-3 max-w-4xl mx-auto">
          {/* Compact hero so the form stays above the fold */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center justify-center px-2 py-0.5 mb-1 rounded-full bg-white/70 border border-orange-200 text-[10px] font-medium text-orange-700 uppercase tracking-wide">
              {COPY.unauth.hero.badge}
            </div>
            <div className="w-10 h-10 mb-1 flex items-center justify-center mx-auto rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 shadow-md">
              <Store className="w-5 h-5 text-white"/>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              {COPY.unauth.hero.title}
            </h2>
            <p className="hidden sm:block text-gray-700 text-xs leading-snug max-w-xl mx-auto mb-2">
              {COPY.unauth.hero.subtitle}
            </p>
            {/* Authentication Section */}
            <div className="max-w-md mx-auto" data-signup-section>
              <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <button data-testid="button-signup-toggle" onClick={function () { return setAuthMode("signup"); }} className={"px-4 py-2 rounded-lg font-medium transition-colors ".concat(authMode === "signup"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                      {COPY.unauth.toggles.signup}
                    </button>
                    <button data-testid="button-login-toggle" onClick={function () { return setAuthMode("login"); }} className={"px-4 py-2 rounded-lg font-medium transition-colors ".concat(authMode === "login"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                      {COPY.unauth.toggles.login}
                    </button>
                  </div>

                  {/* Google OAuth Button */}
                  <button data-testid="button-google-signin" onClick={function () {
                return (window.location.href = "/api/auth/google/restaurant");
            }} className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-3 mb-4 shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>{COPY.unauth.oauth.button}</span>
                  </button>

                  <div className="relative mb-4">
                    <hr className="border-gray-200"/>
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-gray-500 text-sm">
                      {COPY.unauth.divider.or}
                    </span>
                  </div>

                  {/* Email/Password Forms */}
                  {authMode === "signup" ? (<Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={signupForm.control} name="firstName" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                                <FormLabel>
                                  {COPY.forms.signup.firstNameLabel}
                                </FormLabel>
                                <FormControl>
                                  <Input data-testid="input-first-name" autoComplete="given-name" placeholder={COPY.forms.signup.firstNamePlaceholder} {...field}/>
                                </FormControl>
                                <FormMessage />
                              </FormItem>);
                }}/>
                          <FormField control={signupForm.control} name="lastName" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                                <FormLabel>
                                  {COPY.forms.signup.lastNameLabel}
                                </FormLabel>
                                <FormControl>
                                  <Input data-testid="input-last-name" autoComplete="family-name" placeholder={COPY.forms.signup.lastNamePlaceholder} {...field}/>
                                </FormControl>
                                <FormMessage />
                              </FormItem>);
                }}/>
                        </div>
                        <FormField control={signupForm.control} name="email" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                              <FormLabel>
                                {COPY.forms.signup.emailLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                  <Input data-testid="input-email" type="email" autoComplete="email" placeholder={COPY.forms.signup.emailPlaceholder} className="pl-10" {...field}/>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                }}/>
                        <FormField control={signupForm.control} name="phone" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                              <FormLabel>
                                {COPY.forms.signup.phoneLabel}
                              </FormLabel>
                              <FormControl>
                                <Input data-testid="input-phone" type="tel" autoComplete="tel" placeholder={COPY.forms.signup.phonePlaceholder} {...field}/>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                }}/>
                        <FormField control={signupForm.control} name="password" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                              <FormLabel>
                                {COPY.forms.signup.passwordLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input data-testid="input-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={COPY.forms.signup.passwordPlaceholder} className="pr-10" {...field}/>
                                  <button type="button" data-testid="button-toggle-password" onClick={function () {
                            return setShowPassword(!showPassword);
                        }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                }}/>
                        <FormField control={signupForm.control} name="confirmPassword" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                              <FormLabel>
                                {COPY.forms.signup.confirmPasswordLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input data-testid="input-confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder={COPY.forms.signup
                            .confirmPasswordPlaceholder} className="pr-10" {...field}/>
                                  <button type="button" data-testid="button-toggle-confirm-password" onClick={function () {
                            return setShowConfirmPassword(!showConfirmPassword);
                        }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showConfirmPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                }}/>
                        <Button data-testid="button-create-account" type="submit" className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" disabled={signupMutation.isPending}>
                          {signupMutation.isPending
                    ? COPY.unauth.signupCta.buttonPending
                    : COPY.unauth.signupCta.buttonIdle}
                        </Button>
                      </form>
                    </Form>) : (<Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <FormField control={loginForm.control} name="email" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                              <FormLabel>
                                {COPY.forms.login.emailLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                  <Input data-testid="input-login-email" type="email" autoComplete="username" placeholder={COPY.forms.login.emailPlaceholder} className="pl-10" {...field}/>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                }}/>
                        <FormField control={loginForm.control} name="password" render={function (_a) {
                    var field = _a.field;
                    return (<FormItem>
                              <FormLabel>
                                {COPY.forms.login.passwordLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input data-testid="input-login-password" type={showLoginPassword ? "text" : "password"} autoComplete="current-password" placeholder={COPY.forms.login.passwordPlaceholder} className="pr-10" {...field}/>
                                  <button type="button" data-testid="button-toggle-login-password" onClick={function () {
                            return setShowLoginPassword(!showLoginPassword);
                        }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showLoginPassword ? (<EyeOff className="w-4 h-4"/>) : (<Eye className="w-4 h-4"/>)}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>);
                }}/>
                        <Button data-testid="button-signin" type="submit" className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" disabled={loginMutation.isPending}>
                          {loginMutation.isPending
                    ? COPY.unauth.loginCta.buttonPending
                    : COPY.unauth.loginCta.buttonIdle}
                        </Button>
                        <div className="text-center mt-4">
                          <Link href="/forgot-password">
                            <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer text-sm" data-testid="link-forgot-password">
                              {COPY.unauth.forgotPassword}
                            </span>
                          </Link>
                        </div>
                      </form>
                    </Form>)}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-2xl mb-4">
                Reach More Customers
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Target hungry customers within walking distance of your
                restaurant when they're actively looking for deals.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Hyper-local targeting
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Peak hunger times
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Mobile-first audience
                </li>
              </ul>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-2xl mb-4">
                Fill Slow Periods
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Boost revenue during off-peak hours with targeted lunch and
                dinner deals that bring customers when you need them most.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Time-based targeting
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Flexible deal scheduling
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Revenue optimization
                </li>
              </ul>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-2xl mb-4">
                Track Performance
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Get detailed analytics on your deal performance and optimize
                your campaigns for maximum ROI and customer acquisition.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Real-time analytics
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Customer insights
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  ROI tracking
                </li>
              </ul>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-3xl p-12 shadow-2xl text-center mb-16">
            <h3 className="font-bold text-gray-900 text-3xl mb-6">
              {COPY.pricing.hero.title}
            </h3>

            {/* Single pricing tier */}
            <div className="max-w-2xl mx-auto">
                <div className="bg-white/70 rounded-2xl p-8 border border-blue-200/30 mb-8">
                  <div className="flex items-center justify-center mb-6">
                    <span className="text-4xl font-semibold text-gray-400 line-through mr-3">
                      {COPY.pricing.hero.originalPrice}
                    </span>
                    <span className="text-6xl font-bold text-blue-600">
                      {COPY.pricing.hero.monthlyPrice}
                    </span>
                    <span className="text-gray-600 text-2xl ml-2">
                      {COPY.pricing.hero.monthlySuffix}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xl mb-6">
                    {COPY.pricing.hero.coreLine}
                  </p>
                </div>

              <h4 className="font-bold text-gray-900 text-xl mb-6">
                {COPY.pricing.hero.everythingIncludedTitle}
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  {COPY.pricing.hero.everythingIncludedBullets
                .slice(0, 4)
                .map(function (item) { return (<div key={item} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </div>); })}
                </div>
                <div className="space-y-3">
                  {COPY.pricing.hero.everythingIncludedBullets
                .slice(4)
                .map(function (item) { return (<div key={item} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </div>); })}
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {COPY.unauth.finalCta.title}
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              {COPY.unauth.finalCta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button onClick={function () {
                var signupSection = document.querySelector("[data-signup-section]");
                if (signupSection) {
                    signupSection.scrollIntoView({ behavior: "smooth" });
                }
            }} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                {COPY.unauth.finalCta.primaryButton}
              </button>
              <button onClick={function () {
                var signupSection = document.querySelector("[data-signup-section]");
                if (signupSection) {
                    signupSection.scrollIntoView({ behavior: "smooth" });
                    // Switch to login mode
                    setAuthMode("login");
                }
            }} className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-800 px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-200">
                {COPY.unauth.finalCta.secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <SEOHead title={COPY.meta.title} description={COPY.meta.description} keywords={COPY.meta.keywords} canonicalUrl={COPY.meta.canonicalUrl}/>
      <BackHeader title={COPY.main.backHeaderTitle} fallbackHref="/" icon={Store} className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"/>

      <div className="px-6 py-12 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl mb-8 flex items-center justify-center mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <svg className="w-16 h-16 text-white relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd"/>
            </svg>
            <div className="absolute -top-2 -left-2 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4" data-testid="text-hero-title">
            {COPY.main.heroTitle}
          </h2>
          <p className="text-gray-600 text-xl leading-relaxed max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            {COPY.main.heroSubtitle}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2" data-testid="text-benefit-local-title">
              {COPY.benefits.compact.local.title}
            </h3>
            <p className="text-gray-600 leading-relaxed" data-testid="text-benefit-local-desc">
              {COPY.benefits.compact.local.desc}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2" data-testid="text-benefit-meals-title">
              {COPY.benefits.compact.allDay.title}
            </h3>
            <p className="text-gray-600 leading-relaxed" data-testid="text-benefit-meals-desc">
              {COPY.benefits.compact.allDay.desc}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2" data-testid="text-benefit-track-title">
              {COPY.benefits.compact.track.title}
            </h3>
            <p className="text-gray-600 leading-relaxed" data-testid="text-benefit-track-desc">
              {COPY.benefits.compact.track.desc}
            </p>
          </div>
        </div>

        {/* Steps Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={"flex items-center space-x-2 ".concat(currentStep === "restaurant" ? "text-red-600" : "text-green-600")}>
              <div className={"w-8 h-8 rounded-full flex items-center justify-center ".concat(currentStep === "restaurant"
            ? "bg-red-100 border-2 border-red-600"
            : "bg-green-100")}>
                {currentStep === "verification" ? (<CheckCircle className="w-5 h-5"/>) : (<span className="font-bold">1</span>)}
              </div>
              <span className="font-medium">{COPY.steps.businessDetails}</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={"flex items-center space-x-2 ".concat(currentStep === "verification"
            ? "text-red-600"
            : "text-gray-400")}>
              <div className={"w-8 h-8 rounded-full flex items-center justify-center ".concat(currentStep === "verification"
            ? "bg-red-100 border-2 border-red-600"
            : "bg-gray-100")}>
                <span className="font-bold">2</span>
              </div>
              <span className="font-medium">
                {COPY.steps.businessVerification}
              </span>
            </div>
          </div>
        </div>

        {/* Restaurant Form */}
        {currentStep === "restaurant" && (<div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, handleRestaurantInvalid)} className="space-y-8">
                <FormField control={form.control} name="name" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-business-name">
                        {COPY.forms.restaurant.nameLabel}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={COPY.forms.restaurant.namePlaceholder} {...field} className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200" data-testid="input-business-name"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>);
            }}/>

                <FormField control={form.control} name="businessType" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-business-type">
                        {COPY.forms.restaurant.businessTypeLabel}
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md" data-testid="select-business-type">
                            <SelectValue placeholder={COPY.forms.restaurant.businessTypePlaceholder}/>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="food_truck">Food Truck</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>);
            }}/>

                {selectedBusinessType === "food_truck" && (<div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {COPY.forms.restaurant.claimTitle}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {COPY.forms.restaurant.claimDescription}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {COPY.forms.restaurant.claimSearchLabel}
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input value={claimQuery} onChange={function (e) { return setClaimQuery(e.target.value); }} placeholder={COPY.forms.restaurant.claimSearchPlaceholder} className="py-3 px-4 text-base border-0 bg-white/80 focus:bg-white focus:ring-2 focus:ring-orange-400/30 rounded-xl shadow-sm focus:shadow-md transition-all duration-200" data-testid="input-claim-search"/>
                        <Button type="button" variant="outline" onClick={handleClaimSearch} disabled={claimLoading} data-testid="button-claim-search">
                          {COPY.forms.restaurant.claimSearchButton}
                        </Button>
                      </div>
                    </div>

                    {claimSelection && (<div className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm">
                        <div className="font-semibold text-gray-900">
                          {COPY.forms.restaurant.claimSelectedLabel}
                        </div>
                        <div className="text-gray-700">
                          {claimSelection.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {claimSelection.address}
                          {claimSelection.city ? ", ".concat(claimSelection.city) : ""}
                          {claimSelection.state
                        ? ", ".concat(claimSelection.state)
                        : ""}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={function () { return setClaimSelection(null); }} data-testid="button-claim-clear">
                          {COPY.forms.restaurant.claimClearButton}
                        </Button>
                      </div>)}

                    {claimResults.length > 0 && !claimSelection && (<div className="space-y-2">
                        {claimResults.map(function (listing) { return (<div key={listing.id} className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {listing.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {listing.address}
                                {listing.city ? ", ".concat(listing.city) : ""}
                                {listing.state ? ", ".concat(listing.state) : ""}
                              </div>
                            </div>
                            <Button type="button" size="sm" onClick={function () { return applyClaimSelection(listing); }} data-testid={"button-claim-select-".concat(listing.id)}>
                              {COPY.forms.restaurant.claimSelectButton}
                            </Button>
                          </div>); })}
                      </div>)}

                    {claimError && (<div className="text-xs text-gray-500">
                        {claimError}
                      </div>)}
                    <div className="text-xs text-gray-500">
                      {COPY.forms.restaurant.claimDisclaimer}
                    </div>
                  </div>)}

                <FormField control={form.control} name="address" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-address">
                        {COPY.forms.restaurant.addressLabel}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={COPY.forms.restaurant.addressPlaceholder} {...field} className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200" data-testid="input-address"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>);
            }}/>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="phone" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                        <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-phone">
                          {COPY.forms.restaurant.phoneLabel}
                        </FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder={COPY.forms.restaurant.phonePlaceholder} {...field} className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200" data-testid="input-phone"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
            }}/>
                  <FormField control={form.control} name="cuisineType" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                        <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-cuisine">
                          {COPY.forms.restaurant.cuisineLabel}
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md" data-testid="select-cuisine">
                              <SelectValue placeholder={COPY.forms.restaurant.cuisinePlaceholder}/>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* American Cuisines */}
                            <SelectItem value="american">American</SelectItem>
                            <SelectItem value="bbq">
                              BBQ & Smokehouse
                            </SelectItem>
                            <SelectItem value="southern">
                              Southern & Soul Food
                            </SelectItem>
                            <SelectItem value="cajun">
                              Cajun & Creole
                            </SelectItem>
                            <SelectItem value="tex-mex">Tex-Mex</SelectItem>
                            <SelectItem value="burgers">
                              Burgers & Fries
                            </SelectItem>
                            <SelectItem value="deli">
                              Deli & Sandwiches
                            </SelectItem>
                            <SelectItem value="wings">
                              Wings & Sports Bar
                            </SelectItem>

                            {/* International Cuisines */}
                            <SelectItem value="italian">Italian</SelectItem>
                            <SelectItem value="pizza">Pizza</SelectItem>
                            <SelectItem value="mexican">Mexican</SelectItem>
                            <SelectItem value="chinese">Chinese</SelectItem>
                            <SelectItem value="japanese">
                              Japanese & Sushi
                            </SelectItem>
                            <SelectItem value="korean">Korean</SelectItem>
                            <SelectItem value="thai">Thai</SelectItem>
                            <SelectItem value="vietnamese">
                              Vietnamese
                            </SelectItem>
                            <SelectItem value="indian">Indian</SelectItem>
                            <SelectItem value="mediterranean">
                              Mediterranean
                            </SelectItem>
                            <SelectItem value="greek">Greek</SelectItem>
                            <SelectItem value="middle-eastern">
                              Middle Eastern
                            </SelectItem>
                            <SelectItem value="french">French</SelectItem>
                            <SelectItem value="german">German</SelectItem>
                            <SelectItem value="british">
                              British & Pub Food
                            </SelectItem>
                            <SelectItem value="spanish">
                              Spanish & Tapas
                            </SelectItem>
                            <SelectItem value="latin-american">
                              Latin American
                            </SelectItem>
                            <SelectItem value="caribbean">Caribbean</SelectItem>
                            <SelectItem value="african">African</SelectItem>
                            <SelectItem value="ethiopian">Ethiopian</SelectItem>
                            <SelectItem value="moroccan">Moroccan</SelectItem>
                            <SelectItem value="turkish">Turkish</SelectItem>
                            <SelectItem value="lebanese">Lebanese</SelectItem>
                            <SelectItem value="persian">Persian</SelectItem>
                            <SelectItem value="russian">Russian</SelectItem>

                            {/* Specialty Categories */}
                            <SelectItem value="seafood">Seafood</SelectItem>
                            <SelectItem value="steakhouse">
                              Steakhouse
                            </SelectItem>
                            <SelectItem value="vegetarian">
                              Vegetarian
                            </SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="organic">
                              Organic & Farm-to-Table
                            </SelectItem>
                            <SelectItem value="gluten-free">
                              Gluten-Free
                            </SelectItem>
                            <SelectItem value="halal">Halal</SelectItem>
                            <SelectItem value="kosher">Kosher</SelectItem>

                            {/* Food Types */}
                            <SelectItem value="fast-casual">
                              Fast Casual
                            </SelectItem>
                            <SelectItem value="fine-dining">
                              Fine Dining
                            </SelectItem>
                            <SelectItem value="casual-dining">
                              Casual Dining
                            </SelectItem>
                            <SelectItem value="food-truck">
                              Food Truck Fusion
                            </SelectItem>
                            <SelectItem value="street-food">
                              Street Food
                            </SelectItem>
                            <SelectItem value="comfort-food">
                              Comfort Food
                            </SelectItem>
                            <SelectItem value="breakfast">
                              Breakfast & Brunch
                            </SelectItem>
                            <SelectItem value="coffee">
                              Coffee & Café
                            </SelectItem>
                            <SelectItem value="bakery">
                              Bakery & Pastries
                            </SelectItem>
                            <SelectItem value="desserts">
                              Desserts & Sweets
                            </SelectItem>
                            <SelectItem value="ice-cream">
                              Ice Cream & Frozen Treats
                            </SelectItem>
                            <SelectItem value="juice-bar">
                              Juice Bar & Smoothies
                            </SelectItem>
                            <SelectItem value="bar">Bar & Cocktails</SelectItem>
                            <SelectItem value="brewery">
                              Brewery & Craft Beer
                            </SelectItem>
                            <SelectItem value="wine-bar">Wine Bar</SelectItem>

                            {/* Trending & Fusion */}
                            <SelectItem value="fusion">
                              Fusion Cuisine
                            </SelectItem>
                            <SelectItem value="gastropub">Gastropub</SelectItem>
                            <SelectItem value="ramen">
                              Ramen & Noodles
                            </SelectItem>
                            <SelectItem value="poke">
                              Poke & Hawaiian
                            </SelectItem>
                            <SelectItem value="boba">
                              Boba Tea & Asian Drinks
                            </SelectItem>
                            <SelectItem value="healthy">
                              Healthy & Bowls
                            </SelectItem>
                            <SelectItem value="keto">
                              Keto & Low-Carb
                            </SelectItem>
                            <SelectItem value="paleo">Paleo</SelectItem>

                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>);
            }}/>
                </div>

                {/* Business Profile Section */}
                <div className="space-y-6 pt-6 border-t border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Business Profile
                    </h3>
                    <p className="text-sm text-gray-600">
                      Help customers find you and understand what makes your
                      business special
                    </p>
                  </div>

                  <FormField control={form.control} name="description" render={function (_a) {
                var _b;
                var field = _a.field;
                return (<FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">
                          About Your Business{" "}
                          <span className="text-sm font-normal text-gray-500">
                            (Optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <textarea placeholder="Tell customers what makes your restaurant unique..." {...field} rows={4} maxLength={500} className="w-full py-3 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 resize-none"/>
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          {((_b = field.value) === null || _b === void 0 ? void 0 : _b.length) || 0}/500 characters
                        </p>
                        <FormMessage />
                      </FormItem>);
            }}/>

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="websiteUrl" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">
                            Website{" "}
                            <span className="text-sm font-normal text-gray-500">
                              (Optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://yourrestaurant.com" {...field} className="py-4 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
            }}/>

                    <FormField control={form.control} name="instagramUrl" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">
                            Instagram{" "}
                            <span className="text-sm font-normal text-gray-500">
                              (Optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://instagram.com/yourrestaurant" {...field} className="py-4 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
            }}/>
                  </div>

                  <FormField control={form.control} name="facebookPageUrl" render={function (_a) {
                var field = _a.field;
                return (<FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">
                          Facebook Business Page{" "}
                          <span className="text-sm font-normal text-gray-500">
                            (Optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://facebook.com/yourrestaurant" {...field} className="py-4 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
            }}/>

                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Amenities
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Select features available at your location
                    </p>
                    <div className="space-y-3">
                      <FormField control={form.control} name="hasParking" render={function (_a) {
                var field = _a.field;
                return (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium text-gray-900 cursor-pointer">
                                Parking Available
                              </FormLabel>
                            </div>
                          </FormItem>);
            }}/>

                      <FormField control={form.control} name="hasWifi" render={function (_a) {
                var field = _a.field;
                return (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium text-gray-900 cursor-pointer">
                                Free Wi-Fi
                              </FormLabel>
                            </div>
                          </FormItem>);
            }}/>

                      <FormField control={form.control} name="hasOutdoorSeating" render={function (_a) {
                var field = _a.field;
                return (<FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium text-gray-900 cursor-pointer">
                                Outdoor Seating
                              </FormLabel>
                            </div>
                          </FormItem>);
            }}/>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Note for Food Trucks & Bars:</strong> You can set
                      operating hours later in your dashboard. We know schedules
                      can be flexible!
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-8 shadow-lg">
                  <h3 className="font-bold text-gray-900 text-xl mb-6" data-testid="text-pricing-title">
                    {COPY.pricing.formCard.title}
                  </h3>

                  {/* Single Plan */}
                  <div className="bg-white rounded-xl p-8 border-2 border-red-500 shadow-lg text-center mb-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                      {COPY.pricing.formCard.badge}
                    </div>
                    <div className="text-5xl font-bold text-red-600 mb-2">
                      <span className="text-gray-400 line-through text-3xl mr-2 align-middle">
                        {COPY.pricing.formCard.originalPrice}
                      </span>
                      {COPY.pricing.formCard.monthlyPrice}
                    </div>
                    <div className="text-lg text-gray-600 mb-4">
                      {COPY.pricing.formCard.monthlySuffix}
                    </div>
                    <div className="text-xl font-semibold text-gray-900 mb-4">
                      {COPY.pricing.formCard.unlimitedTitle}
                    </div>
                    <div className="text-gray-600 text-base">
                      {COPY.pricing.formCard.unlimitedBody}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="bg-white/70 rounded-lg p-6 border border-gray-200/50">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      {COPY.pricing.formCard.everythingIncludedTitle}
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                      {COPY.pricing.formCard.features.map(function (item) { return (<div key={item} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                          </svg>
                          {item}
                        </div>); })}
                    </div>
                  </div>
                </div>


                {/* NORTH STAR: Pricing Lock Notice */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                  <h4 className="font-bold text-orange-900 mb-2 flex items-center">
                    🔒 Price Lock Guarantee
                  </h4>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    I understand businesses joining before{" "}
                    <strong>March 1, 2026</strong> are locked at{" "}
                    <strong>$50 -&gt; $25/month forever</strong>. This price lock applies
                    even if I pause or cancel my subscription.
                  </p>
                </div>

                <FormField control={form.control} name="acceptTerms" render={function (_a) {
                var field = _a.field;
                return (<FormItem className="flex flex-row items-start space-x-4 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1.5" data-testid="checkbox-terms"/>
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-600 leading-relaxed text-base" data-testid="label-terms">
                          {COPY.terms.labelPrefix}{" "}
                          <Link href="/terms-of-service">
                            <span className="text-red-600 font-medium underline hover:text-red-700 cursor-pointer">
                              {COPY.terms.termsText}
                            </span>
                          </Link>{" "}
                          {COPY.terms.andText}{" "}
                          <Link href="/privacy-policy">
                            <span className="text-red-600 font-medium underline hover:text-red-700 cursor-pointer">
                              {COPY.terms.privacyText}
                            </span>
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>);
            }}/>

                <Button type="submit" className="w-full py-4 font-bold text-xl rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" disabled={createRestaurantMutation.isPending} data-testid="button-start-trial">
                  {createRestaurantMutation.isPending
                ? COPY.cta.restaurantSubmit.pending
                : COPY.cta.restaurantSubmit.idle}
                </Button>
              </form>
            </Form>
          </div>)}

        {/* Verification Step */}
        {currentStep === "verification" && createdRestaurant && (<div className="space-y-6">
            {/* Minimal verification header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold uppercase tracking-wide mb-1">
                  Verify business
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  {COPY.verification.title}
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-md">
                  {COPY.verification.intro}
                </p>
              </div>
              <Upload className="w-6 h-6 text-red-500"/>
            </div>

            <Card className="border-dashed border-red-200 bg-red-50/40">
              <CardContent className="pt-4 pb-4">
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-700 ml-1">
                  {COPY.verification.bullets.map(function (item) { return (<li key={item}>{item}</li>); })}
                </ul>
                <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mt-3">
                  {COPY.verification.whyVerify}
                </p>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <DocumentUpload onDocumentsChange={setVerificationDocuments} maxFiles={5} maxFileSize={10 * 1024 * 1024} // 10MB
         acceptedTypes={[
                "image/jpeg",
                "image/jpg",
                "image/png",
                "application/pdf",
            ]}/>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button type="button" variant="outline" onClick={function () {
                return dispatchOnboarding({ type: "BACK_TO_RESTAURANT" });
            }} className="flex items-center space-x-2" data-testid="button-back-to-restaurant">
                <ArrowLeft className="w-4 h-4"/>
                <span>{COPY.verification.backButton}</span>
              </Button>

              <div className="flex flex-col sm:flex-row gap-3">
                {claimSelection ? (<div className="text-xs text-gray-500 flex items-center">
                    {COPY.verification.claimRequiredNote}
                  </div>) : (<Button type="button" variant="outline" onClick={handleSkipVerification} className="text-gray-600 hover:text-gray-800" data-testid="button-skip-verification">
                    {COPY.verification.skipButton}
                  </Button>)}
                <Button onClick={handleVerificationSubmit} disabled={createVerificationRequestMutation.isPending ||
                verificationDocuments.length === 0} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center space-x-2" data-testid="button-submit-verification">
                  {createVerificationRequestMutation.isPending ? (<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>) : (<ArrowRight className="w-4 h-4"/>)}
                  <span>
                    {createVerificationRequestMutation.isPending
                ? COPY.verification.submitPending
                : COPY.verification.submitIdle}
                  </span>
                </Button>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
}
