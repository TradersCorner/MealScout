import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HelpCircle, Search, MessageCircle, Mail, Phone, ExternalLink, ChevronRight } from "lucide-react";
import { BackHeader } from "@/components/back-header";

export default function HelpSupportPage() {
  const { user, isAuthenticated } = useAuth();

  const faqItems = [
    {
      id: "1",
      question: "How do I claim a deal?",
      answer: "Browse deals, tap on one you like, then follow the claim instructions."
    },
    {
      id: "2", 
      question: "Can I save deals for later?",
      answer: "Yes! Tap the heart icon on any deal card to save it to your favorites."
    },
    {
      id: "3",
      question: "How do I find deals near me?",
      answer: "Allow location access and we'll show you deals from nearby restaurants."
    },
    {
      id: "4",
      question: "What if a restaurant doesn't honor my deal?",
      answer: "Contact us immediately and we'll resolve the issue with the restaurant."
    }
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: "Start Chat",
      available: "24/7"
    },
    {
      icon: Mail,
      title: "Email Support", 
      description: "Send us a detailed message",
      action: "Send Email",
      available: "Response within 24h"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Talk to a support representative",
      action: "Call Now",
      available: "Mon-Fri 9AM-6PM"
    }
  ];

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <BackHeader
        title="Help & Support"
        subtitle="Get help when you need it"
        fallbackHref="/profile"
        icon={HelpCircle}
        className="bg-white border-b border-border"
      />

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Search Help */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search help articles..."
            className="w-full pl-12 pr-4 py-4 text-base border-2 focus:border-primary rounded-xl"
            data-testid="input-search-help"
          />
        </div>

        {/* Contact Options */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Contact Us</h2>
          <div className="space-y-3">
            {contactOptions.map((option) => (
              <Card key={option.title} className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <option.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{option.title}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <p className="text-xs text-primary mt-1">{option.available}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" data-testid={`button-${option.title.toLowerCase().replace(' ', '-')}`}>
                        {option.action}
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <Card key={item.id} className="border-0 shadow-md">
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
                <Button variant="ghost" size="sm" data-testid="button-user-guide">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Terms of Service</span>
                <Button variant="ghost" size="sm" data-testid="button-terms">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Privacy Policy</span>
                <Button variant="ghost" size="sm" data-testid="button-privacy">
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