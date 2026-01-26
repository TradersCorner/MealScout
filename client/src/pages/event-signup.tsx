import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Calendar, MapPin, Users } from "lucide-react";

export default function EventSignup() {
  const { user, isAuthenticated, isLoading, refetch } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEventCoordinator = user?.userType === "event_coordinator";

  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    city: "",
    expectedCrowd: "",
    contactEmail: user?.email || "",
    contactPhone: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit event request");
      }

      const data = await response.json();
      const isCoordinator = data?.userType === "event_coordinator";
      if (isCoordinator) {
        await refetch();
        toast({
          title: "Request submitted",
          description: "You can now post events from your dashboard.",
        });
        setLocation("/event-coordinator/dashboard");
        return;
      }

      toast({
        title: "Request submitted",
        description: "We will follow up soon.",
      });

      setLocation("/");
    } catch (error) {
      console.error("Event signup error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />

      <div className="container max-w-2xl mx-auto px-4 py-12">
        {isLoading ? null : !isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                Log in to request event access
              </CardTitle>
              <CardDescription className="text-lg">
                You will submit a request to become an event coordinator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setLocation("/login?redirect=/event-signup")}
              >
                Log in to continue
              </Button>
            </CardContent>
          </Card>
        ) : isEventCoordinator ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                You are already an event coordinator
              </CardTitle>
              <CardDescription className="text-lg">
                Go to your dashboard to post events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setLocation("/event-coordinator/dashboard")}
              >
                Open dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Request event coordinator access
            </CardTitle>
            <CardDescription className="text-lg">
              Share your event details and we will follow up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div>
                <Label htmlFor="eventName">Event Name *</Label>
                <Input
                  id="eventName"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  placeholder="Summer Block Party"
                />
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="date">Event Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="San Francisco"
                />
              </div>

              {/* Expected Crowd */}
              <div>
                <Label htmlFor="expectedCrowd">Expected Crowd *</Label>
                <Input
                  id="expectedCrowd"
                  name="expectedCrowd"
                  type="number"
                  value={formData.expectedCrowd}
                  onChange={handleChange}
                  required
                  placeholder="200"
                />
              </div>

              {/* Contact Email */}
              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Details</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Space available, power outlets, special requests..."
                />
              </div>

              {/* Trust Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">
                  ✓ Event organizers are always free
                  <br />
                  ✓ No hidden fees, now or later
                  <br />✓ We only charge booking fees to trucks
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Request Food Trucks (Free)"}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
