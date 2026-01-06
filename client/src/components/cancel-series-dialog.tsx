import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CancelSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seriesId: number;
  seriesName: string;
  futureOccurrencesCount: number;
  affectedTrucksCount: number;
}

interface CancellationResponse {
  success: boolean;
  futureOccurrencesCancelled: number;
  trucksNotified: number;
}

export function CancelSeriesDialog({
  open,
  onOpenChange,
  seriesId,
  seriesName,
  futureOccurrencesCount,
  affectedTrucksCount,
}: CancelSeriesDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const cancelSeriesMutation = useMutation<CancellationResponse, Error>({
    mutationFn: async () => {
      const response = await fetch(`/api/hosts/event-series/${seriesId}/cancel`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel series");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-series"] });
      queryClient.invalidateQueries({ queryKey: ["host-events"] });
      
      // Reset state and close dialog
      setIsConfirmed(false);
      onOpenChange(false);

      // Show success feedback
      alert(
        `Series cancelled successfully!\n\n` +
        `• ${data.futureOccurrencesCancelled} future occurrence(s) cancelled\n` +
        `• ${data.trucksNotified} truck(s) notified by email`
      );
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleCancel = () => {
    if (!isConfirmed) {
      alert("Please confirm by checking the box before cancelling.");
      return;
    }
    cancelSeriesMutation.mutate();
  };

  const handleClose = () => {
    if (!cancelSeriesMutation.isPending) {
      setIsConfirmed(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Cancel Event Series
          </DialogTitle>
          <DialogDescription>
            This action will cancel all future occurrences of this series. Past events will not be affected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="font-semibold text-red-900 mb-2">{seriesName}</h4>
            <div className="space-y-1 text-sm text-red-800">
              <p>
                <strong>{futureOccurrencesCount}</strong> future occurrence{futureOccurrencesCount !== 1 ? "s" : ""} will be cancelled
              </p>
              <p>
                <strong>{affectedTrucksCount}</strong> truck{affectedTrucksCount !== 1 ? "s" : ""} will be notified by email
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Note:</strong> This action cannot be undone. All interested and accepted trucks will be notified automatically.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300"
              disabled={cancelSeriesMutation.isPending}
            />
            <span className="text-sm text-gray-700">
              I understand that cancelling this series will remove all future occurrences and notify all affected trucks. This action cannot be reversed.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={cancelSeriesMutation.isPending}
          >
            Keep Series
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!isConfirmed || cancelSeriesMutation.isPending}
          >
            {cancelSeriesMutation.isPending ? "Cancelling..." : "Cancel Series"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
