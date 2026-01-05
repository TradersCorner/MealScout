import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

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
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [locationType, setLocationType] = useState("");
  const [expectedFootTraffic, setExpectedFootTraffic] = useState("");
  const [preferredDates, setPreferredDates] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const todayIso = new Date().toISOString().split("T")[0];

  const updateDate = (index: number, value: string) => {
    const next = [...preferredDates];
    next[index] = value;
    setPreferredDates(next);
  };

  const addDate = () => {
    if (preferredDates.length >= 3) return;
    setPreferredDates([...preferredDates, ""]);
  };

  const removeDate = (index: number) => {
    const next = preferredDates.filter((_, i) => i !== index);
    setPreferredDates(next.length ? next : [""]);
  };

  const validate = () => {
    const validationErrors: Record<string, string> = {};

    if (!businessName.trim()) {
      validationErrors.businessName = "Business name is required";
    }
    if (!address.trim()) {
      validationErrors.address = "Address is required";
    }
    if (!locationType) {
      validationErrors.locationType = "Select a location type";
    }

    const traffic = Number(expectedFootTraffic);
    if (Number.isNaN(traffic)) {
      validationErrors.expectedFootTraffic = "Enter expected foot traffic";
    } else if (traffic < 1 || traffic > 10000) {
      validationErrors.expectedFootTraffic = "Foot traffic must be between 1 and 10,000";
    }

    const cleanedDates = preferredDates.map((d) => d.trim()).filter(Boolean);
    if (!cleanedDates.length) {
      validationErrors.preferredDates = "Add at least one preferred date";
    } else if (cleanedDates.length > 3) {
      validationErrors.preferredDates = "You can only add up to 3 dates";
    } else {
      cleanedDates.forEach((date, idx) => {
        const parsed = new Date(`${date}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Number.isNaN(parsed.getTime())) {
          validationErrors.preferredDates = "Dates must be valid";
        } else if (parsed <= today) {
          validationErrors.preferredDates = "Dates must be in the future";
        }
        if (validationErrors.preferredDates && idx === 0) return;
      });
    }

    if (notes.length > 200) {
      validationErrors.notes = "Notes must be 200 characters or less";
    }

    setErrors(validationErrors);
    return validationErrors;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    if (!isAuthenticated) {
      setErrors({ auth: "Please log in to submit" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      const response = await fetch("/api/location-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          businessName: businessName.trim(),
          address: address.trim(),
          locationType,
          expectedFootTraffic: Number(expectedFootTraffic),
          preferredDates: preferredDates.map((d) => d.trim()).filter(Boolean),
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Unable to submit request");
      }

      const data = await response.json();
      setSubmittedRequestId(data.request?.id || null);
    } catch (error: any) {
      setErrors({ submit: error.message || "Unable to submit request" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-xl p-8 border border-slate-200">
          <p className="text-sm font-semibold text-rose-600 mb-2">Host trucks</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Sign in to host food trucks</h1>
          <p className="text-slate-600 mb-6">Create your host profile to let nearby trucks know when they can park at your location.</p>
          <Button asChild>
            <a href="/login?redirect=/host-signup">Sign in to continue</a>
          </Button>
        </div>
      </div>
    );
  }

  if (submittedRequestId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white shadow-sm rounded-xl p-8 border border-emerald-100">
          <p className="text-sm font-semibold text-emerald-600 mb-2">Request received</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Thanks for hosting trucks</h1>
          <p className="text-slate-700 mb-4">We shared your availability with nearby food trucks. You will get an email when a truck expresses interest. MealScout does not broker or guarantee bookings.</p>
          <div className="grid gap-3 text-sm text-slate-700">
            <div className="flex justify-between"><span className="text-slate-500">Request ID</span><span className="font-semibold">{submittedRequestId}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Auto-expiry</span><span className="font-semibold">30 days after posting</span></div>
          </div>
          <Button className="mt-6" asChild>
            <a href="/">Return home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex flex-col gap-3 mb-8">
        <p className="text-sm font-semibold text-rose-600">Host food trucks</p>
        <h1 className="text-4xl font-bold text-slate-900">Share your space, bring in great trucks</h1>
        <p className="text-lg text-slate-700 max-w-3xl">
          Tell nearby trucks when they can park at your property. No pay-to-play, no brokering. We notify trucks and pass their interest to you directly.
        </p>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Real-time availability</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" />Intent-gated outreach</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" />Expires after 30 days</span>
        </div>
      </div>

      <form className="bg-white shadow-sm rounded-xl border border-slate-200 p-8 grid gap-6" onSubmit={handleSubmit}>
        {errors.auth && <p className="text-sm text-rose-600">{errors.auth}</p>}
        {errors.submit && <p className="text-sm text-rose-600">{errors.submit}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme HQ"
              aria-invalid={Boolean(errors.businessName)}
              required
            />
            {errors.businessName && <p className="text-sm text-rose-600">{errors.businessName}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="locationType">Location type</Label>
            <select
              id="locationType"
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-invalid={Boolean(errors.locationType)}
              required
            >
              <option value="" disabled>Select a type</option>
              {locationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.locationType && <p className="text-sm text-rose-600">{errors.locationType}</p>}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Address where trucks can park</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Market St, Springfield"
            aria-invalid={Boolean(errors.address)}
            required
          />
          {errors.address && <p className="text-sm text-rose-600">{errors.address}</p>}
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="expectedFootTraffic">Expected foot traffic per day</Label>
            <Input
              id="expectedFootTraffic"
              type="number"
              min={1}
              max={10000}
              value={expectedFootTraffic}
              onChange={(e) => setExpectedFootTraffic(e.target.value)}
              aria-invalid={Boolean(errors.expectedFootTraffic)}
              required
            />
            <p className="text-xs text-slate-500">Range: 1 to 10,000 people</p>
            {errors.expectedFootTraffic && <p className="text-sm text-rose-600">{errors.expectedFootTraffic}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Preferred dates (max 3)</Label>
            <div className="grid gap-3">
              {preferredDates.map((date, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    type="date"
                    min={todayIso}
                    value={date}
                    onChange={(e) => updateDate(index, e.target.value)}
                    aria-invalid={Boolean(errors.preferredDates)}
                  />
                  <Button type="button" variant="ghost" className="text-slate-600" onClick={() => removeDate(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button type="button" variant="outline" onClick={addDate} disabled={preferredDates.length >= 3}>
                  Add another date
                </Button>
                <p className="text-xs text-slate-500">Must be future dates; auto-expires in 30 days</p>
              </div>
            </div>
            {errors.preferredDates && <p className="text-sm text-rose-600">{errors.preferredDates}</p>}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes for trucks (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            placeholder="Loading zone instructions, timing windows, power access..."
            aria-invalid={Boolean(errors.notes)}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Keep it concise (200 characters)</span>
            <span>{notes.length}/200</span>
          </div>
          {errors.notes && <p className="text-sm text-rose-600">{errors.notes}</p>}
        </div>

        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
          <p className="font-semibold mb-1">How it works</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We notify nearby food trucks when you post.</li>
            <li>They express interest with a short note; we email you their details.</li>
            <li>MealScout does not broker or guarantee bookings. Coordinate directly.</li>
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500">Your request expires after 30 days to keep availability fresh.</div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit host request"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default HostSignup;
