import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const dealSchema = z.object({
  title: z.string().min(1, "Deal title is required"),
  description: z.string().min(1, "Description is required"),
  dealType: z.enum(["percentage", "fixed"]),
  discountValue: z.string().min(1, "Discount value is required"),
  minOrderAmount: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  totalUsesLimit: z.string().optional(),
  perCustomerLimit: z.string().optional(),
  isFeatured: z.boolean().default(false),
});

type DealFormData = z.infer<typeof dealSchema>;

export default function DealCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: restaurants } = useQuery({
    queryKey: ["/api/restaurants/my"],
    enabled: isAuthenticated,
  });

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      description: "",
      dealType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: "11:00",
      endTime: "15:00",
      totalUsesLimit: "",
      perCustomerLimit: "1",
      isFeatured: false,
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      if (!Array.isArray(restaurants) || restaurants.length === 0) {
        throw new Error("No restaurant found. Please register a restaurant first.");
      }

      const dealData = {
        ...data,
        restaurantId: restaurants[0].id,
        discountValue: parseFloat(data.discountValue),
        minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
        totalUsesLimit: data.totalUsesLimit ? parseInt(data.totalUsesLimit) : null,
        perCustomerLimit: data.perCustomerLimit ? parseInt(data.perCustomerLimit) : 1,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      };

      return await apiRequest("POST", "/api/deals", dealData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Deal created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setLocation("/");
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
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DealFormData) => {
    createDealMutation.mutate(data);
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
            <p className="text-center text-muted-foreground mb-4">Please log in to create deals</p>
            <Button onClick={() => window.location.href = "/api/login"} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!Array.isArray(restaurants) || restaurants.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <i className="fas fa-store text-muted-foreground text-3xl mb-4"></i>
            <p className="text-muted-foreground mb-4">You need to register a restaurant first</p>
            <Link href="/restaurant-signup">
              <Button className="w-full">Register Restaurant</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-full hover:bg-muted mr-3" data-testid="button-back">
                <i className="fas fa-arrow-left text-foreground"></i>
              </button>
            </Link>
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-page-title">Create New Deal</h1>
          </div>
          <button className="text-primary font-semibold text-sm" data-testid="button-preview">Preview</button>
        </div>
      </header>

      <div className="px-4 py-6 pb-24">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Deal Image */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2" data-testid="label-deal-photo">Deal Photo</Label>
              <div className="border-2 border-dashed border-input rounded-lg p-8 text-center bg-muted/50">
                <i className="fas fa-camera text-muted-foreground text-2xl mb-2"></i>
                <p className="text-sm text-muted-foreground mb-2" data-testid="text-photo-prompt">Add a mouth-watering photo of your deal</p>
                <Button type="button" variant="default" size="sm" data-testid="button-upload-photo">
                  Upload Photo
                </Button>
              </div>
            </div>

            {/* Deal Details */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-deal-title">Deal Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Buy One Get One Free Meal Special" 
                      {...field} 
                      data-testid="input-deal-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-testid="label-description">Deal Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your deal in detail. What's included? Any restrictions?" 
                      rows={3} 
                      {...field} 
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deal Type */}
            <FormField
              control={form.control}
              name="dealType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel data-testid="label-deal-type">Deal Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="flex items-center space-x-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="percentage" id="percentage" data-testid="radio-percentage" />
                        <Label htmlFor="percentage" className="cursor-pointer">
                          <p className="font-medium text-sm" data-testid="text-percentage-title">Percentage Off</p>
                          <p className="text-xs text-muted-foreground" data-testid="text-percentage-desc">e.g., 20% off</p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="fixed" id="fixed" data-testid="radio-fixed" />
                        <Label htmlFor="fixed" className="cursor-pointer">
                          <p className="font-medium text-sm" data-testid="text-fixed-title">Fixed Amount</p>
                          <p className="text-xs text-muted-foreground" data-testid="text-fixed-desc">e.g., $5 off</p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-discount-value">Discount Value</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="25" 
                          {...field} 
                          data-testid="input-discount-value"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          {form.watch("dealType") === "percentage" ? "%" : "$"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-min-order">Min. Order</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          type="number" 
                          placeholder="15.00" 
                          className="pl-8"
                          {...field} 
                          data-testid="input-min-order"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Timing */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-3" data-testid="label-availability">
                When is this deal available?
              </Label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground" data-testid="label-start-date">Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground" data-testid="label-end-date">End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground" data-testid="label-start-time">Available From</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-start-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground" data-testid="label-end-time">Available Until</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-end-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Limits */}
            <div>
              <Label className="block text-sm font-medium text-foreground mb-2" data-testid="label-deal-limits">Deal Limits</Label>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalUsesLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Total uses (optional)" 
                          {...field} 
                          data-testid="input-total-uses"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1" data-testid="text-total-uses-help">Leave blank for unlimited</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="perCustomerLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Per customer limit" 
                          {...field} 
                          data-testid="input-per-customer"
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1" data-testid="text-per-customer-help">Max uses per person</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Promotion Budget */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-2" data-testid="text-boost-title">Boost This Deal</h3>
                <p className="text-muted-foreground text-xs mb-4" data-testid="text-boost-desc">
                  Pay extra to feature your deal at the top of search results
                </p>
                
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "featured")}
                          defaultValue={field.value ? "featured" : "standard"}
                        >
                          <Label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer bg-white">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="standard" id="standard" data-testid="radio-standard" />
                              <div>
                                <p className="font-medium text-sm" data-testid="text-standard-title">Standard Listing</p>
                                <p className="text-xs text-muted-foreground" data-testid="text-standard-desc">Appears in regular results</p>
                              </div>
                            </div>
                            <span className="font-semibold text-accent" data-testid="text-standard-price">Free</span>
                          </Label>
                          
                          <Label className="flex items-center justify-between p-3 border border-border rounded-lg cursor-pointer bg-white">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="featured" id="featured" data-testid="radio-featured" />
                              <div>
                                <p className="font-medium text-sm" data-testid="text-featured-title">Featured Deal</p>
                                <p className="text-xs text-muted-foreground" data-testid="text-featured-desc">Top 3 spots, 2x visibility</p>
                              </div>
                            </div>
                            <span className="font-semibold text-primary" data-testid="text-featured-price">$5/day</span>
                          </Label>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="py-3 px-4"
                data-testid="button-save-draft"
              >
                Save Draft
              </Button>
              <Button 
                type="submit" 
                className="py-3 px-4"
                disabled={createDealMutation.isPending}
                data-testid="button-publish-deal"
              >
                {createDealMutation.isPending ? "Publishing..." : "Publish Deal"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
