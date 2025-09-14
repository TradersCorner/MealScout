import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Eye, EyeOff, CheckCircle, Upload, ArrowLeft, ArrowRight } from "lucide-react";
import DocumentUpload from "@/components/document-upload";
import { BackHeader } from "@/components/back-header";
import { Store } from "lucide-react";

const restaurantSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  businessType: z.enum(["restaurant", "bar", "food_truck"], {
    required_error: "Please select your business type",
  }),
  cuisineType: z.string().min(1, "Cuisine type is required"),
  promoCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms"),
});

const signupSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

export default function RestaurantSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<'restaurant' | 'verification'>('restaurant');
  const [createdRestaurant, setCreatedRestaurant] = useState<any>(null);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [billingInterval, setBillingInterval] = useState<'month' | '3-month' | 'year'>('month');

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      businessType: "restaurant",
      cuisineType: "",
      promoCode: "",
      acceptTerms: false,
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
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

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...signupData } = data;
      return await apiRequest("POST", "/api/auth/restaurant/register", signupData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Account created successfully!",
      });
      // Reload to update auth state
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
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
        title: "Success!",
        description: "Logged in successfully!",
      });
      // Reload to update auth state
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: Omit<RestaurantFormData, 'acceptTerms'>) => {
      return await apiRequest("POST", "/api/restaurants", data);
    },
    onSuccess: (restaurant) => {
      setCreatedRestaurant(restaurant);
      setCurrentStep('verification');
      toast({
        title: "Restaurant Registered!",
        description: "Now let's verify your business to build trust with customers.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/auth/google/restaurant";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to register restaurant",
        variant: "destructive",
      });
    },
  });

  const createVerificationRequestMutation = useMutation({
    mutationFn: async () => {
      if (!createdRestaurant || verificationDocuments.length === 0) {
        throw new Error("Restaurant or documents missing");
      }
      return await apiRequest("POST", `/api/restaurants/${createdRestaurant.id}/verification/request`, {
        documents: verificationDocuments,
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Submitted!",
        description: "Your documents have been submitted for review. You'll be notified of the decision.",
      });
      setLocation("/subscribe");
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: RestaurantFormData) => {
    const { acceptTerms, promoCode, ...restaurantData } = data;
    
    try {
      // Create restaurant first
      const restaurant = await createRestaurantMutation.mutateAsync(restaurantData);
      
      // If promo code is provided, create subscription with promo code
      if (promoCode) {
        const subscriptionData = { 
          billingInterval, 
          promoCode: promoCode.toUpperCase() 
        };
        
        const response = await apiRequest("POST", "/api/create-subscription", subscriptionData);
        const result = await response.json();
        
        if (result.betaAccess) {
          toast({
            title: "Beta Access Granted!",
            description: "You can now create deals without payment during beta testing.",
          });
          setLocation("/deal-creation");
          return;
        }
      }
      
      // Normal flow continues to verification step
      setCreatedRestaurant(restaurant);
      setCurrentStep('verification');
    } catch (error: any) {
      console.error("Error in restaurant signup:", error);
      // Error handling is already done in the mutation
    }
  };

  const handleVerificationSubmit = () => {
    if (verificationDocuments.length === 0) {
      toast({
        title: "Documents Required",
        description: "Please upload at least one business document for verification.",
        variant: "destructive",
      });
      return;
    }
    createVerificationRequestMutation.mutate();
  };

  const handleSkipVerification = () => {
    toast({
      title: "Verification Skipped",
      description: "You can submit verification documents later from your dashboard.",
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
          title="MealScout for Businesses"
          fallbackHref="/"
          icon={Store}
          className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
        />

        <div className="px-6 py-12 max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-48 h-48 mb-8 flex items-center justify-center mx-auto">
              <img 
                src="/attached_assets/541254193_1828025567749501_7985847689970469117_n_1757207057307.jpg" 
                alt="MealScout Logo" 
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Boost Your Business Revenue</h2>
            <p className="text-gray-600 text-xl leading-relaxed max-w-3xl mx-auto mb-8">
              Join MealScout's advertising platform and connect with hungry customers actively looking for deals in your neighborhood. Increase foot traffic, fill slow periods, and grow your business.
            </p>
            {/* Authentication Section */}
            <div className="max-w-md mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <button
                      data-testid="button-signup-toggle"
                      onClick={() => setAuthMode('signup')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        authMode === 'signup' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Create Account
                    </button>
                    <button
                      data-testid="button-login-toggle"
                      onClick={() => setAuthMode('login')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        authMode === 'login' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Sign In
                    </button>
                  </div>

                  {/* Google OAuth Button */}
                  <button 
                    data-testid="button-google-signin"
                    onClick={() => window.location.href = "/api/auth/google/restaurant"}
                    className="w-full bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-3 mb-4 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative mb-4">
                    <hr className="border-gray-200" />
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-gray-500 text-sm">
                      or
                    </span>
                  </div>

                  {/* Email/Password Forms */}
                  {authMode === 'signup' ? (
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={signupForm.control}
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
                            control={signupForm.control}
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
                          control={signupForm.control}
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
                                    placeholder="john@restaurant.com" 
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
                                    placeholder="At least 6 characters" 
                                    className="pr-10" 
                                    {...field} 
                                  />
                                  <button
                                    type="button"
                                    data-testid="button-toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    data-testid="input-confirm-password"
                                    type={showConfirmPassword ? "text" : "password"} 
                                    autoComplete="new-password"
                                    placeholder="Confirm your password" 
                                    className="pr-10" 
                                    {...field} 
                                  />
                                  <button
                                    type="button"
                                    data-testid="button-toggle-confirm-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                          {signupMutation.isPending ? 'Creating Account...' : 'Create Restaurant Account'}
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                  <Input 
                                    data-testid="input-login-email"
                                    type="email" 
                                    autoComplete="username"
                                    placeholder="john@restaurant.com" 
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
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    data-testid="input-login-password"
                                    type={showPassword ? "text" : "password"} 
                                    autoComplete="current-password"
                                    placeholder="Your password" 
                                    className="pr-10" 
                                    {...field} 
                                  />
                                  <button
                                    type="button"
                                    data-testid="button-toggle-login-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                          {loginMutation.isPending ? 'Signing In...' : 'Sign In to Restaurant Account'}
                        </Button>
                        <div className="text-center mt-4">
                          <Link href="/forgot-password">
                            <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer text-sm" data-testid="link-forgot-password">
                              Forgot your password?
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
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-2xl mb-4">Reach More Customers</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Target hungry customers within walking distance of your restaurant when they're actively looking for deals.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Hyper-local targeting</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Peak hunger times</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Mobile-first audience</li>
              </ul>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-2xl mb-4">Fill Slow Periods</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Boost revenue during off-peak hours with targeted lunch and dinner deals that bring customers when you need them most.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Time-based targeting</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Flexible deal scheduling</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Revenue optimization</li>
              </ul>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-2xl mb-4">Track Performance</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-4">
                Get detailed analytics on your deal performance and optimize your campaigns for maximum ROI and customer acquisition.
              </p>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Real-time analytics</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Customer insights</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>ROI tracking</li>
              </ul>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-3xl p-12 shadow-2xl text-center mb-16">
            <h3 className="font-bold text-gray-900 text-3xl mb-6">Simple Deal Pricing</h3>
            
            {/* Two pricing tiers side by side */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Base Plan */}
              <div className="bg-white/70 rounded-2xl p-8 border border-blue-200/30">
                <h4 className="font-bold text-gray-900 text-2xl mb-4">Base Plan</h4>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold text-blue-600">$49</span>
                  <span className="text-gray-600 text-xl ml-2">/month</span>
                </div>
                <p className="text-gray-600 text-xl mb-4">
                  <strong>1 active deal</strong>
                </p>
                <p className="text-gray-500 text-lg">
                  Perfect for single-location restaurants. Edit and update your deal anytime.
                </p>
              </div>

              {/* Multiple Deals Plan */}
              <div className="bg-white/70 rounded-2xl p-8 border border-orange-200/50 ring-2 ring-orange-300/30">
                <div className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-3">POPULAR</div>
                <h4 className="font-bold text-gray-900 text-2xl mb-4">Multiple Deals</h4>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold text-orange-600">$74</span>
                  <span className="text-gray-600 text-xl ml-2">/month</span>
                </div>
                <p className="text-gray-600 text-xl mb-4">
                  <strong>3 active deals</strong>
                </p>
                <p className="text-gray-500 text-lg">
                  Run breakfast, lunch, and dinner deals simultaneously to maximize your reach.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-gray-900 text-xl mb-6">Both plans include:</h4>
              <div className="grid md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Edit deals anytime</span></div>
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Performance analytics</span></div>
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Customer targeting</span></div>
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Real-time notifications</span></div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Location-based promotion</span></div>
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">24/7 support</span></div>
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Cancel anytime</span></div>
                  <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">No setup fees</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of restaurants already using MealScout to grow their business. Set up your first deal in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => window.location.href = "/api/auth/facebook"}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-4 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Create Restaurant Account
              </button>
              <button 
                onClick={() => window.location.href = "/api/auth/facebook"}
                className="border-2 border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-800 px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-200"
              >
                Login to Existing Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <BackHeader
        title="Restaurant Registration"
        fallbackHref="/"
        icon={Store}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-6 py-12 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-32 h-32 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl mb-8 flex items-center justify-center mx-auto relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <svg className="w-16 h-16 text-white relative z-10 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
            </svg>
            <div className="absolute -top-2 -left-2 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4" data-testid="text-hero-title">Grow Your Business</h2>
          <p className="text-gray-600 text-xl leading-relaxed max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            Reach more customers and boost sales with targeted local deals
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
            <h3 className="font-bold text-gray-900 text-lg mb-2" data-testid="text-benefit-local-title">Hyper-Local Targeting</h3>
            <p className="text-gray-600 leading-relaxed" data-testid="text-benefit-local-desc">
              Reach workers and customers within a few blocks of your restaurant
            </p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2" data-testid="text-benefit-meals-title">All-Day Service</h3>
            <p className="text-gray-600 leading-relaxed" data-testid="text-benefit-meals-desc">
              Great deals throughout the day for busy customers
            </p>
          </div>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2" data-testid="text-benefit-track-title">Track Performance</h3>
            <p className="text-gray-600 leading-relaxed" data-testid="text-benefit-track-desc">
              See how your deals perform and optimize for better results
            </p>
          </div>
        </div>

        {/* Steps Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'restaurant' ? 'text-red-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'restaurant' ? 'bg-red-100 border-2 border-red-600' : 'bg-green-100'}`}>
                {currentStep === 'verification' ? <CheckCircle className="w-5 h-5" /> : <span className="font-bold">1</span>}
              </div>
              <span className="font-medium">Business Details</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'verification' ? 'text-red-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'verification' ? 'bg-red-100 border-2 border-red-600' : 'bg-gray-100'}`}>
                <span className="font-bold">2</span>
              </div>
              <span className="font-medium">Business Verification</span>
            </div>
          </div>
        </div>

        {/* Restaurant Form */}
        {currentStep === 'restaurant' && (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-business-name">Business Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your business name" 
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
                    <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-business-type">Business Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md" data-testid="select-business-type">
                          <SelectValue placeholder="Select your business type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="food_truck">Food Truck</SelectItem>
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
                    <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-address">Business Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main Street, Chicago, IL" 
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
                      <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-phone">Phone</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="(555) 123-4567" 
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
                      <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-cuisine">Cuisine Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md" data-testid="select-cuisine">
                            <SelectValue placeholder="Select cuisine type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* American Cuisines */}
                          <SelectItem value="american">American</SelectItem>
                          <SelectItem value="bbq">BBQ & Smokehouse</SelectItem>
                          <SelectItem value="southern">Southern & Soul Food</SelectItem>
                          <SelectItem value="cajun">Cajun & Creole</SelectItem>
                          <SelectItem value="tex-mex">Tex-Mex</SelectItem>
                          <SelectItem value="burgers">Burgers & Fries</SelectItem>
                          <SelectItem value="deli">Deli & Sandwiches</SelectItem>
                          <SelectItem value="wings">Wings & Sports Bar</SelectItem>
                          
                          {/* International Cuisines */}
                          <SelectItem value="italian">Italian</SelectItem>
                          <SelectItem value="pizza">Pizza</SelectItem>
                          <SelectItem value="mexican">Mexican</SelectItem>
                          <SelectItem value="chinese">Chinese</SelectItem>
                          <SelectItem value="japanese">Japanese & Sushi</SelectItem>
                          <SelectItem value="korean">Korean</SelectItem>
                          <SelectItem value="thai">Thai</SelectItem>
                          <SelectItem value="vietnamese">Vietnamese</SelectItem>
                          <SelectItem value="indian">Indian</SelectItem>
                          <SelectItem value="mediterranean">Mediterranean</SelectItem>
                          <SelectItem value="greek">Greek</SelectItem>
                          <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="british">British & Pub Food</SelectItem>
                          <SelectItem value="spanish">Spanish & Tapas</SelectItem>
                          <SelectItem value="latin-american">Latin American</SelectItem>
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
                          <SelectItem value="steakhouse">Steakhouse</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="organic">Organic & Farm-to-Table</SelectItem>
                          <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                          <SelectItem value="halal">Halal</SelectItem>
                          <SelectItem value="kosher">Kosher</SelectItem>
                          
                          {/* Food Types */}
                          <SelectItem value="fast-food">Fast Food</SelectItem>
                          <SelectItem value="fast-casual">Fast Casual</SelectItem>
                          <SelectItem value="fine-dining">Fine Dining</SelectItem>
                          <SelectItem value="casual-dining">Casual Dining</SelectItem>
                          <SelectItem value="food-truck">Food Truck Fusion</SelectItem>
                          <SelectItem value="street-food">Street Food</SelectItem>
                          <SelectItem value="comfort-food">Comfort Food</SelectItem>
                          <SelectItem value="breakfast">Breakfast & Brunch</SelectItem>
                          <SelectItem value="coffee">Coffee & Café</SelectItem>
                          <SelectItem value="bakery">Bakery & Pastries</SelectItem>
                          <SelectItem value="desserts">Desserts & Sweets</SelectItem>
                          <SelectItem value="ice-cream">Ice Cream & Frozen Treats</SelectItem>
                          <SelectItem value="juice-bar">Juice Bar & Smoothies</SelectItem>
                          <SelectItem value="bar">Bar & Cocktails</SelectItem>
                          <SelectItem value="brewery">Brewery & Craft Beer</SelectItem>
                          <SelectItem value="wine-bar">Wine Bar</SelectItem>
                          
                          {/* Trending & Fusion */}
                          <SelectItem value="fusion">Fusion Cuisine</SelectItem>
                          <SelectItem value="gastropub">Gastropub</SelectItem>
                          <SelectItem value="ramen">Ramen & Noodles</SelectItem>
                          <SelectItem value="poke">Poke & Hawaiian</SelectItem>
                          <SelectItem value="boba">Boba Tea & Asian Drinks</SelectItem>
                          <SelectItem value="healthy">Healthy & Bowls</SelectItem>
                          <SelectItem value="keto">Keto & Low-Carb</SelectItem>
                          <SelectItem value="paleo">Paleo</SelectItem>
                          
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-8 shadow-lg">
                <h3 className="font-bold text-gray-900 text-xl mb-6" data-testid="text-pricing-title">Choose Your Plan</h3>
                
                {/* Billing Options */}
                <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-3">
                  {/* Monthly Plan */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      billingInterval === 'month' 
                        ? 'border-red-500 bg-red-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-red-300'
                    }`}
                    onClick={() => setBillingInterval('month')}
                    data-testid="card-monthly-plan"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">$49</div>
                      <div className="text-sm text-gray-600 mb-1">/month</div>
                      <div className="text-xs text-gray-500">Billed monthly</div>
                    </div>
                  </div>

                  {/* Quarterly Plan */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 relative ${
                      billingInterval === '3-month' 
                        ? 'border-red-500 bg-red-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-red-300'
                    }`}
                    onClick={() => setBillingInterval('3-month')}
                    data-testid="card-quarterly-plan"
                  >
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Save 32%
                    </div>
                    <div className="absolute -bottom-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      New Users
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">$100</div>
                      <div className="text-sm text-gray-600 mb-1">/3 months</div>
                      <div className="text-xs text-gray-500">
                        <span className="line-through">$147</span> Quarterly
                      </div>
                    </div>
                  </div>
                  
                  {/* Yearly Plan */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 relative ${
                      billingInterval === 'year' 
                        ? 'border-red-500 bg-red-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-red-300'
                    }`}
                    onClick={() => setBillingInterval('year')}
                    data-testid="card-yearly-plan"
                  >
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Best Value
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">$450</div>
                      <div className="text-sm text-gray-600 mb-1">/year</div>
                      <div className="text-xs text-gray-500">
                        <span className="line-through">$588</span> Annually
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Summary */}
                <div className="bg-white/70 rounded-lg p-4 border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 font-bold text-xl" data-testid="text-selected-price">
                        {billingInterval === 'month' && '$49/month'}
                        {billingInterval === '3-month' && '$100/3 months'}
                        {billingInterval === 'year' && '$450/year'}
                      </p>
                      <p className="text-gray-600" data-testid="text-price-desc">Unlimited deal postings</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600" data-testid="text-features">Unlimited postings</p>
                      <p className="text-gray-500 text-sm" data-testid="text-cancel">Cancel anytime</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Code Field */}
              <FormField
                control={form.control}
                name="promoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-promo-code">
                      Promo Code <span className="text-sm font-normal text-gray-500">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter promo code for beta access..." 
                        {...field} 
                        className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200 uppercase"
                        data-testid="input-promo-code"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter "BETA" for free access during beta testing period
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      <FormLabel className="text-gray-600 leading-relaxed text-base" data-testid="label-terms">
                        I agree to the{" "}
                        <Link href="/terms-of-service">
                          <span className="text-red-600 font-medium underline hover:text-red-700 cursor-pointer">Terms of Service</span>
                        </Link>
                        {" "}and{" "}
                        <Link href="/privacy-policy">
                          <span className="text-red-600 font-medium underline hover:text-red-700 cursor-pointer">Privacy Policy</span>
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
                {createRestaurantMutation.isPending ? "Creating..." : "Get Started"}
              </Button>
              </form>
            </Form>
          </div>
        )}

        {/* Verification Step */}
        {currentStep === 'verification' && createdRestaurant && (
          <div className="space-y-8">
            {/* Verification Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-2xl">
                  <Upload className="w-7 h-7 text-red-600" />
                  <span>Verify Your Business</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-lg text-gray-700">
                    Build trust with customers by verifying your business. Upload documents like:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                    <li>Business license or permit</li>
                    <li>Restaurant operating license</li>
                    <li>Tax registration documents</li>
                    <li>Health department certificates</li>
                    <li>Any other official business documents</li>
                  </ul>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Why verify?</strong> Verified restaurants get a trust badge, appear higher in search results, 
                      and customers are more likely to choose verified businesses.
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
              acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep('restaurant')}
                className="flex items-center space-x-2"
                data-testid="button-back-to-restaurant"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Restaurant Details</span>
              </Button>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipVerification}
                  className="text-gray-600 hover:text-gray-800"
                  data-testid="button-skip-verification"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleVerificationSubmit}
                  disabled={createVerificationRequestMutation.isPending || verificationDocuments.length === 0}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center space-x-2"
                  data-testid="button-submit-verification"
                >
                  {createVerificationRequestMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>
                    {createVerificationRequestMutation.isPending ? 'Submitting...' : 'Submit for Review'}
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