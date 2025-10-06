import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BackHeader } from "@/components/back-header";
import { KeyRound, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    setToken(tokenParam);
  }, []);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Validate token on mount
  const { data: tokenValidation, isLoading: isValidatingToken, error: tokenError } = useQuery<{
    valid: boolean;
    error?: string;
  }>({
    queryKey: ['/api/auth/reset-password/validate', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      const response = await fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
      return response.json();
    },
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      if (!token) throw new Error("No token provided");
      return await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password: data.password,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful!",
        description: "Your password has been updated. Please log in with your new password.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Unable to reset password. Please try again or request a new reset link.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  // Get password strength info
  const password = form.watch("password");
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, text: "", color: "gray" };
    if (password.length < 6) return { level: 1, text: "Too short", color: "red" };
    if (password.length < 8) return { level: 2, text: "Weak", color: "orange" };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) 
      return { level: 3, text: "Good", color: "blue" };
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) 
      return { level: 4, text: "Strong", color: "green" };
    return { level: 2, text: "Weak", color: "orange" };
  };

  const passwordStrength = getPasswordStrength(password);

  // Show loading state while validating token
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <BackHeader
          title="Reset Password"
          fallbackHref="/forgot-password"
          icon={KeyRound}
          className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
        />

        <div className="px-6 py-12 max-w-md mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid or missing. Please request a new one.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full" data-testid="button-request-new-link">
                  Request New Reset Link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenError || (tokenValidation && !tokenValidation.valid)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <BackHeader
          title="Reset Password"
          fallbackHref="/forgot-password"
          icon={KeyRound}
          className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
        />

        <div className="px-6 py-12 max-w-md mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Link Expired</h2>
              <p className="text-gray-600 mb-6">
                This password reset link has expired or has already been used. Please request a new one.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full" data-testid="button-request-new-link">
                  Request New Reset Link
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <SEOHead
        title="Reset Password - MealScout | Create New Password"
        description="Create a new password for your MealScout account. Choose a strong, secure password to protect your account and access exclusive food deals."
        keywords="reset password, new password, password change, account security"
        canonicalUrl="https://mealscout.replit.app/reset-password"
        noIndex={true}
      />
      <BackHeader
        title="Reset Password"
        fallbackHref="/forgot-password"
        icon={KeyRound}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-6 py-12 max-w-md mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Create New Password</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <p className="text-gray-600 text-center mb-6">
              Choose a strong password for your account.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="pr-10 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500"
                            disabled={resetPasswordMutation.isPending}
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {password && (
                        <div className="mt-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  passwordStrength.level === 1 ? 'w-1/4 bg-red-500' :
                                  passwordStrength.level === 2 ? 'w-2/4 bg-orange-500' :
                                  passwordStrength.level === 3 ? 'w-3/4 bg-blue-500' :
                                  passwordStrength.level === 4 ? 'w-full bg-green-500' : 'w-0'
                                }`}
                              />
                            </div>
                            <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                              {passwordStrength.text}
                            </span>
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="pr-10 py-3 border-gray-300 focus:border-green-500 focus:ring-green-500"
                            disabled={resetPasswordMutation.isPending}
                            data-testid="input-confirm-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </Form>

            {/* Security tips */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Password Tips:</h4>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>Use at least 8 characters</span>
                </li>
                <li className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>Include uppercase and lowercase letters</span>
                </li>
                <li className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>Add numbers and special characters</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}