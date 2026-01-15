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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Mail,
  Eye,
  EyeOff,
  CheckCircle,
  Upload,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import DocumentUpload from "@/components/document-upload";
import { BackHeader } from "@/components/back-header";
import { Store } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";
import { HOST_ONBOARDING_COPY as COPY } from "@/copy/hostOnboarding.copy";

/**
 * Host Onboarding v1  COPY LOCK
 * User-facing strings must come from HOST_ONBOARDING_COPY.
 * No inline labels, helper text, or validation messages.
 */

const restaurantSchema = z.object({
  name: z.string().min(1, COPY.validation.restaurant.nameRequired),
  address: z.string().min(1, COPY.validation.restaurant.addressRequired),
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
  promoCode: z.string().optional(),
  acceptTerms: z
    .boolean()
    .refine(
      (val) => val === true,
      COPY.validation.restaurant.acceptTermsRequired
    ),
});

const signupSchema = z
  .object({
    email: z.string().email(COPY.validation.signup.emailInvalid),
    firstName: z.string().min(1, COPY.validation.signup.firstNameRequired),
    lastName: z.string().min(1, COPY.validation.signup.lastNameRequired),
    phone: z.string().min(10, COPY.validation.signup.phoneInvalid),
    password: z.string().min(6, COPY.validation.signup.passwordTooShort),
    confirmPassword: z
      .string()
      .min(1, COPY.validation.signup.confirmPasswordRequired),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: COPY.validation.signup.passwordsMismatch,
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email(COPY.validation.login.emailInvalid),
  password: z.string().min(1, COPY.validation.login.passwordRequired),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

type HostOnboardingStep = "restaurant" | "verification";

interface HostOnboardingState {
  step: HostOnboardingStep;
}

type HostOnboardingEvent =
  | { type: "GO_TO_VERIFICATION" }
  | { type: "BACK_TO_RESTAURANT" };

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

function hostOnboardingTransition(
  state: HostOnboardingState,
  event: HostOnboardingEvent
): HostOnboardingState {
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
      return assertNever(state as never);
  }
}

export default function RestaurantSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");

  // Admin and staff should not use this form - redirect them
  if (
    isAuthenticated &&
    user &&
    (user.userType === "admin" ||
      user.userType === "super_admin" ||
      user.userType === "staff")
  ) {
    setLocation("/restaurant-owner-dashboard");
    return null;
  }
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [onboardingState, dispatchOnboarding] = useReducer(
    hostOnboardingTransition,
    {
      step: "restaurant",
    } as HostOnboardingState
  );
  const [createdRestaurant, setCreatedRestaurant] = useState<any>(null);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>(
    []
  );
  const currentStep: HostOnboardingStep = onboardingState.step;

  const RESTAURANT_DRAFT_KEY = "mealscout:restaurant-signup-draft";

  const restaurantDefaultValues = useMemo<RestaurantFormData>(() => {
    const base: RestaurantFormData = {
      name: "",
      address: "",
      phone: "",
      businessType: "restaurant",
      cuisineType: "",
      description: "",
      websiteUrl: "",
      instagramUrl: "",
      facebookPageUrl: "",
      hasParking: false,
      hasWifi: false,
      hasOutdoorSeating: false,
      promoCode: "",
      acceptTerms: false,
    };

    if (typeof window === "undefined") return base;

    try {
      const stored = window.localStorage.getItem(RESTAURANT_DRAFT_KEY);
      if (!stored) return base;
      const parsed = JSON.parse(stored) as Partial<RestaurantFormData>;
      return { ...base, ...parsed };
    } catch {
      return base;
    }
  }, []);

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: restaurantDefaultValues,
  });

  const signupForm = useForm<SignupFormData>({
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

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Persist restaurant business details so owners can resume onboarding
  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        window.localStorage.setItem(
          RESTAURANT_DRAFT_KEY,
          JSON.stringify(value)
        );
      } catch {
        // ignore storage errors
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...signupData } = data;
      return await apiRequest(
        "POST",
        "/api/auth/restaurant/register",
        signupData
      );
    },
    onSuccess: () => {
      toast({
        title: COPY.notifications.signup.successTitle,
        description: COPY.notifications.signup.successDescription,
      });
      // Reload to update auth state
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: COPY.notifications.signup.errorTitle,
        description:
          error.message || COPY.notifications.signup.errorDescription,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return await apiRequest("POST", "/api/auth/restaurant/login", data);
    },
    onSuccess: () => {
      toast({
        title: COPY.notifications.login.successTitle,
        description: COPY.notifications.login.successDescription,
      });
      // Reload to update auth state
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: COPY.notifications.login.errorTitle,
        description: error.message || COPY.notifications.login.errorDescription,
        variant: "destructive",
      });
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: Omit<RestaurantFormData, "acceptTerms">) => {
      // Check if user is already authenticated
      if (isAuthenticated && user) {
        // For authenticated users, use existing user data
        const requestData = {
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
            promoCode: data.promoCode,
          },
          subscriptionPlan: "month",
        };
        return await apiRequest("POST", "/api/restaurants/signup", requestData);
      } else {
        // For new registrations, get user data from signup form
        const signupData = signupForm.getValues();

        const requestData = {
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
            promoCode: data.promoCode,
          },
          subscriptionPlan: "month",
        };
        return await apiRequest("POST", "/api/restaurants/signup", requestData);
      }
    },
    onSuccess: (restaurant) => {
      setCreatedRestaurant(restaurant);
      dispatchOnboarding({ type: "GO_TO_VERIFICATION" });
      toast({
        title: COPY.notifications.restaurant.successTitle,
        description: COPY.notifications.restaurant.successDescription,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: COPY.notifications.restaurant.unauthorizedTitle,
          description:
            error.message ||
            COPY.notifications.restaurant.unauthorizedDescription,
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth/google/restaurant";
        }, 500);
        return;
      }
      toast({
        title: COPY.notifications.restaurant.errorTitle,
        description:
          error.message || COPY.notifications.restaurant.errorDescription,
        variant: "destructive",
      });
    },
  });

  const createVerificationRequestMutation = useMutation({
    mutationFn: async () => {
      if (!createdRestaurant || verificationDocuments.length === 0) {
        throw new Error("Restaurant or documents missing");
      }
      return await apiRequest(
        "POST",
        `/api/restaurants/${createdRestaurant.id}/verification/request`,
        {
          documents: verificationDocuments,
        }
      );
    },
    onSuccess: () => {
      toast({
        title: COPY.notifications.verification.successTitle,
        description: COPY.notifications.verification.successDescription,
      });
      setLocation("/subscribe");
    },
    onError: (error) => {
      toast({
        title: COPY.notifications.verification.errorTitle,
        description:
          error.message || COPY.notifications.verification.errorDescription,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RestaurantFormData) => {
    const { acceptTerms, promoCode, ...restaurantData } = data;

    try {
      // Create restaurant first
      const restaurant = await createRestaurantMutation.mutateAsync(
        restaurantData
      );

      // If promo code is provided, create subscription with promo code
      if (promoCode) {
        const subscriptionData = {
          billingInterval: "month",
          promoCode: promoCode.toUpperCase(),
        };

        const response = await apiRequest(
          "POST",
          "/api/create-subscription",
          subscriptionData
        );
        const result = await response.json();

        if (result.betaAccess) {
          toast({
            title: COPY.notifications.betaAccess.title,
            description: COPY.notifications.betaAccess.description,
          });
          setLocation("/deal-creation");
          return;
        }
      }

      // Normal flow continues to verification step
      setCreatedRestaurant(restaurant);
      dispatchOnboarding({ type: "GO_TO_VERIFICATION" });
    } catch (error: any) {
      console.error("Error in restaurant signup:", error);
      // Error handling is already done in the mutation
    }
  };

  const handleVerificationSubmit = () => {
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

  const handleSkipVerification = () => {
    toast({
      title: COPY.notifications.verification.skippedTitle,
      description: COPY.notifications.verification.skippedDescription,
    });
    setLocation("/subscribe");
  };

  const onSignup = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <BackHeader
          title={COPY.unauth.headerTitle}
          fallbackHref="/"
          icon={Store}
          className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
        />

        <div className="px-4 py-4 max-w-4xl mx-auto">
          {/* Hero Section - Step 2 of the same system */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center px-2 py-1 mb-2 rounded-full bg-white/70 border border-orange-200 text-[10px] font-medium text-orange-700 uppercase tracking-wide">
              {COPY.unauth.hero.badge}
            </div>
            <div className="w-12 h-12 mb-2 flex items-center justify-center mx-auto rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 shadow-md">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {COPY.unauth.hero.title}
            </h2>
            <p className="text-gray-700 text-xs leading-snug max-w-xl mx-auto mb-3">
              {COPY.unauth.hero.subtitle}
            </p>
            {/* Authentication Section */}
            <div className="max-w-md mx-auto" data-signup-section>
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <button
                      data-testid="button-signup-toggle"
                      onClick={() => setAuthMode("signup")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        authMode === "signup"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {COPY.unauth.toggles.signup}
                    </button>
                    <button
                      data-testid="button-login-toggle"
                      onClick={() => setAuthMode("login")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        authMode === "login"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {COPY.unauth.toggles.login}
                    </button>
                  </div>

                  {/* Google OAuth Button */}
                  <button
                    data-testid="button-google-signin"
                    onClick={() =>
                      (window.location.href = "/api/auth/google/restaurant")
                    }
                    className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-3 mb-4 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285f4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34a853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#fbbc05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#ea4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>{COPY.unauth.oauth.button}</span>
                  </button>

                  <div className="relative mb-4">
                    <hr className="border-gray-200" />
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-gray-500 text-sm">
                      {COPY.unauth.divider.or}
                    </span>
                  </div>

                  {/* Email/Password Forms */}
                  {authMode === "signup" ? (
                    <Form {...signupForm}>
                      <form
                        onSubmit={signupForm.handleSubmit(onSignup)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={signupForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {COPY.forms.signup.firstNameLabel}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    data-testid="input-first-name"
                                    autoComplete="given-name"
                                    placeholder={
                                      COPY.forms.signup.firstNamePlaceholder
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={signupForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {COPY.forms.signup.lastNameLabel}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    data-testid="input-last-name"
                                    autoComplete="family-name"
                                    placeholder={
                                      COPY.forms.signup.lastNamePlaceholder
                                    }
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={signupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {COPY.forms.signup.emailLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                  <Input
                                    data-testid="input-email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder={
                                      COPY.forms.signup.emailPlaceholder
                                    }
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {COPY.forms.signup.phoneLabel}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  data-testid="input-phone"
                                  type="tel"
                                  autoComplete="tel"
                                  placeholder={
                                    COPY.forms.signup.phonePlaceholder
                                  }
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {COPY.forms.signup.passwordLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    data-testid="input-password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder={
                                      COPY.forms.signup.passwordPlaceholder
                                    }
                                    className="pr-10"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    data-testid="button-toggle-password"
                                    onClick={() =>
                                      setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {COPY.forms.signup.confirmPasswordLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    data-testid="input-confirm-password"
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
                                    autoComplete="new-password"
                                    placeholder={
                                      COPY.forms.signup
                                        .confirmPasswordPlaceholder
                                    }
                                    className="pr-10"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    data-testid="button-toggle-confirm-password"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword
                                      )
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          data-testid="button-create-account"
                          type="submit"
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          disabled={signupMutation.isPending}
                        >
                          {signupMutation.isPending
                            ? COPY.unauth.signupCta.buttonPending
                            : COPY.unauth.signupCta.buttonIdle}
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(onLogin)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {COPY.forms.login.emailLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                  <Input
                                    data-testid="input-login-email"
                                    type="email"
                                    autoComplete="username"
                                    placeholder={
                                      COPY.forms.login.emailPlaceholder
                                    }
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {COPY.forms.login.passwordLabel}
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    data-testid="input-login-password"
                                    type={
                                      showLoginPassword ? "text" : "password"
                                    }
                                    autoComplete="current-password"
                                    placeholder={
                                      COPY.forms.login.passwordPlaceholder
                                    }
                                    className="pr-10"
                                    {...field}
                                  />
                                  <button
                                    type="button"
                                    data-testid="button-toggle-login-password"
                                    onClick={() =>
                                      setShowLoginPassword(!showLoginPassword)
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showLoginPassword ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          data-testid="button-signin"
                          type="submit"
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending
                            ? COPY.unauth.loginCta.buttonPending
                            : COPY.unauth.loginCta.buttonIdle}
                        </Button>
                        <div className="text-center mt-4">
                          <Link href="/forgot-password">
                            <span
                              className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer text-sm"
                              data-testid="link-forgot-password"
                            >
                              {COPY.unauth.forgotPassword}
                            </span>
                          </Link>
                        </div>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
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
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Hyper-local targeting
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Peak hunger times
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Mobile-first audience
                </li>
              </ul>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
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
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Time-based targeting
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Flexible deal scheduling
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Revenue optimization
                </li>
              </ul>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
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
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Real-time analytics
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Customer insights
                </li>
                <li className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
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

                {/* Special offers */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-700 font-semibold">
                      {COPY.pricing.hero.offerThreeMonths}
                    </p>
                    <p className="text-green-600 text-sm">
                      {COPY.pricing.hero.offerThreeMonthsNote}
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-purple-700 font-semibold">
                      {COPY.pricing.hero.yearlyPrice}
                    </p>
                    <p className="text-purple-600 text-sm">
                      {COPY.pricing.hero.yearlyNote}
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 text-xl mb-6">
                {COPY.pricing.hero.everythingIncludedTitle}
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  {COPY.pricing.hero.everythingIncludedBullets
                    .slice(0, 4)
                    .map((item) => (
                      <div key={item} className="flex items-center">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                </div>
                <div className="space-y-3">
                  {COPY.pricing.hero.everythingIncludedBullets
                    .slice(4)
                    .map((item) => (
                      <div key={item} className="flex items-center">
                        <svg
                          className="w-5 h-5 text-green-500 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
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
              <button
                onClick={() => {
                  const signupSection = document.querySelector(
                    "[data-signup-section]"
                  );
                  if (signupSection) {
                    signupSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                {COPY.unauth.finalCta.primaryButton}
              </button>
              <button
                onClick={() => {
                  const signupSection = document.querySelector(
                    "[data-signup-section]"
                  );
                  if (signupSection) {
                    signupSection.scrollIntoView({ behavior: "smooth" });
                    // Switch to login mode
                    setAuthMode("login");
                  }
                }}
                className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-800 px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-200"
              >
                {COPY.unauth.finalCta.secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <SEOHead
        title={COPY.meta.title}
        description={COPY.meta.description}
        keywords={COPY.meta.keywords}
        canonicalUrl={COPY.meta.canonicalUrl}
      />
      <BackHeader
        title={COPY.main.backHeaderTitle}
        fallbackHref="/"
        icon={Store}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-6 py-12 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl mb-8 flex items-center justify-center mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <svg
              className="w-16 h-16 text-white relative z-10 drop-shadow-lg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z"
                clipRule="evenodd"
              />
            </svg>
            <div className="absolute -top-2 -left-2 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
          </div>
          <h2
            className="text-4xl font-bold text-gray-900 mb-4"
            data-testid="text-hero-title"
          >
            {COPY.main.heroTitle}
          </h2>
          <p
            className="text-gray-600 text-xl leading-relaxed max-w-2xl mx-auto"
            data-testid="text-hero-subtitle"
          >
            {COPY.main.heroSubtitle}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3
              className="font-bold text-gray-900 text-lg mb-2"
              data-testid="text-benefit-local-title"
            >
              {COPY.benefits.compact.local.title}
            </h3>
            <p
              className="text-gray-600 leading-relaxed"
              data-testid="text-benefit-local-desc"
            >
              {COPY.benefits.compact.local.desc}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3
              className="font-bold text-gray-900 text-lg mb-2"
              data-testid="text-benefit-meals-title"
            >
              {COPY.benefits.compact.allDay.title}
            </h3>
            <p
              className="text-gray-600 leading-relaxed"
              data-testid="text-benefit-meals-desc"
            >
              {COPY.benefits.compact.allDay.desc}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3
              className="font-bold text-gray-900 text-lg mb-2"
              data-testid="text-benefit-track-title"
            >
              {COPY.benefits.compact.track.title}
            </h3>
            <p
              className="text-gray-600 leading-relaxed"
              data-testid="text-benefit-track-desc"
            >
              {COPY.benefits.compact.track.desc}
            </p>
          </div>
        </div>

        {/* Steps Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div
              className={`flex items-center space-x-2 ${
                currentStep === "restaurant" ? "text-red-600" : "text-green-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "restaurant"
                    ? "bg-red-100 border-2 border-red-600"
                    : "bg-green-100"
                }`}
              >
                {currentStep === "verification" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="font-bold">1</span>
                )}
              </div>
              <span className="font-medium">{COPY.steps.businessDetails}</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${
                currentStep === "verification"
                  ? "text-red-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === "verification"
                    ? "bg-red-100 border-2 border-red-600"
                    : "bg-gray-100"
                }`}
              >
                <span className="font-bold">2</span>
              </div>
              <span className="font-medium">
                {COPY.steps.businessVerification}
              </span>
            </div>
          </div>
        </div>

        {/* Restaurant Form */}
        {currentStep === "restaurant" && (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-lg font-semibold text-gray-900"
                        data-testid="label-business-name"
                      >
                        {COPY.forms.restaurant.nameLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={COPY.forms.restaurant.namePlaceholder}
                          {...field}
                          className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-lg font-semibold text-gray-900"
                        data-testid="label-business-type"
                      >
                        {COPY.forms.restaurant.businessTypeLabel}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md"
                            data-testid="select-business-type"
                          >
                            <SelectValue
                              placeholder={
                                COPY.forms.restaurant.businessTypePlaceholder
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="food_truck">Food Truck</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-lg font-semibold text-gray-900"
                        data-testid="label-address"
                      >
                        {COPY.forms.restaurant.addressLabel}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={COPY.forms.restaurant.addressPlaceholder}
                          {...field}
                          className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-lg font-semibold text-gray-900"
                          data-testid="label-phone"
                        >
                          {COPY.forms.restaurant.phoneLabel}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder={COPY.forms.restaurant.phonePlaceholder}
                            {...field}
                            className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cuisineType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel
                          className="text-lg font-semibold text-gray-900"
                          data-testid="label-cuisine"
                        >
                          {COPY.forms.restaurant.cuisineLabel}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md"
                              data-testid="select-cuisine"
                            >
                              <SelectValue
                                placeholder={
                                  COPY.forms.restaurant.cuisinePlaceholder
                                }
                              />
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
                      </FormItem>
                    )}
                  />
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">
                          About Your Business{" "}
                          <span className="text-sm font-normal text-gray-500">
                            (Optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Tell customers what makes your restaurant unique..."
                            {...field}
                            rows={4}
                            maxLength={500}
                            className="w-full py-3 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 resize-none"
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          {field.value?.length || 0}/500 characters
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">
                            Website{" "}
                            <span className="text-sm font-normal text-gray-500">
                              (Optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://yourrestaurant.com"
                              {...field}
                              className="py-4 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instagramUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold text-gray-900">
                            Instagram{" "}
                            <span className="text-sm font-normal text-gray-500">
                              (Optional)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://instagram.com/yourrestaurant"
                              {...field}
                              className="py-4 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="facebookPageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-gray-900">
                          Facebook Business Page{" "}
                          <span className="text-sm font-normal text-gray-500">
                            (Optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://facebook.com/yourrestaurant"
                            {...field}
                            className="py-4 px-4 text-base border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Amenities
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Select features available at your location
                    </p>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="hasParking"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium text-gray-900 cursor-pointer">
                                Parking Available
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hasWifi"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium text-gray-900 cursor-pointer">
                                Free Wi-Fi
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hasOutdoorSeating"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-gray-200 p-4 bg-white/50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex-1">
                              <FormLabel className="text-base font-medium text-gray-900 cursor-pointer">
                                Outdoor Seating
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
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
                  <h3
                    className="font-bold text-gray-900 text-xl mb-6"
                    data-testid="text-pricing-title"
                  >
                    {COPY.pricing.formCard.title}
                  </h3>

                  {/* Single Plan */}
                  <div className="bg-white rounded-xl p-8 border-2 border-red-500 shadow-lg text-center mb-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                      {COPY.pricing.formCard.badge}
                    </div>
                    <div className="text-5xl font-bold text-red-600 mb-2">
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
                      {COPY.pricing.formCard.features.map((item) => (
                        <div key={item} className="flex items-center">
                          <svg
                            className="w-4 h-4 text-green-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Promo Code Field */}
                <FormField
                  control={form.control}
                  name="promoCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-lg font-semibold text-gray-900"
                        data-testid="label-promo-code"
                      >
                        {COPY.forms.restaurant.promoLabel}{" "}
                        <span className="text-sm font-normal text-gray-500">
                          {COPY.forms.restaurant.promoOptionalSuffix}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={COPY.promo.helperText}
                          {...field}
                          className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 uppercase"
                          data-testid="input-promo-code"
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500 mt-1">
                        {COPY.promo.betaNote}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* NORTH STAR: Pricing Lock Notice */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                  <h4 className="font-bold text-orange-900 mb-2 flex items-center">
                    🔒 Price Lock Guarantee
                  </h4>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    I understand businesses joining before{" "}
                    <strong>March 1, 2026</strong> are locked at{" "}
                    <strong>$25/month forever</strong>. This price lock applies
                    even if I pause or cancel my subscription.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-4 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1.5"
                          data-testid="checkbox-terms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel
                          className="text-gray-600 leading-relaxed text-base"
                          data-testid="label-terms"
                        >
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
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-4 font-bold text-xl rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  disabled={createRestaurantMutation.isPending}
                  data-testid="button-start-trial"
                >
                  {createRestaurantMutation.isPending
                    ? COPY.cta.restaurantSubmit.pending
                    : COPY.cta.restaurantSubmit.idle}
                </Button>
              </form>
            </Form>
          </div>
        )}

        {/* Verification Step */}
        {currentStep === "verification" && createdRestaurant && (
          <div className="space-y-8">
            {/* Verification Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-2xl">
                  <Upload className="w-7 h-7 text-red-600" />
                  <span>{COPY.verification.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-lg text-gray-700">
                    {COPY.verification.intro}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    {COPY.verification.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 text-sm">
                      {COPY.verification.whyVerify}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <DocumentUpload
              onDocumentsChange={setVerificationDocuments}
              maxFiles={5}
              maxFileSize={10 * 1024 * 1024} // 10MB
              acceptedTypes={[
                "image/jpeg",
                "image/jpg",
                "image/png",
                "application/pdf",
              ]}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  dispatchOnboarding({ type: "BACK_TO_RESTAURANT" })
                }
                className="flex items-center space-x-2"
                data-testid="button-back-to-restaurant"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{COPY.verification.backButton}</span>
              </Button>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipVerification}
                  className="text-gray-600 hover:text-gray-800"
                  data-testid="button-skip-verification"
                >
                  {COPY.verification.skipButton}
                </Button>
                <Button
                  onClick={handleVerificationSubmit}
                  disabled={
                    createVerificationRequestMutation.isPending ||
                    verificationDocuments.length === 0
                  }
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center space-x-2"
                  data-testid="button-submit-verification"
                >
                  {createVerificationRequestMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>
                    {createVerificationRequestMutation.isPending
                      ? COPY.verification.submitPending
                      : COPY.verification.submitIdle}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
