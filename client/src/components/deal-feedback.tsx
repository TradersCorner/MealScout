import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface DealFeedbackProps {
  dealId: string;
  compact?: boolean;
}

export function DealFeedback({ dealId, compact = false }: DealFeedbackProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState<'rating' | 'suggestion' | 'issue'>('rating');
  const [comment, setComment] = useState('');
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: stats } = useQuery<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: { [key: number]: number };
  }>({
    queryKey: ['/api/deals', dealId, 'feedback', 'stats'],
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/deals/${dealId}/feedback`, 'POST', data);
    },
    onSuccess: () => {
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      rating,
      feedbackType,
      comment: comment.trim() || null,
      isHelpful,
    });
  };

  if (compact) {
    return (
      <div 
        className="flex items-center gap-2" 
        data-testid="feedback-compact"
        onClick={(e) => e.stopPropagation()}
      >
        {stats && stats.totalFeedback > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({stats.totalFeedback})</span>
          </div>
        )}
        {!showForm ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowForm(true);
            }}
            className="text-sm font-medium"
            data-testid="button-show-feedback-form"
          >
            Rate Deal
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRating(star);
                  }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              disabled={rating === 0 || submitFeedbackMutation.isPending}
              data-testid="button-submit-rating"
            >
              {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowForm(false);
              }}
              data-testid="button-cancel-feedback"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg" data-testid="feedback-full">
      <div>
        <h3 className="text-lg font-semibold mb-2">Rate This Deal</h3>
        {stats && stats.totalFeedback > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-lg">{stats.averageRating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Based on {stats.totalFeedback} {stats.totalFeedback === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Your Rating</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
              data-testid={`star-${star}`}
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Feedback Type</Label>
        <RadioGroup
          value={feedbackType}
          onValueChange={(value: any) => setFeedbackType(value)}
          data-testid="feedback-type-selector"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rating" id="rating" data-testid="radio-rating" />
            <Label htmlFor="rating" className="cursor-pointer">General Rating</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="suggestion" id="suggestion" data-testid="radio-suggestion" />
            <Label htmlFor="suggestion" className="cursor-pointer">Suggestion for Improvement</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="issue" id="issue" data-testid="radio-issue" />
            <Label htmlFor="issue" className="cursor-pointer">Report an Issue</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label className="mb-2 block">Did the deal work as expected?</Label>
        <RadioGroup
          value={isHelpful === null ? '' : isHelpful.toString()}
          onValueChange={(value) => setIsHelpful(value === 'true')}
          data-testid="helpful-selector"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="helpful-yes" data-testid="radio-helpful-yes" />
            <Label htmlFor="helpful-yes" className="cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="helpful-no" data-testid="radio-helpful-no" />
            <Label htmlFor="helpful-no" className="cursor-pointer">No</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label htmlFor="comment" className="mb-2 block">
          Additional Comments (Optional)
        </Label>
        <Textarea
          id="comment"
          placeholder="Share your experience with this deal..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={4}
          data-testid="textarea-comment"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {comment.length}/500 characters
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitFeedbackMutation.isPending}
          data-testid="button-submit-feedback"
        >
          {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
        </Button>
        {rating > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setRating(0);
              setComment('');
              setFeedbackType('rating');
              setIsHelpful(null);
            }}
            data-testid="button-reset-feedback"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
