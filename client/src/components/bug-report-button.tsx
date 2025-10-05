import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function BugReportButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const captureScreenshotAndReport = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
      });

      const screenshot = canvas.toDataURL("image/png");
      const currentUrl = window.location.href;
      const userAgent = navigator.userAgent;

      await apiRequest("POST", "/api/bug-report", {
        screenshot,
        currentUrl,
        userAgent,
      });

      toast({
        title: "Bug report sent!",
        description: "Thank you for helping us improve MealScout.",
      });
    } catch (error) {
      console.error("Failed to submit bug report:", error);
      toast({
        title: "Failed to send report",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      onClick={captureScreenshotAndReport}
      disabled={isSubmitting}
      size="lg"
      className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all z-50 bg-orange-500 hover:bg-orange-600 text-white"
      data-testid="button-bug-report"
      aria-label="Report a bug"
    >
      {isSubmitting ? (
        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <Bug className="h-6 w-6" />
      )}
    </Button>
  );
}
