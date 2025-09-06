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
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground mb-4">Please log in to register your restaurant</p>
            <Button onClick={() => window.location.href = "/api/login"} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/">
            <button className="p-2 -ml-2 rounded-full hover:bg-muted mr-3" data-testid="button-back">
              <i className="fas fa-arrow-left text-foreground"></i>
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">Restaurant Registration</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl mb-4 flex items-center justify-center">
            <i className="fas fa-store text-primary text-4xl"></i>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2" data-testid="text-hero-title">Grow Your Business</h2>
          <p className="text-muted-foreground text-sm" data-testid="text-hero-subtitle">
            Reach more customers and boost lunch sales with targeted local deals
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-map-marker-alt text-white text-xs"></i>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm" data-testid="text-benefit-local-title">Hyper-Local Targeting</h3>
              <p className="text-muted-foreground text-xs" data-testid="text-benefit-local-desc">
                Reach workers and customers within a few blocks of your restaurant
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-clock text-white text-xs"></i>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm" data-testid="text-benefit-lunch-title">Lunch Rush Focus</h3>
              <p className="text-muted-foreground text-xs" data-testid="text-benefit-lunch-desc">
                Perfect timing for busy workers looking for quick meal deals
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-chart-line text-white text-xs"></i>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm" data-testid="text-benefit-track-title">Track Performance</h3>
              <p className="text-muted-foreground text-xs" data-testid="text-benefit-track-desc">
                See how your deals perform and optimize for better results
              </p>
            </div>
          </div>
        </div>

        {/* Sign-up Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-restaurant-name">Restaurant Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your restaurant name" 
                      {...field} 
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
                  <FormLabel data-testid="label-address">Business Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123 Main Street, Chicago, IL" 
                      {...field} 
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
                    <FormLabel data-testid="label-phone">Phone</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="(555) 123-4567" 
                        {...field} 
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
                    <FormLabel data-testid="label-cuisine">Cuisine Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cuisine">
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

            <Card className="bg-muted">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2" data-testid="text-pricing-title">Promotion Fee</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary font-bold text-lg" data-testid="text-price">$49/month</p>
                    <p className="text-muted-foreground text-xs" data-testid="text-price-desc">Unlimited deal postings</p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent text-xs font-medium" data-testid="text-trial">30-day free trial</p>
                    <p className="text-muted-foreground text-xs" data-testid="text-cancel">Cancel anytime</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-terms"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs text-muted-foreground" data-testid="label-terms">
                      I agree to the <span className="text-primary underline">Terms of Service</span> and{" "}
                      <span className="text-primary underline">Privacy Policy</span>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full py-3 font-semibold text-sm"
              disabled={createRestaurantMutation.isPending}
              data-testid="button-start-trial"
            >
              {createRestaurantMutation.isPending ? "Creating..." : "Start Free Trial"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
