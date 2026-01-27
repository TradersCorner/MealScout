var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Link, useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, X, Eye, Users, DollarSign, Edit3, Save, Trash2, Copy, Calendar, Settings, AlertTriangle } from "lucide-react";
import { BackHeader } from "@/components/back-header";
var dealEditSchema = z.object({
    title: z.string().min(1, "Special title is required"),
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
    facebookPageUrl: z.string().optional(),
    isActive: z.boolean(),
});
export default function DealEdit() {
    var _this = this;
    var dealId = useParams().dealId;
    var _a = useLocation(), setLocation = _a[1];
    var toast = useToast().toast;
    var _b = useAuth(), user = _b.user, isAuthenticated = _b.isAuthenticated, isLoading = _b.isLoading;
    var queryClient = useQueryClient();
    var _c = useState(null), selectedImage = _c[0], setSelectedImage = _c[1];
    var _d = useState(false), showPreview = _d[0], setShowPreview = _d[1];
    var _e = useState(false), isDirty = _e[0], setIsDirty = _e[1];
    var fileInputRef = useRef(null);
    // Fetch the deal to edit
    var _f = useQuery({
        queryKey: ["/api/deals/".concat(dealId)],
        enabled: !!dealId && isAuthenticated,
    }), deal = _f.data, dealLoading = _f.isLoading, dealError = _f.error;
    var restaurants = useQuery({
        queryKey: ["/api/restaurants/my-restaurants"],
        enabled: isAuthenticated,
    }).data;
    var form = useForm({
        resolver: zodResolver(dealEditSchema),
        defaultValues: {
            title: "",
            description: "",
            dealType: "percentage",
            discountValue: "",
            minOrderAmount: "",
            startDate: "",
            endDate: "",
            startTime: "",
            endTime: "",
            totalUsesLimit: "",
            perCustomerLimit: "",
            facebookPageUrl: "",
            isActive: true,
        },
    });
    // Update form when deal data is loaded
    useEffect(function () {
        var _a, _b, _c;
        if (deal) {
            var formatDate = function (dateString) {
                return new Date(dateString).toISOString().split('T')[0];
            };
            form.reset({
                title: deal.title,
                description: deal.description,
                dealType: deal.dealType,
                discountValue: deal.discountValue.toString(),
                minOrderAmount: ((_a = deal.minOrderAmount) === null || _a === void 0 ? void 0 : _a.toString()) || "",
                startDate: formatDate(deal.startDate.toString()),
                endDate: deal.endDate ? formatDate(deal.endDate.toString()) : "",
                startTime: deal.startTime || "",
                endTime: deal.endTime || "",
                totalUsesLimit: ((_b = deal.totalUsesLimit) === null || _b === void 0 ? void 0 : _b.toString()) || "",
                perCustomerLimit: ((_c = deal.perCustomerLimit) === null || _c === void 0 ? void 0 : _c.toString()) || "",
                facebookPageUrl: deal.facebookPageUrl || "",
                isActive: Boolean(deal.isActive),
            });
            if (deal.imageUrl) {
                setSelectedImage(deal.imageUrl);
            }
        }
    }, [deal, form]);
    // Track form changes
    useEffect(function () {
        var subscription = form.watch(function () {
            setIsDirty(true);
        });
        return function () { return subscription.unsubscribe(); };
    }, [form]);
    var updateDealMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            var dealData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dealId) {
                            throw new Error("Deal ID is required");
                        }
                        dealData = __assign(__assign({}, data), { discountValue: parseFloat(data.discountValue), minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null, totalUsesLimit: data.totalUsesLimit ? parseInt(data.totalUsesLimit) : null, perCustomerLimit: data.perCustomerLimit ? parseInt(data.perCustomerLimit) : null, startDate: new Date(data.startDate).toISOString(), endDate: new Date(data.endDate).toISOString(), imageUrl: selectedImage || null });
                        return [4 /*yield*/, apiRequest("PATCH", "/api/deals/".concat(dealId), dealData)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Success!",
                description: "Special updated successfully!",
            });
            setIsDirty(false);
            queryClient.invalidateQueries({ queryKey: ["/api/deals/".concat(dealId)] });
            queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
        },
        onError: function (error) {
            if (isUnauthorizedError(error)) {
                toast({
                    title: "Unauthorized",
                    description: "You are logged out. Logging in again...",
                    variant: "destructive",
                });
                setTimeout(function () {
                    window.location.href = "/api/auth/google/restaurant";
                }, 500);
                return;
            }
            toast({
                title: "Error",
                description: error.message || "Failed to update deal",
                variant: "destructive",
            });
        },
    });
    var deleteDealMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dealId) {
                            throw new Error("Deal ID is required");
                        }
                        return [4 /*yield*/, apiRequest("DELETE", "/api/deals/".concat(dealId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Special Deleted",
                description: "The deal has been permanently deleted.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
            setLocation("/restaurant-owner-dashboard");
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete deal",
                variant: "destructive",
            });
        },
    });
    var duplicateDealMutation = useMutation({
        mutationFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var formData, dealData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!deal || !Array.isArray(restaurants) || restaurants.length === 0) {
                            throw new Error("No restaurant or deal data available");
                        }
                        formData = form.getValues();
                        dealData = __assign(__assign({}, formData), { title: "".concat(formData.title, " (Copy)"), restaurantId: restaurants[0].id, discountValue: parseFloat(formData.discountValue), minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null, totalUsesLimit: formData.totalUsesLimit ? parseInt(formData.totalUsesLimit) : null, perCustomerLimit: formData.perCustomerLimit ? parseInt(formData.perCustomerLimit) : null, startDate: new Date(formData.startDate), endDate: new Date(formData.endDate), imageUrl: selectedImage || null });
                        return [4 /*yield*/, apiRequest("POST", "/api/deals", dealData)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function (newDeal) {
            toast({
                title: "Special Duplicated",
                description: "A copy of this deal has been created successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
            setLocation("/deal-edit/".concat(newDeal.id));
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to duplicate deal",
                variant: "destructive",
            });
        },
    });
    var onSubmit = function (data) {
        updateDealMutation.mutate(data);
    };
    var handleImageUpload = function (event) {
        var _a;
        var file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Please choose an image smaller than 5MB",
                    variant: "destructive",
                });
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid file type",
                    description: "Please choose an image file",
                    variant: "destructive",
                });
                return;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                var _a;
                setSelectedImage((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };
    var removeImage = function () {
        setSelectedImage(null);
        setIsDirty(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    if (isLoading || dealLoading) {
        return (<div className="max-w-4xl mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"/>
          <p className="text-muted-foreground">Loading deal...</p>
        </div>
      </div>);
    }
    if (!isAuthenticated) {
        return (<div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground mb-4">Please log in to edit deals</p>
            <Button onClick={function () { return window.location.href = "/api/auth/google/restaurant"; }} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>);
    }
    if (dealError || !deal) {
        return (<div className="max-w-4xl mx-auto bg-white min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4"/>
            <h2 className="text-xl font-bold mb-2">Special Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The deal you're trying to edit doesn't exist or you don't have permission to edit it.
            </p>
            <Link href="/restaurant-owner-dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);
    }
    var dealPreviewData = {
        title: form.watch("title") || "Your Special Title",
        description: form.watch("description") || "Your deal description...",
        dealType: form.watch("dealType"),
        discountValue: form.watch("discountValue") || "0",
        minOrderAmount: form.watch("minOrderAmount"),
        facebookPageUrl: form.watch("facebookPageUrl"),
        image: selectedImage,
        isActive: form.watch("isActive"),
    };
    return (<div className="max-w-4xl mx-auto bg-background min-h-screen">
      <BackHeader title="Edit Special" fallbackHref="/restaurant-owner-dashboard" icon={Edit3} rightActions={<div className="flex items-center space-x-2">
            {deal.isActive ? (<Badge className="bg-green-500">Active</Badge>) : (<Badge variant="secondary">Inactive</Badge>)}
            
            <Button variant="outline" size="sm" onClick={function () { return duplicateDealMutation.mutate(); }} disabled={duplicateDealMutation.isPending} data-testid="button-duplicate">
              <Copy className="w-4 h-4 mr-2"/>
              {duplicateDealMutation.isPending ? "Copying..." : "Duplicate"}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-delete">
                  <Trash2 className="w-4 h-4 mr-2"/>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Special</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this deal? This action cannot be undone.
                    All existing claims will be invalidated.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={function () { return deleteDealMutation.mutate(); }} className="bg-destructive hover:bg-destructive/90" data-testid="button-confirm-delete">
                    {deleteDealMutation.isPending
                ? "Deleting..."
                : "Delete Special"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>}/>

      <div className="flex flex-col lg:flex-row gap-8 p-6">
        {/* Edit Form */}
        <div className="flex-1 max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit3 className="w-5 h-5 mr-2"/>
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="title" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>Special Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter deal title..." {...field} data-testid="input-title"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>

                  <FormField control={form.control} name="description" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your deal..." className="min-h-[100px]" {...field} data-testid="input-description"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>

                  <FormField control={form.control} name="isActive" render={function (_a) {
            var field = _a.field;
            return (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Special Status</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Make this deal visible to customers
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active"/>
                        </FormControl>
                      </FormItem>);
        }}/>
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2"/>
                    Pricing & Discount
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField control={form.control} name="dealType" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-8">
                            <div className="flex items-center space-x-2" data-testid="radio-percentage">
                              <RadioGroupItem value="percentage" id="percentage"/>
                              <Label htmlFor="percentage">Percentage (%)</Label>
                            </div>
                            <div className="flex items-center space-x-2" data-testid="radio-fixed">
                              <RadioGroupItem value="fixed" id="fixed"/>
                              <Label htmlFor="fixed">Fixed Amount ($)</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>

                  <FormField control={form.control} name="discountValue" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>
                          {form.watch("dealType") === "percentage" ? "Discount Percentage" : "Discount Amount"}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder={form.watch("dealType") === "percentage" ? "25" : "5.00"} {...field} data-testid="input-discount-value"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>

                  <FormField control={form.control} name="minOrderAmount" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>Minimum Order Amount (Optional)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="20.00" {...field} data-testid="input-min-order"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2"/>
                    Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-start-date"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
        }}/>

                    <FormField control={form.control} name="endDate" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-end-date"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
        }}/>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="startTime" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} data-testid="input-start-time"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
        }}/>

                    <FormField control={form.control} name="endTime" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} data-testid="input-end-time"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
        }}/>
                  </div>
                </CardContent>
              </Card>

              {/* Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2"/>
                    Usage Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="totalUsesLimit" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                          <FormLabel>Total Uses Limit (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} data-testid="input-total-limit"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
        }}/>

                    <FormField control={form.control} name="perCustomerLimit" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                          <FormLabel>Per Customer Limit</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1" {...field} data-testid="input-customer-limit"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>);
        }}/>
                  </div>
                </CardContent>
              </Card>

              {/* Image Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2"/>
                    Special Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" data-testid="input-image-upload"/>
                    
                    {selectedImage ? (<div className="relative">
                        <img src={selectedImage} alt="Special" className="w-full h-48 object-cover rounded-lg"/>
                        <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeImage} data-testid="button-remove-image">
                          <X className="w-4 h-4"/>
                        </Button>
                      </div>) : (<div onClick={function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors" data-testid="button-upload-image">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground">
                          Click to upload an image (Max 5MB)
                        </p>
                      </div>)}
                  </div>
                </CardContent>
              </Card>

              {/* Facebook Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2"/>
                    Social Media
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField control={form.control} name="facebookPageUrl" render={function (_a) {
            var field = _a.field;
            return (<FormItem>
                        <FormLabel>Facebook Page URL (Optional)</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://facebook.com/yourpage" {...field} data-testid="input-facebook-url"/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>);
        }}/>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex space-x-4 sticky bottom-6 bg-background py-4">
                <Button type="submit" disabled={updateDealMutation.isPending || !isDirty} className="flex-1" data-testid="button-save-changes">
                  <Save className="w-4 h-4 mr-2"/>
                  {updateDealMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                
                <Button type="button" variant="outline" onClick={function () { return setShowPreview(!showPreview); }} data-testid="button-preview">
                  <Eye className="w-4 h-4 mr-2"/>
                  Preview
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Preview Panel */}
        {showPreview && (<div className="lg:w-80 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border overflow-hidden">
                  {dealPreviewData.image && (<img src={dealPreviewData.image} alt={dealPreviewData.title} className="w-full h-32 object-cover"/>)}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg">{dealPreviewData.title}</h3>
                      {dealPreviewData.isActive ? (<Badge className="bg-green-500">Active</Badge>) : (<Badge variant="secondary">Inactive</Badge>)}
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      {dealPreviewData.description}
                    </p>
                    <div className="flex items-center space-x-2 text-sm">
                      <Badge variant="secondary">
                        {dealPreviewData.dealType === "percentage"
                ? "".concat(dealPreviewData.discountValue, "% off")
                : "$".concat(dealPreviewData.discountValue, " off")}
                      </Badge>
                      {dealPreviewData.minOrderAmount && (<span className="text-muted-foreground">
                          Min ${dealPreviewData.minOrderAmount}
                        </span>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>)}
      </div>
    </div>);
}
