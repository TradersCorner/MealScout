import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const locationTypeOptions = [
  { value: "office", label: "Office / Corporate" },
  { value: "bar", label: "Bar" },
  { value: "brewery", label: "Brewery" },
  { value: "campus", label: "Campus" },
  { value: "event", label: "Event Space" },
  { value: "other", label: "Other" },
];

function HostSignup() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  const HOST_SIGNUP_DRAFT_KEY = "mealscout:host-signup-draft";

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [locationType, setLocationType] = useState("");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Load any saved draft once we know we're staying on this page
    try {
      const stored = window.localStorage.getItem(HOST_SIGNUP_DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<{
          businessName: string;
          address: string;
          city: string;
          state: string;
          contactName: string;
          contactEmail: string;
          contactPhone: string;
          locationType: string;
          description: string;
        }>;
        if (parsed.businessName) setBusinessName(parsed.businessName);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.city) setCity(parsed.city);
        if (parsed.state) setState(parsed.state);
        if (parsed.contactName) setContactName(parsed.contactName);
        if (parsed.contactEmail) setContactEmail(parsed.contactEmail);
        if (parsed.contactPhone) setContactPhone(parsed.contactPhone);
        if (parsed.locationType) setLocationType(parsed.locationType);
        if (parsed.description) setDescription(parsed.description);
      }
    } catch {
      // ignore parse/storage errors
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  // Persist host signup draft so hosts can resume later
  useEffect(() => {
    if (isLoading) return;
    try {
      const payload = {
        businessName,
        address,
        city,
        state,
        contactName,
        contactEmail,
        contactPhone,
        locationType,
        description,
      };
      window.localStorage.setItem(
        HOST_SIGNUP_DRAFT_KEY,
        JSON.stringify(payload)
      );
    } catch {
      // ignore storage errors
    }
  }, [
    isLoading,
    businessName,
    address,
    city,
    state,
    contactName,
    contactEmail,
    contactPhone,
    locationType,
    description,
  ]);

  const validate = () => {
    const validationErrors: Record<string, string> = {};

    if (!businessName.trim())
      validationErrors.businessName = "Business name is required";
    if (!address.trim()) validationErrors.address = "Address is required";
    if (!city.trim()) validationErrors.city = "City is required";
    if (!state.trim()) validationErrors.state = "State is required";
    if (!contactName.trim())
      validationErrors.contactName = "Contact name is required";
    if (!contactEmail.trim())
      validationErrors.contactEmail = "Contact email is required";
    if (!contactPhone.trim())
      validationErrors.contactPhone = "Contact phone is required";
    if (!locationType) validationErrors.locationType = "Select a location type";

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/hosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          address,
          city,
          state,
          contactName,
          contactEmail,
          contactPhone,
          locationType,
          description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create host profile");
      }

      setLocation("/host/dashboard");
      try {
        window.localStorage.removeItem(HOST_SIGNUP_DRAFT_KEY);
      } catch {
        // ignore
      }
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-xl p-8 border border-slate-200 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Become a MealScout Host
          </h1>
          <p className="text-slate-600 mb-8">
            Sign in to create your host profile and start managing food truck
            events.
          </p>
          <Button asChild size="lg">
            <a href="/login?redirect=/host-signup">Sign in to continue</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Create Host Profile
        </h1>
        <p className="text-slate-600">
          Tell us about your location to start hosting food trucks.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-sm rounded-xl border border-slate-200 p-8 space-y-6"
      >
        {errors.submit && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Business Details
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Tech Park Plaza"
            />
            {errors.businessName && (
              <p className="text-sm text-rose-600">{errors.businessName}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
            />
            {errors.address && (
              <p className="text-sm text-rose-600">{errors.address}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Austin"
              />
              {errors.city && (
                <p className="text-sm text-rose-600">{errors.city}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. TX"
              />
              {errors.state && (
                <p className="text-sm text-rose-600">{errors.state}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationType">Location Type</Label>
            <select
              id="locationType"
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a type...</option>
              {locationTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.locationType && (
              <p className="text-sm text-rose-600">{errors.locationType}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact Information
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Doe"
            />
            {errors.contactName && (
              <p className="text-sm text-rose-600">{errors.contactName}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="jane@example.com"
              />
              {errors.contactEmail && (
                <p className="text-sm text-rose-600">{errors.contactEmail}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
              {errors.contactPhone && (
                <p className="text-sm text-rose-600">{errors.contactPhone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Additional Details
          </h2>

          <div className="grid gap-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell trucks about parking, power availability, or specific rules..."
              className="h-32"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              "Create Host Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default HostSignup;
