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
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
export function DealFeedback(_a) {
    var _this = this;
    var dealId = _a.dealId, _b = _a.compact, compact = _b === void 0 ? false : _b;
    var toast = useToast().toast;
    var _c = useState(0), rating = _c[0], setRating = _c[1];
    var _d = useState(0), hoveredRating = _d[0], setHoveredRating = _d[1];
    var _e = useState('rating'), feedbackType = _e[0], setFeedbackType = _e[1];
    var _f = useState(''), comment = _f[0], setComment = _f[1];
    var _g = useState(null), isHelpful = _g[0], setIsHelpful = _g[1];
    var _h = useState(false), showForm = _h[0], setShowForm = _h[1];
    var stats = useQuery({
        queryKey: ['/api/deals', dealId, 'feedback', 'stats'],
    }).data;
    var submitFeedbackMutation = useMutation({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, apiRequest('POST', "/api/deals/".concat(dealId, "/feedback"), data)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'feedback'] });
            queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'feedback', 'stats'] });
            toast({
                title: "Thank you!",
                description: "Your feedback helps us improve deal quality.",
            });
            setRating(0);
            setComment('');
            setFeedbackType('rating');
            setIsHelpful(null);
            setShowForm(false);
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit feedback. Please try again.",
                variant: "destructive",
            });
        },
    });
    var handleSubmit = function () {
        if (rating === 0) {
            toast({
                title: "Rating Required",
                description: "Please select a star rating before submitting.",
                variant: "destructive",
            });
            return;
        }
        submitFeedbackMutation.mutate({
            rating: rating,
            feedbackType: feedbackType,
            comment: comment.trim() || null,
            isHelpful: isHelpful,
        });
    };
    if (compact) {
        return (<div className="flex items-center gap-2" data-testid="feedback-compact" onClick={function (e) { return e.stopPropagation(); }}>
        {stats && stats.totalFeedback > 0 && (<div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400"/>
            <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({stats.totalFeedback})</span>
          </div>)}
        {!showForm ? (<Button variant="outline" size="sm" onClick={function (e) {
                    e.stopPropagation();
                    setShowForm(true);
                }} className="text-sm font-medium" data-testid="button-show-feedback-form">
            Rate Deal
          </Button>) : (<div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(function (star) { return (<button key={star} onClick={function (e) {
                        e.stopPropagation();
                        setRating(star);
                    }} onMouseEnter={function () { return setHoveredRating(star); }} onMouseLeave={function () { return setHoveredRating(0); }} className="transition-transform hover:scale-110" data-testid={"star-".concat(star)}>
                  <Star className={"h-5 w-5 ".concat(star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300')}/>
                </button>); })}
            </div>
            <Button size="sm" onClick={function (e) {
                    e.stopPropagation();
                    handleSubmit();
                }} disabled={rating === 0 || submitFeedbackMutation.isPending} data-testid="button-submit-rating">
              {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={function (e) {
                    e.stopPropagation();
                    setShowForm(false);
                }} data-testid="button-cancel-feedback">
              Cancel
            </Button>
          </div>)}
      </div>);
    }
    return (<div className="space-y-4 p-4 border rounded-lg" data-testid="feedback-full">
      <div>
        <h3 className="text-lg font-semibold mb-2">Rate This Deal</h3>
        {stats && stats.totalFeedback > 0 && (<div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400"/>
              <span className="font-medium text-lg">{stats.averageRating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Based on {stats.totalFeedback} {stats.totalFeedback === 1 ? 'review' : 'reviews'}
            </span>
          </div>)}
      </div>

      <div>
        <Label className="mb-2 block">Your Rating</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(function (star) { return (<button key={star} onClick={function () { return setRating(star); }} onMouseEnter={function () { return setHoveredRating(star); }} onMouseLeave={function () { return setHoveredRating(0); }} className="transition-transform hover:scale-110" data-testid={"star-".concat(star)}>
              <Star className={"h-8 w-8 ".concat(star <= (hoveredRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300')}/>
            </button>); })}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Feedback Type</Label>
        <RadioGroup value={feedbackType} onValueChange={function (value) { return setFeedbackType(value); }} data-testid="feedback-type-selector">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rating" id="rating" data-testid="radio-rating"/>
            <Label htmlFor="rating" className="cursor-pointer">General Rating</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="suggestion" id="suggestion" data-testid="radio-suggestion"/>
            <Label htmlFor="suggestion" className="cursor-pointer">Suggestion for Improvement</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="issue" id="issue" data-testid="radio-issue"/>
            <Label htmlFor="issue" className="cursor-pointer">Report an Issue</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="mb-2 block">Did the deal work as expected?</Label>
        <RadioGroup value={isHelpful === null ? '' : isHelpful.toString()} onValueChange={function (value) { return setIsHelpful(value === 'true'); }} data-testid="helpful-selector">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="helpful-yes" data-testid="radio-helpful-yes"/>
            <Label htmlFor="helpful-yes" className="cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="helpful-no" data-testid="radio-helpful-no"/>
            <Label htmlFor="helpful-no" className="cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="comment" className="mb-2 block">
          Additional Comments (Optional)
        </Label>
        <Textarea id="comment" placeholder="Share your experience with this deal..." value={comment} onChange={function (e) { return setComment(e.target.value); }} maxLength={500} rows={4} data-testid="textarea-comment"/>
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/500 characters
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={rating === 0 || submitFeedbackMutation.isPending} data-testid="button-submit-feedback">
          {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
        {rating > 0 && (<Button variant="outline" onClick={function () {
                setRating(0);
                setComment('');
                setFeedbackType('rating');
                setIsHelpful(null);
            }} data-testid="button-reset-feedback">
            Reset
          </Button>)}
      </div>
    </div>);
}
