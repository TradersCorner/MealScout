import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Mail, ExternalLink } from "lucide-react";
import { BackHeader } from "@/components/back-header";

export default function HelpSupportPage() {
  const faqItems = [
    {
      id: "1",
      question: "How do I get started on MealScout?",
      answer: "Create an account, choose your user type, and complete your profile. You'll immediately see local listings and features for your role."
    },
    {
      id: "2",
      question: "How do parking passes work?",
      answer: "Hosts list locations. Trucks search and book available slots. Payment confirms the booking instantly—no pending holds."
    },
    {
      id: "3",
      question: "Where do I manage my profile and settings?",
      answer: "Use Profile → Settings for account details, notifications, and preferences. Business profiles act like mini websites for your customers."
    },
    {
      id: "4",
      question: "How do I contact support?",
      answer: "Email us and include the page you were on and any screenshots. We’ll get back to you within 24 hours."
    }
  ];

  const supportEmail = "info.mealscout@gmail.com";

  return (
    <div className="max-w-md mx-auto bg-[var(--bg-app)] min-h-screen relative pb-20">
      <BackHeader
        title="Help & Support"
        subtitle="Get help when you need it"
        fallbackHref="/profile"
        icon={HelpCircle}
        className="bg-[hsl(var(--background))] border-b border-white/5"
      />

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 space-y-6">
        {/* Contact Options */}}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>
          <Card className="border-0 shadow-clean-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Send us a detailed message
                    </p>
                    <p className="text-xs text-primary mt-1">
                      Response within 24h
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-email-support"
                  onClick={() => {
                    window.location.href = `mailto:${supportEmail}`;
                  }}
                >
                  Send Email
                </Button>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {supportEmail}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <Card key={item.id} className="border-0 shadow-clean-lg">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-2">{item.question}</h3>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Additional Resources</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">User Guide</span>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-user-guide"
                  onClick={() => (window.location.href = "/how-it-works")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Terms of Service</span>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-terms"
                  onClick={() => (window.location.href = "/terms-of-service")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Privacy Policy</span>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="button-privacy"
                  onClick={() => (window.location.href = "/privacy-policy")}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}



