import { SEOHead } from "@/components/seo-head";
import { BackHeader } from "@/components/back-header";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HelpCircle, MessageCircle, Phone, Mail, Clock, Shield } from "lucide-react";

export default function FAQ() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does MealScout work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MealScout connects you with local restaurants offering time-limited Specials. Simply browse Specials near you, claim the ones you want, and show your phone at the restaurant to redeem."
        }
      },
      {
        "@type": "Question",
        "name": "Is MealScout free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, MealScout is completely free for customers. You can browse, claim, and redeem Specials without any charges or subscription fees."
        }
      },
      {
        "@type": "Question",
        "name": "How do I claim a Special?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply tap the 'Claim Special' button on any offer you're interested in. The Special will be saved to your account and you can show it at the restaurant to redeem."
        }
      }
    ]
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How does MealScout work?",
          answer: "MealScout connects you with local restaurants offering time-limited Specials. Simply browse Specials near you, claim the ones you want, and show your phone at the restaurant to redeem. It's that simple!"
        },
        {
          question: "Is MealScout free to use?",
          answer: "Yes, MealScout is completely free for customers. You can browse, claim, and redeem Specials without any charges or subscription fees."
        },
        {
          question: "Do I need to download an app?",
          answer: "No app required! MealScout works directly in your web browser on any device. Just visit our website and start exploring Specials immediately."
        },
        {
          question: "How do I create an account?",
          answer: "You can sign up using your Google account or Facebook for instant access. We've made the process as quick and simple as possible."
        }
      ]
    },
    {
      category: "Using Specials",
      questions: [
        {
          question: "How do I claim a Special?",
          answer: "Simply tap the 'Claim Special' button on any offer you're interested in. The Special will be saved to your account and you can show it at the restaurant to redeem."
        },
        {
          question: "How long do Specials last?",
          answer: "Special duration varies by restaurant. Some are available all day, others might be limited to specific hours like lunch or dinner. Check the Special details for exact timing."
        },
        {
          question: "Can I use multiple Specials at once?",
          answer: "This depends on the restaurant's policy. Most Specials can't be combined with other offers, but you can usually use different Specials on separate visits."
        },
        {
          question: "What if a Special doesn't work at the restaurant?",
          answer: "If you encounter any issues redeeming a Special, please contact us immediately. We'll work with the restaurant to resolve the issue and ensure you get your savings."
        }
      ]
    },
    {
      category: "Location & Discovery",
      questions: [
        {
          question: "How does location-based discovery work?",
          answer: "MealScout uses your device's location (with your permission) to show you Specials from restaurants within walking distance. You can also manually search specific areas."
        },
        {
          question: "Can I see Specials in other cities?",
          answer: "Yes! You can search for Specials in any city where MealScout operates. This is perfect for planning dining when traveling."
        },
        {
          question: "How accurate is the location feature?",
          answer: "Our location feature is highly accurate and shows Specials within a few blocks of your current location. We use advanced GPS technology for precise results."
        },
        {
          question: "What if location services are disabled?",
          answer: "You can still use MealScout by manually entering your address or searching for specific restaurants and neighborhoods."
        }
      ]
    },
    {
      category: "Restaurant Partners",
      questions: [
        {
          question: "How do restaurants join MealScout?",
          answer: "Restaurants can sign up through our partner program. We offer subscription plans that include marketing tools, analytics, and customer engagement features."
        },
        {
          question: "Are all restaurants verified?",
          answer: "Yes, all partner restaurants go through our verification process to ensure they meet our quality and service standards."
        },
        {
          question: "How do restaurants create Specials?",
          answer: "Restaurant partners have access to a dashboard where they can create time-based Specials, set usage limits, and track performance analytics."
        },
        {
          question: "Can I suggest a restaurant to join?",
          answer: "Absolutely! We love hearing from our community. You can suggest restaurants through our contact form and we'll reach out to them."
        }
      ]
    },
    {
      category: "Account & Privacy",
      questions: [
        {
          question: "Is my personal information safe?",
          answer: "We take privacy seriously and use industry-standard encryption to protect your data. We never sell your information to third parties."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can delete your account at any time through your profile settings. All your data will be permanently removed from our systems."
        },
        {
          question: "How do I change my notification preferences?",
          answer: "Visit your profile settings to customize when and how you receive notifications about new Specials and updates."
        },
        {
          question: "Can I change my location settings?",
          answer: "Yes, you can update your location preferences in your account settings or allow/deny location access through your browser settings."
        }
      ]
    },
    {
      category: "Troubleshooting",
      questions: [
        {
          question: "The website is loading slowly, what should I do?",
          answer: "Try refreshing the page or clearing your browser cache. If issues persist, check your internet connection or try accessing from a different device."
        },
        {
          question: "I can't see any Specials in my area, why?",
          answer: "This could mean we don't have restaurant partners in your immediate area yet, or your location services might be disabled. Try expanding your search radius."
        },
        {
          question: "A restaurant says they don't know about the Special I claimed",
          answer: "This occasionally happens with new partner restaurants. Show them the Special on your phone and ask them to contact us if they need verification."
        },
        {
          question: "How do I report a problem with a restaurant or Special?",
          answer: "You can report issues through the 'Report Problem' button on each Special page, or contact our support team directly."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <SEOHead
        title="Frequently Asked Questions - MealScout Food Specials Help Center"
        description="Get answers to common questions about MealScout. Learn how to find food Specials, claim promotions, redeem offers, and make the most of our local restaurant platform."
        keywords="mealscout faq, food Specials help, restaurant promotions questions, how to use mealscout, Special redemption, local dining help"
        canonicalUrl="https://mealscout.com/faq"
        schemaData={schemaData}
      />
      
      <BackHeader
        title="Frequently Asked Questions"
        fallbackHref="/"
        icon={HelpCircle}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-4 py-8 max-w-4xl mx-auto">
        {/* Intro Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-2xl">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">How Can We Help You?</h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Find answers to the most common questions about using MealScout to discover amazing food Specials near you.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-sm text-gray-600">Support Available</div>
          </div>
          <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">&lt;1hr</div>
            <div className="text-sm text-gray-600">Average Response</div>
          </div>
          <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-sm text-gray-600">Issue Resolution</div>
          </div>
        </div>

        {/* FAQ Sections */}
        {faqs.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="mb-8 bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {section.category === "Getting Started" && <Clock className="w-6 h-6 text-blue-600" />}
                {section.category === "Using Specials" && <Shield className="w-6 h-6 text-green-600" />}
                {section.category === "Location & Discovery" && <MessageCircle className="w-6 h-6 text-purple-600" />}
                {section.category === "Restaurant Partners" && <Phone className="w-6 h-6 text-orange-600" />}
                {section.category === "Account & Privacy" && <Shield className="w-6 h-6 text-red-600" />}
                {section.category === "Troubleshooting" && <HelpCircle className="w-6 h-6 text-gray-600" />}
                {section.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {section.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${sectionIndex}-${faqIndex}`}>
                    <AccordionTrigger className="text-left font-semibold text-gray-800 hover:text-blue-600">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Still Need Help?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help you get the most out of MealScout.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3">
              <MessageCircle className="w-4 h-4 mr-2" />
              Live Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
