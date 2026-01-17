import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Eye, EyeOff, CheckCircle, KeyRound } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import SEOHead from "@/components/SEOHead";

const accountSetupSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AccountSetupFormData = z.infer<typeof accountSetupSchema>;

export default function AccountSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);

  // Extract token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    setToken(tokenParam);
  }, []);

  const form = useForm<AccountSetupFormData>({
    resolver: zodResolver(accountSetupSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  // Validate token on mount
  const { data: tokenValidation, isLoading: isValidatingToken, error: tokenError } = useQuery<{
    valid: boolean;
    userEmail?: string;
    firstName?: string;
    lastName?: string;
    error?: string;
  }>({
    queryKey: ['/api/auth/validate-setup-token', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('No token provided');
      }
      const res = await fetch(`/api/auth/validate-setup-token?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Invalid token');
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Pre-fill name fields if available
  useEffect(() => {
    if (tokenValidation?.firstName) {
      form.setValue('firstName', tokenValidation.firstName);
    }
    if (tokenValidation?.lastName) {
      form.setValue('lastName', tokenValidation.lastName);
    }
  }, [tokenValidation, form]);

  const setupMutation = useMutation({
    mutationFn: async (data: AccountSetupFormData) => {
      return await apiRequest('POST', '/api/auth/complete-setup', {
        token,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    },
    onSuccess: () => {
      setSetupComplete(true);
      toast({
        title: "Account Setup Complete! 🎉",
        description: "Your account is ready. You can now log in.",
      });
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to complete account setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountSetupFormData) => {
    setupMutation.mutate(data);
  };

  // Get password strength info
  const password = form.watch("password");
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, text: "", color: "gray" };
    if (password.length < 8) return { level: 1, text: "Too short", color: "red" };
    if (password.length < 10) return { level: 2, text: "Weak", color: "orange" };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password))
      return { level: 3, text: "Good", color: "blue" };
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password))
      return { level: 4, text: "Strong", color: "green" };
    return { level: 2, text: "Weak", color: "orange" };
  };

  const passwordStrength = getPasswordStrength(password);

  // Loading state
  if (!token || isValidatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Validating setup link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid or expired token
  if (tokenError || !tokenValidation?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <SEOHead
          title="Invalid Setup Link - MealScout"
          description="This account setup link is invalid or has expired."
          noIndex={true}
        />
        <BackHeader
          title="Account Setup"
          fallbackHref="/login"
          icon={KeyRound}
          className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Invalid Setup Link</CardTitle>
              <CardDescription>
                This account setup link has expired or has already been used.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Please contact support or request a new setup link.
              </p>
              <Button
                className="w-full"
                onClick={() => setLocation('/login')}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Setup complete state
  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <SEOHead
          title="Setup Complete - MealScout"
          description="Your MealScout account is ready!"
          noIndex={true}
        />
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-center text-green-600">
                Account Setup Complete!
              </CardTitle>
              <CardDescription className="text-center">
                Redirecting you to login...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Main setup form
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <SEOHead
        title="Complete Your Account - MealScout"
        description="Set up your MealScout account password and profile."
        noIndex={true}
      />
      <BackHeader
        title="Complete Your Account"
        fallbackHref="/login"
        icon={KeyRound}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to MealScout! 🎉</CardTitle>
            <CardDescription>
              Complete your profile to get started
              {tokenValidation?.userEmail && (
                <span className="block mt-1 font-medium text-gray-700">
                  {tokenValidation.userEmail}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name (Optional)</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    placeholder="John"
                    disabled={setupMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name (Optional)</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    placeholder="Doe"
                    disabled={setupMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Create Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                    placeholder="At least 8 characters"
                    disabled={setupMutation.isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={setupMutation.isPending}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                        style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...form.register("confirmPassword")}
                    placeholder="Re-enter your password"
                    disabled={setupMutation.isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={setupMutation.isPending}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? "Setting up..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
