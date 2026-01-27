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
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackHeader } from "@/components/back-header";
import { MapPin, Phone, Star, Clock, Navigation as DirectionsIcon, Heart, CheckCircle, Store } from "lucide-react";
import { SEOHead } from "@/components/seo-head";
import { MinimalFAQ } from "@/components/seo-faq";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ShareButton from "@/components/share-button";
export default function RestaurantDetailPage() {
    var _this = this;
    var restaurantId = useParams().id;
    var user = useAuth().user;
    var toast = useToast().toast;
    var _a = useState(false), isSubmittingBooking = _a[0], setIsSubmittingBooking = _a[1];
    var _b = useState({
        name: "",
        email: (user === null || user === void 0 ? void 0 : user.email) || "",
        phone: "",
        expectedGuests: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        notes: "",
    }), bookingForm = _b[0], setBookingForm = _b[1];
    var _c = useQuery({
        queryKey: ["/api/restaurants", restaurantId],
        enabled: !!restaurantId,
    }), restaurant = _c.data, restaurantLoading = _c.isLoading;
    var reviews = useQuery({
        queryKey: ["/api/reviews/restaurant", restaurantId],
        enabled: !!restaurantId,
    }).data;
    var rating = useQuery({
        queryKey: ["/api/reviews/restaurant", restaurantId, "rating"],
        enabled: !!restaurantId,
    }).data;
    var featuredDeals = useQuery({
        queryKey: ["/api/deals/featured"],
        enabled: true,
    }).data;
    var isStaffOrAdmin = (user === null || user === void 0 ? void 0 : user.userType) === "staff" ||
        (user === null || user === void 0 ? void 0 : user.userType) === "admin" ||
        (user === null || user === void 0 ? void 0 : user.userType) === "super_admin";
    var isFoodTruck = (restaurant === null || restaurant === void 0 ? void 0 : restaurant.isFoodTruck) ||
        (restaurant === null || restaurant === void 0 ? void 0 : restaurant.businessType) === "food_truck";
    var _d = useQuery({
        queryKey: ["/api/bookings/truck", restaurantId, "schedule"],
        enabled: !!restaurantId && !!isFoodTruck,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/bookings/truck/".concat(restaurantId, "/schedule"))];
                    case 1:
                        res = _a.sent();
                        if (!res.ok) {
                            throw new Error("Failed to load schedule");
                        }
                        return [2 /*return*/, res.json()];
                }
            });
        }); },
    }), scheduleData = _d.data, scheduleLoading = _d.isLoading;
    var scheduleItems = Array.isArray(scheduleData === null || scheduleData === void 0 ? void 0 : scheduleData.schedule)
        ? scheduleData.schedule
        : [];
    var formatSlotSummary = function (value) {
        return value
            .split(",")
            .map(function (slot) { return slot.trim(); })
            .filter(Boolean)
            .map(function (slot) { return slot.charAt(0).toUpperCase() + slot.slice(1); })
            .join(", ");
    };
    var handleBookingFieldChange = function (e) {
        setBookingForm(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[e.target.name] = e.target.value, _a)));
        });
    };
    var handleSubmitBookingRequest = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!restaurantId)
                        return [2 /*return*/];
                    setIsSubmittingBooking(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/trucks/".concat(restaurantId, "/booking-request"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(bookingForm),
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json().catch(function () { return ({}); })];
                case 3:
                    data = _a.sent();
                    throw new Error(data.message || "Failed to send request");
                case 4:
                    toast({
                        title: "Request sent",
                        description: "The truck owner will follow up by email.",
                    });
                    setBookingForm({
                        name: "",
                        email: (user === null || user === void 0 ? void 0 : user.email) || "",
                        phone: "",
                        expectedGuests: "",
                        date: "",
                        startTime: "",
                        endTime: "",
                        location: "",
                        notes: "",
                    });
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    toast({
                        title: "Request failed",
                        description: error_1.message || "Please try again.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    setIsSubmittingBooking(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    if (restaurantLoading) {
        return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="animate-pulse">
          <div className="w-full h-64 bg-muted"></div>
          <div className="p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </div>
      </div>);
    }
    if (!restaurant) {
        return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-4">Restaurant not found</h2>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
        <Navigation />
      </div>);
    }
    // Filter deals for this restaurant
    var allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
    var restaurantDeals = allDeals.filter(function (deal) { return deal.restaurantId === restaurantId; });
    var currentRating = (rating === null || rating === void 0 ? void 0 : rating.rating) || 0;
    var reviewCount = Array.isArray(reviews) ? reviews.length : 0;
    var rightActions = (<Button variant="ghost" size="sm" className="bg-white/90 backdrop-blur-sm" data-testid="button-save-restaurant">
      <Heart className="w-4 h-4"/>
    </Button>);
    var restaurantName = (restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) || 'Restaurant';
    var cuisineType = (restaurant === null || restaurant === void 0 ? void 0 : restaurant.cuisineType) || 'food';
    var address = (restaurant === null || restaurant === void 0 ? void 0 : restaurant.address) || '';
    var description = "Visit ".concat(restaurantName, " and discover exclusive food deals. ").concat(cuisineType, " restaurant with ").concat(restaurantDeals.length, " active deals. ").concat(currentRating > 0 ? "Rated ".concat(currentRating.toFixed(1), " stars by ").concat(reviewCount, " customers.") : '');
    var localBusinessSchema = __assign({ "@context": "https://schema.org", "@type": "Restaurant", "name": restaurantName, "description": description, "address": {
            "@type": "PostalAddress",
            "streetAddress": address
        }, "telephone": (restaurant === null || restaurant === void 0 ? void 0 : restaurant.phone) || "", "servesCuisine": cuisineType, "url": "https://mealscout.us/restaurants/".concat(restaurantId) }, (currentRating > 0 && reviewCount > 0 ? {
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": currentRating.toFixed(1),
            "reviewCount": reviewCount
        }
    } : {}));
    return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <SEOHead title={"".concat(restaurantName, " - ").concat(cuisineType, " Restaurant | MealScout")} description={description} keywords={"".concat(restaurantName, ", ").concat(cuisineType, " restaurant, restaurant deals, ").concat(address, ", food discounts")} canonicalUrl={"https://mealscout.us/restaurants/".concat(restaurantId)} schemaData={localBusinessSchema}/>
      <BackHeader title={restaurantName} fallbackHref="/" icon={Store} rightActions={rightActions}/>
      
      {/* Header Image */}
      <div className="relative h-48 bg-gradient-to-br from-red-100 to-orange-100 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Restaurant Image Placeholder */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-white/80">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">--</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="px-6 py-6">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-foreground flex items-center space-x-2" data-testid="text-restaurant-name">
              <span>{restaurant === null || restaurant === void 0 ? void 0 : restaurant.name}</span>
              {(restaurant === null || restaurant === void 0 ? void 0 : restaurant.isVerified) && (<CheckCircle className="w-5 h-5 text-green-500" data-testid="icon-verified-restaurant"/>)}
            </h1>
            {(restaurant === null || restaurant === void 0 ? void 0 : restaurant.cuisineType) && (<Badge variant="secondary" data-testid="badge-cuisine-type">
                {restaurant === null || restaurant === void 0 ? void 0 : restaurant.cuisineType}
              </Badge>)}
          </div>
          <div className="mb-3">
            <ShareButton url={"/restaurant/".concat(restaurantId)} title={"Check out ".concat((restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) || "this spot", " on MealScout")} description={(restaurant === null || restaurant === void 0 ? void 0 : restaurant.description) || "Discover this location on MealScout."} size="sm" variant="outline"/>
          </div>
          
          {/* Rating */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
              <span className="font-semibold" data-testid="text-rating">
                {currentRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-sm" data-testid="text-review-count">
                ({reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-green-600">
              <Clock className="w-4 h-4"/>
              <span>Open now</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start space-x-2 mb-4">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5"/>
            <div>
              <p className="text-sm text-foreground" data-testid="text-restaurant-address">
                {restaurant === null || restaurant === void 0 ? void 0 : restaurant.address}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          {(restaurant === null || restaurant === void 0 ? void 0 : restaurant.phone) && (<div className="flex items-center space-x-2 mb-6">
              <Phone className="w-4 h-4 text-muted-foreground"/>
              <p className="text-sm text-foreground" data-testid="text-restaurant-phone">
                {restaurant === null || restaurant === void 0 ? void 0 : restaurant.phone}
              </p>
            </div>)}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button className="flex-1" data-testid="button-directions">
              <DirectionsIcon className="w-4 h-4 mr-2"/>
              Directions
            </Button>
            <Button variant="outline" className="flex-1" data-testid="button-call-restaurant">
              <Phone className="w-4 h-4 mr-2"/>
              Call
            </Button>
            {isFoodTruck && (<Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1" data-testid="button-book-truck">
                    Book This Truck
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Book {restaurantName}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input id="name" name="name" value={bookingForm.name} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={bookingForm.email} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" value={bookingForm.phone} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="expectedGuests">Expected Guests</Label>
                      <Input id="expectedGuests" name="expectedGuests" value={bookingForm.expectedGuests} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" value={bookingForm.date} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input id="startTime" name="startTime" type="time" value={bookingForm.startTime} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input id="endTime" name="endTime" type="time" value={bookingForm.endTime} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" value={bookingForm.location} onChange={handleBookingFieldChange}/>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" name="notes" value={bookingForm.notes} onChange={handleBookingFieldChange} rows={4}/>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSubmitBookingRequest} disabled={isSubmittingBooking}>
                      {isSubmittingBooking ? "Sending..." : "Send Request"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>)}
            {!isFoodTruck && (<Button variant="outline" className="flex-1" data-testid="button-view-specials" onClick={function () {
                var _a;
                return (_a = document
                    .getElementById("restaurant-specials")) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
            }}>
                View Specials
              </Button>)}
          </div>
        </div>

        {isFoodTruck && (<div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Upcoming Schedule
            </h2>
            {scheduleLoading ? (<Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading schedule...
                </CardContent>
              </Card>) : scheduleItems.length > 0 ? (<div className="space-y-3">
                {scheduleItems.map(function (item) { return (<Card key={item.type === "manual"
                        ? "manual-".concat(item.manual.id)
                        : "".concat(item.type, "-").concat(item.event.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        {item.type === "manual" ? (<div>
                            <p className="font-semibold text-foreground">
                              {new Date(item.manual.date).toLocaleDateString()}{" "}
                              - {item.manual.startTime} - {item.manual.endTime}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.manual.locationName
                            ? "".concat(item.manual.locationName, " - ")
                            : ""}
                              {item.manual.address}
                            </p>
                          </div>) : (<div>
                            <p className="font-semibold text-foreground">
                              {new Date(item.event.date).toLocaleDateString()} -{" "}
                              {item.event.startTime} - {item.event.endTime}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.host.businessName} - {item.host.address}
                            </p>
                            {item.slotType && (<p className="text-xs text-muted-foreground">
                                Slots: {formatSlotSummary(String(item.slotType))}
                              </p>)}
                          </div>)}
                        <Badge variant="secondary">
                          {item.type === "manual"
                        ? "Manual"
                        : item.type === "booking"
                            ? "Booked"
                            : "Accepted"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>); })}
              </div>) : (<Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No upcoming bookings or accepted events yet.
                </CardContent>
              </Card>)}
          </div>)}

        {/* Current Specials */}
        <div className="mb-8" id="restaurant-specials">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Current Specials
          </h2>
          {restaurantDeals.length > 0 ? (<div className="space-y-4">
              {restaurantDeals.map(function (deal) { return (<DealCard key={deal.id} deal={deal}/>); })}
            </div>) : (<Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">-</span>
                </div>
                <p className="text-muted-foreground">
                  No current specials available
                </p>
                <p className="text-sm text-muted-foreground mt-1">Check back soon!</p>
              </CardContent>
            </Card>)}
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Reviews</h2>
            <Button variant="outline" size="sm" data-testid="button-write-review">
              Write Review
            </Button>
          </div>
          
          {Array.isArray(reviews) && reviews.length > 0 ? (<div className="space-y-4">
              {reviews.slice(0, 3).map(function (review) { return (<Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">U</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">User</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(function (star) { return (<Star key={star} className={"w-3 h-3 ".concat(star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')}/>); })}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>); })}
            </div>) : (<Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-muted-foreground"/>
                </div>
                <p className="text-muted-foreground">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-1">Be the first to review this restaurant!</p>
              </CardContent>
            </Card>)}
        </div>

        {/* FAQ Section - SEO optimized, minimal UI */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <MinimalFAQ items={[
            {
                question: "Does ".concat(restaurantName, " offer delivery?"),
                answer: "Contact ".concat(restaurantName, " directly at ").concat((restaurant === null || restaurant === void 0 ? void 0 : restaurant.phone) || 'their phone number', " to inquire about delivery options and availability in your area.")
            },
            {
                question: "What are the current specials at ".concat(restaurantName, "?"),
                answer: "".concat(restaurantName, " has ").concat(restaurantDeals.length, " active specials available on MealScout. View all current specials and claim offers directly from this page.")
            },
            {
                question: "What type of cuisine does ".concat(restaurantName, " serve?"),
                answer: "".concat(restaurantName, " specializes in ").concat(cuisineType, " cuisine. Check the menu and reviews above for specific dishes and customer favorites.")
            },
            {
                question: "How do I get directions to ".concat(restaurantName, "?"),
                answer: "".concat(restaurantName, " is located at ").concat(address, ". Click the Directions button above to open navigation in your maps app.")
            }
        ]} className="mt-6"/>
        </div>
      </div>

      <Navigation />
    </div>);
}
