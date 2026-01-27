import { SEOHead } from "@/components/seo-head";
import { BackHeader } from "@/components/back-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mail, 
  MapPin,
  Send,
  HelpCircle,
  Users,
  Building,
  Clock
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
        "email": "info.mealscout@gmail.com",
        "availableLanguage": "English"
      }
    }
  };

  const contactMethods = [
    {
      title: "General Support",
      description: "Questions about using MealScout, technical issues, or account help",
      icon: HelpCircle,
      contact: "info.mealscout@gmail.com",
      response: "Within 24 hours",
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Restaurant Partnerships",
      description: "Interested in joining MealScout as a restaurant partner",
      icon: Building,
      contact: "info.mealscout@gmail.com",
      response: "Within 24 hours",
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Press & Media",
      description: "Media inquiries, press releases, and partnership opportunities",
      icon: Users,
      contact: "info.mealscout@gmail.com", 
      response: "Within 24 hours",
      color: "bg-purple-100 text-purple-600"
    }
  ];

  const supportEmail = "info.mealscout@gmail.com";

  const quickHelp = [
    "How do I get started?",
    "How do parking passes work?",
    "Where do I manage my profile?",
    "How do events work?",
    "How do affiliate links work?",
    "Report a problem"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <SEOHead
        title="Contact MealScout - Email Support"
        description="Email MealScout support for help with accounts, parking passes, events, restaurants, bars, and food trucks."
        keywords="mealscout contact, email support, parking pass help, food truck support, host support"
        canonicalUrl="https://mealscout.us/contact"
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
            <Mail className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Email Support
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Have a question or need help? Email us and include the page you were on.
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
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    onClick={() => {
                      window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(method.title)}`;
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
                    <div className="text-gray-600">info.mealscout@gmail.com</div>
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
                  <div>✓ General inquiries: within 24 hours</div>
                  <div>✓ Technical support: within 24 hours</div>
                  <div>✓ Partnerships: within 24 hours</div>
                  <div>✓ Press inquiries: within 24 hours</div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
