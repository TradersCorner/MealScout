import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Eye, EyeOff, UserPlus, ArrowLeft } from "lucide-react";
import { BackHeader } from "@/components/back-header";
import { SEOHead } from "@/components/seo-head";

const signupSchema = z
  .object({
    email: z.string().email("Valid email is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z
      .string()
      .optional()
      .refine((phone) => {
        if (!phone || phone.trim() === "") return true;
        return phone.length >= 10;
      }, "Phone number must be at least 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function CustomerSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const role = searchParams.get("role");
  const initialAccountType: "diner" | "host" | "business" =
    role === "business" ? "business" : role === "host" ? "host" : "diner";
  const [accountType, setAccountType] = useState<"diner" | "host" | "business">(
    initialAccountType
  );

  const form = useForm<SignupFormData>({
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

  const customerSignupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...signupData } = data;
      // Remove phone if empty
      if (!signupData.phone?.trim()) {
        delete signupData.phone;
      }
      return await apiRequest(
        "POST",
        "/api/auth/customer/register",
        signupData
      );
    },
    onSuccess: () => {
      toast({
        title: "Welcome to MealScout!",
        description: "Account created successfully. You're now logged in!",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const businessSignupMutation = useMutation({
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
        title: "Welcome to MealScout for Business!",
        description:
          "Account created successfully. Let's finish setting up your restaurant.",
      });
      setLocation("/restaurant-signup");
    },
    onError: (error) => {
      toast({
        title: "Business signup failed",
        description: error.message || "Failed to create business account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    if (accountType === "business") {
      const digitsOnly = (data.phone || "").replace(/\D/g, "");
      if (!digitsOnly || digitsOnly.length < 10) {
        form.setError("phone", {
          type: "manual",
          message: "Valid phone number is required for business accounts",
        });
        return;
      }
      businessSignupMutation.mutate(data);
    } else if (accountType === "host") {
      // Hosts signup as customers but we can add host-specific flow later
      customerSignupMutation.mutate(data);
    } else {
      customerSignupMutation.mutate(data);
    }
  };

  const isSubmitting =
    customerSignupMutation.isPending || businessSignupMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex flex-col">
      <SEOHead
        title="Sign Up - MealScout | Create Free Account"
        description="Join MealScout for free and start discovering exclusive food deals from local restaurants. Save your favorites, track deals, and never miss amazing dining discounts."
        keywords="sign up, create account, register, join mealscout, free account, food deals signup"
        canonicalUrl="https://mealscout.us/customer-signup"
        noIndex={true}
      />
      <BackHeader
        title="Create Account"
        fallbackHref="/"
        icon={UserPlus}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <main className="flex-1 px-4 py-2 max-w-md mx-auto flex flex-col justify-between">
        {/* Top: hero + form */}
        <div>
          {/* Welcome Section (highly compressed) */}
          <div className="text-center mb-2">
            <div className="inline-flex mb-2 rounded-full bg-white/80 border border-gray-200 shadow-sm text-[11px] font-medium text-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setAccountType("diner")}
                className={`px-3 py-1 transition-colors ${
                  accountType === "diner"
                    ? "bg-orange-500 text-white"
                    : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              >
                Diner
              </button>
              <button
                type="button"
                onClick={() => setAccountType("host")}
                className={`px-3 py-1 border-l border-gray-200 transition-colors ${
                  accountType === "host"
                    ? "bg-orange-500 text-white"
                    : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              >
                Host / Event Organizer
              </button>
              <button
                type="button"
                onClick={() => setAccountType("business")}
                className={`px-3 py-1 border-l border-gray-200 transition-colors ${
                  accountType === "business"
                    ? "bg-orange-500 text-white"
                    : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              >
                Restaurant / Food Truck
              </button>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-2xl mb-1 flex items-center justify-center mx-auto shadow-md ring-2 ring-white/70">
              <UserPlus className="w-5 h-5 text-white drop-shadow" />
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
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-first-name"
                            autoComplete="given-name"
                            placeholder="John"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-last-name"
                            autoComplete="family-name"
                            placeholder="Doe"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            data-testid="input-email"
                            type="email"
                            autoComplete="email"
                            placeholder="john@example.com"
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
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="(555) 123-4567"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            data-testid="input-password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Enter password"
                            {...field}
                          />
                          <button
                            data-testid="button-toggle-password"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
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
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            data-testid="input-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            {...field}
                          />
                          <button
                            data-testid="button-toggle-confirm-password"
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
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
                  disabled={isSubmitting}
                  className="w-full py-3 font-semibold text-base rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <div className="animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : null}
                  Create Account
                </Button>
              </form>
            </Form>

            {/* Divider + Login Link (compressed) */}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
              <span>Already have an account?</span>
              <Link href="/login">
                <button
                  type="button"
                  className="text-blue-600 underline hover:text-blue-700"
                  data-testid="button-sign-in"
                >
                  Sign in
                </button>
              </Link>
            </div>

            {/* Trust indicators (compressed) */}
            <div className="mt-3 border-t border-gray-200 pt-2 flex items-center justify-center gap-4 text-[11px] leading-tight text-gray-500">
              <div className="flex items-center space-x-1">
                <svg
                  className="w-3 h-3 text-green-500"
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
                <span>
                  {accountType === "business"
                    ? "Transparent pricing"
                    : "Local restaurants & trucks"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <svg
                  className="w-3 h-3 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>
                  {accountType === "business"
                    ? "You control every discount"
                    : "Secure"}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <svg
                  className="w-3 h-3 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
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
    </div>
  );
}
