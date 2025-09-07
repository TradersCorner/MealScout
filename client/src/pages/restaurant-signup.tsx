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
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  cuisineType: z.string().min(1, "Cuisine type is required"),
  acceptTerms: z.boolean().refine(val => val === true, "You must accept the terms"),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

export default function RestaurantSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      cuisineType: "",
      acceptTerms: false,
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: Omit<RestaurantFormData, 'acceptTerms'>) => {
      return await apiRequest("POST", "/api/restaurants", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Restaurant registered successfully. Redirecting to subscription...",
      });
      setLocation("/subscribe");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
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

  const onSubmit = (data: RestaurantFormData) => {
    const { acceptTerms, ...restaurantData } = data;
    createRestaurantMutation.mutate(restaurantData);
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
      <div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center p-6">
        <Card className="w-full shadow-food border-0 gradient-card">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 food-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-lock text-white text-xl"></i>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Authentication Required</h3>
            <p className="text-muted-foreground mb-6">Please log in to register your restaurant</p>
            <Button onClick={() => window.location.href = "/api/login"} className="w-full py-3 font-bold food-gradient-primary border-0 button-hover-effect">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center max-w-4xl mx-auto">
          <Link href="/">
            <button className="p-3 -ml-3 rounded-xl hover:bg-gray-100 mr-4 transition-colors duration-200" data-testid="button-back">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900" data-testid="text-page-title">Restaurant Registration</h1>
        </div>
      </header>

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

        {/* Sign-up Form */}
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-900" data-testid="label-restaurant-name">Restaurant Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your restaurant name" 
                        {...field} 
                        className="py-4 px-4 text-lg border-0 bg-gray-50/80 focus:bg-white focus:ring-2 focus:ring-red-500/20 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
                        data-testid="input-restaurant-name"
                      />
                    </FormControl>
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
                          <SelectItem value="american">American</SelectItem>
                          <SelectItem value="italian">Italian</SelectItem>
                          <SelectItem value="mexican">Mexican</SelectItem>
                          <SelectItem value="asian">Asian</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-8 shadow-lg">
                <h3 className="font-bold text-gray-900 text-xl mb-6" data-testid="text-pricing-title">Pricing</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 font-bold text-3xl" data-testid="text-price">$49/month</p>
                    <p className="text-gray-600 text-lg" data-testid="text-price-desc">Unlimited deal postings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-lg" data-testid="text-features">Unlimited postings</p>
                    <p className="text-gray-500 text-sm" data-testid="text-cancel">Cancel anytime</p>
                  </div>
                </div>
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
                      <FormLabel className="text-gray-600 leading-relaxed text-base" data-testid="label-terms">
                        I agree to the <span className="text-red-600 font-medium underline">Terms of Service</span> and{" "}
                        <span className="text-red-600 font-medium underline">Privacy Policy</span>
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
      </div>
    </div>
  );
}