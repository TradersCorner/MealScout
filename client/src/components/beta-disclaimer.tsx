import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Bug, Sparkles } from "lucide-react";

export function BetaDisclaimer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem("beta-disclaimer-seen");
    if (!hasSeenDisclaimer) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("beta-disclaimer-seen", "true");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent data-testid="dialog-beta-disclaimer" className="max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            <AlertDialogTitle className="text-2xl">Welcome to MealScout Beta!</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <p className="text-foreground font-medium">
              You're experiencing an early version of MealScout. We're excited to have you here!
            </p>
            <p>
              <strong className="text-foreground">We encourage you to:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Try all features and explore the platform</li>
              <li>Report any bugs or issues you encounter</li>
              <li>Share your feedback to help us improve</li>
            </ul>
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-3 mt-4">
              <div className="flex items-start gap-2">
                <Bug className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Found a bug? Use the bug report button (bottom right corner) to send us a screenshot with one click!
                </p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button 
            onClick={handleClose} 
            className="w-full sm:w-auto"
            data-testid="button-beta-disclaimer-close"
          >
            Got it, let's explore!
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
