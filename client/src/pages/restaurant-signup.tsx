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
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <header className="glass-effect border-b border-border/50 px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/">
            <button className="p-3 -ml-3 rounded-xl hover:bg-muted/60 mr-4 transition-colors duration-200" data-testid="button-back">
              <i className="fas fa-arrow-left text-foreground text-lg"></i>
            </button>
          </Link>
          <h1 className="text-xl font-bold text-foreground" data-testid="text-page-title">Restaurant Registration</h1>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="w-full h-40 food-gradient-primary rounded-3xl mb-6 flex items-center justify-center relative overflow-hidden shadow-food">
            <div className="absolute inset-0 bg-black/10"></div>
            <i className="fas fa-store text-white text-6xl relative z-10 drop-shadow-lg"></i>
            <div className="absolute -top-2 -left-2 w-16 h-16 bg-white/15 rounded-full blur-xl"></div>
            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/15 rounded-full blur-xl"></div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3" data-testid="text-hero-title">Grow Your Business</h2>
          <p className="text-muted-foreground text-lg leading-relaxed" data-testid="text-hero-subtitle">
            Reach more customers and boost sales with targeted local deals
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-5 mb-10">
          <div className="flex items-start space-x-4 p-4 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30">
            <div className="w-12 h-12 food-gradient-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <i className="fas fa-map-marker-alt text-white"></i>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1" data-testid="text-benefit-local-title">Hyper-Local Targeting</h3>
              <p className="text-muted-foreground text-sm leading-relaxed" data-testid="text-benefit-local-desc">
                Reach workers and customers within a few blocks of your restaurant
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-4 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30">
            <div className="w-12 h-12 food-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <i className="fas fa-clock text-white"></i>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1" data-testid="text-benefit-meals-title">All-Day Service</h3>
              <p className="text-muted-foreground text-sm leading-relaxed" data-testid="text-benefit-meals-desc">
                Great deals throughout the day for busy customers
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-4 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/30">
            <div className="w-12 h-12 food-gradient-secondary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <i className="fas fa-chart-line text-white"></i>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1" data-testid="text-benefit-track-title">Track Performance</h3>
              <p className="text-muted-foreground text-sm leading-relaxed" data-testid="text-benefit-track-desc">
                See how your deals perform and optimize for better results
              </p>
            </div>
          </div>
        </div>

        {/* Sign-up Form */}
        <Card className="shadow-food border-0 gradient-card">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-foreground" data-testid="label-restaurant-name">Restaurant Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your restaurant name" 
                          {...field} 
                          className="py-3 px-4 text-base border-2 focus:border-primary rounded-xl bg-background"
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
                      <FormLabel className="text-base font-semibold text-foreground" data-testid="label-address">Business Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123 Main Street, Chicago, IL" 
                          {...field} 
                          className="py-3 px-4 text-base border-2 focus:border-primary rounded-xl bg-background"
                          data-testid="input-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-foreground" data-testid="label-phone">Phone</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="(555) 123-4567" 
                            {...field} 
                            className="py-3 px-4 text-base border-2 focus:border-primary rounded-xl bg-background"
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
                        <FormLabel className="text-base font-semibold text-foreground" data-testid="label-cuisine">Cuisine Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="py-3 px-4 text-base border-2 focus:border-primary rounded-xl bg-background" data-testid="select-cuisine">
                              <SelectValue placeholder="Select..." />
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

                <Card className="food-gradient-secondary/10 border border-secondary/20">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-foreground text-lg mb-4" data-testid="text-pricing-title">Promotion Fee</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-primary font-bold text-2xl" data-testid="text-price">$49/month</p>
                        <p className="text-muted-foreground" data-testid="text-price-desc">Unlimited deal postings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-accent font-bold" data-testid="text-trial">30-day free trial</p>
                        <p className="text-muted-foreground text-sm" data-testid="text-cancel">Cancel anytime</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-4 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                          data-testid="checkbox-terms"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-muted-foreground leading-relaxed" data-testid="label-terms">
                          I agree to the <span className="text-primary font-medium underline">Terms of Service</span> and{" "}
                          <span className="text-primary font-medium underline">Privacy Policy</span>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full py-4 font-bold text-lg rounded-xl food-gradient-primary border-0 button-hover-effect"
                  disabled={createRestaurantMutation.isPending}
                  data-testid="button-start-trial"
                >
                  {createRestaurantMutation.isPending ? "Creating..." : "Start Free Trial"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}