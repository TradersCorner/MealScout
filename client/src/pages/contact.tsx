import { SEOHead } from "@/components/seo-head";
import { BackHeader } from "@/components/back-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  MessageCircle, 
  Phone, 
  MapPin,
  Clock,
  Send,
  HelpCircle,
  Users,
  Building
} from "lucide-react";

export default function Contact() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "MealScout",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": "hello@mealscout.com",
        "availableLanguage": "English"
      }
    }
  };

  const contactMethods = [
    {
      title: "General Support",
      description: "Questions about using MealScout, technical issues, or account help",
      icon: HelpCircle,
      contact: "hello@mealscout.com",
      response: "Within 2 hours",
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Restaurant Partnerships",
      description: "Interested in joining MealScout as a restaurant partner",
      icon: Building,
      contact: "partners@mealscout.com",
      response: "Within 24 hours",
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Press & Media",
      description: "Media inquiries, press releases, and partnership opportunities",
      icon: Users,
      contact: "press@mealscout.com", 
      response: "Within 48 hours",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const quickHelp = [
    "How do I claim a deal?",
    "Restaurant doesn't recognize my deal",
    "Change my notification settings",
    "Delete my account",
    "Report a problem with a restaurant",
    "Suggest a new restaurant partner"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <SEOHead
        title="Contact MealScout - Customer Support & Restaurant Partnerships"
        description="Get in touch with MealScout for customer support, restaurant partnership inquiries, press requests, or general questions. Multiple ways to reach our team."
        keywords="mealscout contact, customer support, restaurant partnerships, press inquiries, help center, contact form"
        canonicalUrl="https://mealscout.com/contact"
        schemaData={schemaData}
      />
      
      <BackHeader
        title="Contact Us"
        fallbackHref="/"
        icon={Mail}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-2xl">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            We're Here to Help
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Have a question, suggestion, or need support? Our team is ready to assist you. 
            Choose the best way to reach us below.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            return (
              <Card key={index} className="p-6 bg-white/90 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow">
                <CardContent className="p-0 text-center">
                  <div className={`w-16 h-16 ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{method.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{method.description}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Mail className="w-4 h-4" />
                      <span>{method.contact}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Response: {method.response}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Send className="w-6 h-6 text-purple-600" />
                Send Us a Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" data-testid="input-first-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" data-testid="input-last-name" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" data-testid="input-email" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="How can we help you?" data-testid="input-subject" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us more about your question or feedback..."
                  className="min-h-[120px]"
                  data-testid="textarea-message"
                />
              </div>
              
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" data-testid="button-send-message">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Quick Help & Info */}
          <div className="space-y-8">
            {/* Quick Help */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Quick Help Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickHelp.map((topic, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm"
                      data-testid={`button-quick-help-${index}`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Office Info */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Our Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">hello@mealscout.com</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Support Hours</div>
                    <div className="text-gray-600">24/7 Online Support</div>
                    <div className="text-gray-600">Live Chat: 9 AM - 6 PM EST</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Headquarters</div>
                    <div className="text-gray-600">United States</div>
                    <div className="text-gray-600">Serving 25+ Cities</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-4">Typical Response Times</h3>
                <div className="space-y-2 text-sm opacity-90">
                  <div>✓ General inquiries: 2-4 hours</div>
                  <div>✓ Technical support: 1-2 hours</div>
                  <div>✓ Restaurant partnerships: 24 hours</div>
                  <div>✓ Press inquiries: 48 hours</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}