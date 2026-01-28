import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface EditOccurrenceDialogProps {
  event: {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    maxTrucks: number;
    hardCapEnabled?: boolean;
    seriesId?: string | null;
  } | null;
  seriesName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
}

export function EditOccurrenceDialog({
  event,
  seriesName,
  open,
  onOpenChange,
  onEventUpdated,
}: EditOccurrenceDialogProps) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxTrucks, setMaxTrucks] = useState(1);
  const [hardCapEnabled, setHardCapEnabled] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when event changes
  useEffect(() => {
    if (event) {
      setStartTime(event.startTime);
      setEndTime(event.endTime);
      setMaxTrucks(event.maxTrucks);
      setHardCapEnabled(event.hardCapEnabled || false);
      setError("");
    }
  }, [event]);

  const handleSave = async () => {
    if (!event) return;

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/hosts/parking-pass/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime,
          endTime,
          maxTrucks,
          hardCapEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update parking pass listing");
      }

      onOpenChange(false);
      onEventUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
        <DialogTitle>Edit Parking Pass Listing</DialogTitle>
          <DialogDescription>
            Update time window, capacity, or enforcement for this listing.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {seriesName && (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertTitle>Part of Series: {seriesName}</AlertTitle>
            <AlertDescription>
              Changes apply to <strong>{format(new Date(event.date), "MMMM d, yyyy")}</strong> only.
              Other occurrences in this series are not affected.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="bg-slate-50 border rounded-md p-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{format(new Date(event.date), "EEEE, MMMM d, yyyy")}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start-time">Start Time</Label>
              <Input
                id="edit-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end-time">End Time</Label>
              <Input
                id="edit-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-max-trucks">Max Trucks</Label>
              <Input
                id="edit-max-trucks"
                type="number"
                min="1"
                max="20"
                value={maxTrucks}
                onChange={(e) => setMaxTrucks(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 border p-4 rounded-md border-slate-200 bg-slate-50">
            <Switch
              id="edit-hard-cap"
              checked={hardCapEnabled}
              onCheckedChange={setHardCapEnabled}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-hard-cap" className="font-semibold">
                  Capacity Guard v2.2
                </Label>
                <Badge variant="secondary" className="text-xs">This Occurrence</Badge>
              </div>
              <p className="text-sm text-slate-500">
                Strictly enforces capacity limit for this date. Once full, no further approvals allowed.
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>This override applies only to this occurrence.</li>
                {seriesName && <li>Other dates in "{seriesName}" keep their original settings.</li>}
                <li>If capacity is reduced, existing accepted trucks are not automatically removed.</li>
                <li>Capacity Guard enforcement applies immediately after save.</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
