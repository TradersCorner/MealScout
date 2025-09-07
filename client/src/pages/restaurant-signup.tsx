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
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-6 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center max-w-4xl mx-auto">
            <Link href="/">
              <button className="p-3 -ml-3 rounded-xl hover:bg-gray-100 mr-4 transition-colors duration-200">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">MealScout for Restaurants</h1>
          </div>
        </header>

        <div className="px-6 py-12 max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-32 h-32 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl mb-8 flex items-center justify-center mx-auto relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/10"></div>
              
              {/* Professional restaurant marketing logo */}
              <div className="relative z-10 flex items-center justify-center">
                {/* Main plate with utensils */}
                <div className="relative">
                  {/* Plate base */}
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center relative">
                    {/* Inner plate design */}
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full border-2 border-gray-200 flex items-center justify-center">
                      {/* Food icon in center */}
                      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                    
                    {/* Fork */}
                    <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 -rotate-45">
                      <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3V1.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V3h4V1.5a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V3a1 1 0 011 1v8a1 1 0 01-1 1v4a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-4H9v4a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-4a1 1 0 01-1-1V4a1 1 0 011-1z"/>
                      </svg>
                    </div>
                    
                    {/* Knife */}
                    <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 rotate-45">
                      <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h1a2 2 0 002-2V4a2 2 0 00-2-2H6z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Dollar sign overlay - representing deals/revenue */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                    <svg className="w-5 h-5 text-white font-bold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13v1.469c.96.29 1.56.929 1.56 1.531 0 .502-.334.956-.875 1.198L11 9.85v1.698c.536-.066 1.014-.243 1.43-.516a.75.75 0 11.14 1.336c-.494.26-1.05.404-1.57.454V14a.75.75 0 11-1.5 0v-1.178c-.96-.29-1.56-.929-1.56-1.531 0-.502.334-.956.875-1.198L9 9.15V7.452c-.536.066-1.014.243-1.43.516a.75.75 0 11-.14-1.336c.494-.26 1.05-.404 1.57-.454V5a.75.75 0 011.5 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                
                {/* Advertising megaphone in corner */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                  </svg>
                </div>
              </div>
              
              <div className="absolute -top-2 -left-2 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Boost Your Restaurant's Revenue</h2>
            <p className="text-gray-600 text-xl leading-relaxed max-w-3xl mx-auto mb-8">
              Join MealScout's advertising platform and connect with hungry customers actively looking for deals in your neighborhood. Increase foot traffic, fill slow periods, and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => window.location.href = "/api/auth/facebook"}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Start Advertising Today
              </button>
              <div className="text-gray-500 text-sm">Already have an account?</div>
              <button 
                onClick={() => window.location.href = "/api/auth/facebook"}
                className="border-2 border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200"
              >
                Login to Dashboard
              </button>
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
            <h3 className="font-bold text-gray-900 text-3xl mb-6">Flexible Deal Pricing</h3>
            
            {/* Base pricing */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <span className="text-6xl font-bold text-blue-600">$49</span>
                <span className="text-gray-600 text-2xl ml-2">/month</span>
              </div>
              <p className="text-gray-600 text-xl mb-4">
                <strong>Base subscription includes 1 active deal</strong>
              </p>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Edit and update your deal anytime to promote different offers - breakfast specials, lunch combos, dinner deals, or seasonal items.
              </p>
            </div>

            {/* Additional deals pricing */}
            <div className="bg-white/70 rounded-2xl p-8 mb-8 border border-blue-200/30">
              <h4 className="font-bold text-gray-900 text-2xl mb-4">Need Multiple Deals?</h4>
              <div className="flex items-center justify-center mb-4">
                <span className="text-4xl font-bold text-orange-600">+$25</span>
                <span className="text-gray-600 text-lg ml-2">per additional deal</span>
              </div>
              <p className="text-gray-600 text-lg max-w-xl mx-auto">
                Run breakfast, lunch, and dinner deals simultaneously to maximize your reach and fill every time slot.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
              <div className="space-y-3">
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">1 active deal included</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Edit deal anytime</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Performance analytics</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Customer targeting</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Featured deal options</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Multiple deals (+$25 each)</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Priority support</span></div>
                <div className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg><span className="text-gray-700">Cancel anytime</span></div>
              </div>
            </div>

            {/* Pricing examples */}
            <div className="mt-8 pt-6 border-t border-blue-200/30">
              <h5 className="font-semibold text-gray-900 text-lg mb-4">Pricing Examples:</h5>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/50 rounded-xl p-4">
                  <div className="font-bold text-blue-600 mb-2">Single Deal</div>
                  <div className="text-gray-700">$49/month</div>
                  <div className="text-gray-500 text-xs mt-1">1 breakfast special</div>
                </div>
                <div className="bg-white/50 rounded-xl p-4">
                  <div className="font-bold text-orange-600 mb-2">Two Deals</div>
                  <div className="text-gray-700">$74/month</div>
                  <div className="text-gray-500 text-xs mt-1">Lunch + dinner deals</div>
                </div>
                <div className="bg-white/50 rounded-xl p-4">
                  <div className="font-bold text-purple-600 mb-2">All Day</div>
                  <div className="text-gray-700">$99/month</div>
                  <div className="text-gray-500 text-xs mt-1">Breakfast, lunch & dinner</div>
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