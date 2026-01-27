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
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, ArrowLeft, User, Calendar, AlertCircle } from "lucide-react";
import { getOptimizedImageUrl } from "@/lib/images";
export default function ReviewsPage() {
    var _this = this;
    var restaurantId = useParams().restaurantId;
    var _a = useState(0), newRating = _a[0], setNewRating = _a[1];
    var _b = useState(""), newReviewText = _b[0], setNewReviewText = _b[1];
    var _c = useState(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var toast = useToast().toast;
    var queryClient = useQueryClient();
    // Fetch restaurant details
    var restaurant = useQuery({
        queryKey: ["/api/restaurants/".concat(restaurantId)],
        enabled: !!restaurantId,
    }).data;
    // Fetch reviews for this restaurant
    var _d = useQuery({
        queryKey: ["/api/reviews/restaurant/".concat(restaurantId)],
        enabled: !!restaurantId,
    }), _e = _d.data, reviews = _e === void 0 ? [] : _e, isLoading = _d.isLoading;
    // Submit review mutation
    var submitReviewMutation = useMutation({
        mutationFn: function (reviewData) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest("POST", "/api/reviews", __assign(__assign({}, reviewData), { restaurantId: restaurantId, comment: reviewData.reviewText }))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Review Posted",
                description: "Thank you for sharing your feedback!",
            });
            setNewRating(0);
            setNewReviewText("");
            setIsSubmitting(false);
            // Invalidate and refetch reviews
            queryClient.invalidateQueries({ queryKey: ["/api/reviews/restaurant/".concat(restaurantId)] });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to post review. Please try again.",
                variant: "destructive",
            });
            setIsSubmitting(false);
        },
    });
    var handleSubmitReview = function () {
        if (newRating === 0) {
            toast({
                title: "Rating Required",
                description: "Please select a star rating before submitting.",
                variant: "destructive",
            });
            return;
        }
        if (newReviewText.trim().length < 10) {
            toast({
                title: "Review Too Short",
                description: "Please write at least 10 characters in your review.",
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        submitReviewMutation.mutate({
            rating: newRating,
            reviewText: newReviewText.trim(),
        });
    };
    var renderStars = function (rating, interactive, size) {
        if (interactive === void 0) { interactive = false; }
        if (size === void 0) { size = "md"; }
        var starSize = size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6";
        return (<div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map(function (star) { return (<button key={star} onClick={function () { return interactive && setNewRating(star); }} disabled={!interactive} className={"".concat(starSize, " ").concat(interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default")} data-testid={"star-".concat(star)}>
            <Star className={"w-full h-full ".concat(star <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-gray-300")}/>
          </button>); })}
      </div>);
    };
    var formatDate = function (dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };
    var averageRating = reviews.length > 0
        ? (reviews.reduce(function (sum, review) { return sum + review.rating; }, 0) / reviews.length).toFixed(1)
        : "0.0";
    return (<div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center space-x-4 mb-4">
          <Link href={"/restaurant/".concat(restaurantId)}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4"/>
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Reviews</h1>
            <p className="text-sm text-muted-foreground">
              {(restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) || "Loading..."}
            </p>
          </div>
        </div>

        {/* Rating Summary */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold text-foreground">
              {averageRating}
            </div>
            <div>
              {renderStars(parseFloat(averageRating), false, "md")}
              <div className="text-sm text-muted-foreground mt-1">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Write Review Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating Stars */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your Rating
              </label>
              {renderStars(newRating, true, "lg")}
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your Review
              </label>
              <Textarea value={newReviewText} onChange={function (e) { return setNewReviewText(e.target.value); }} placeholder="Share your experience at this restaurant..." className="min-h-24 resize-none" maxLength={500} data-testid="textarea-review"/>
              <div className="text-right text-xs text-muted-foreground mt-1">
                {newReviewText.length}/500
              </div>
            </div>

            {/* Submit Button */}
            <Button onClick={handleSubmitReview} disabled={isSubmitting || newRating === 0 || newReviewText.trim().length < 10} className="w-full" data-testid="button-submit-review">
              {isSubmitting ? "Posting..." : "Post Review"}
            </Button>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            All Reviews ({reviews.length})
          </h2>

          {isLoading ? (<div className="space-y-4">
              {[1, 2, 3].map(function (i) { return (<Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full"/>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/2"/>
                        <div className="h-3 bg-muted rounded w-1/3"/>
                        <div className="h-16 bg-muted rounded"/>
                      </div>
                    </div>
                  </CardContent>
                </Card>); })}
            </div>) : reviews.length > 0 ? (<div className="space-y-4">
              {reviews.map(function (review) {
                var _a;
                return (<Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        {((_a = review.user) === null || _a === void 0 ? void 0 : _a.profileImageUrl) ? (<img src={getOptimizedImageUrl(review.user.profileImageUrl, "medium")} alt="User avatar" className="w-10 h-10 rounded-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer"/>) : (<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary"/>
                          </div>)}
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-sm text-foreground">
                              {review.user ?
                        "".concat(review.user.firstName, " ").concat(review.user.lastName) :
                        "Anonymous User"}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3"/>
                              <span>{formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                          {renderStars(review.rating, false, "sm")}
                        </div>

                        <p className="text-sm text-foreground leading-relaxed">
                          {review.reviewText}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>);
            })}
            </div>) : (<Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-muted-foreground text-sm">
                  Be the first to share your experience at this restaurant!
                </p>
              </CardContent>
            </Card>)}
        </div>
      </div>

      <Navigation />
    </div>);
}
