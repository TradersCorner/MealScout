import { SEOHead } from "@/components/seo-head";
import { BackHeader } from "@/components/back-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  MapPin, 
  Search, 
  ShoppingBag,
  Smartphone,
  Clock,
  Star,
  Users,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function HowItWorks() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Use MealScout to Find Local Food Deals",
    "description": "Learn how to discover, claim, and redeem food deals from local restaurants using MealScout's location-based platform.",
    "step": [
      {
        "@type": "HowToStep",
        "name": "Find Deals Near You",
        "text": "Use your location to discover food deals from restaurants within walking distance."
      },
      {
        "@type": "HowToStep", 
        "name": "Claim Your Favorites",
        "text": "Tap the claim button on deals you're interested in to save them to your account."
      },
      {
        "@type": "HowToStep",
        "name": "Redeem at Restaurant",
        "text": "Show your claimed deal at the restaurant to receive your discount or special offer."
      }
    ]
  };

  const steps = [
    {
      number: "01",
      title: "Discover Local Deals",
      description: "Use your location to find amazing food deals from restaurants within walking distance. Browse by cuisine type, deal value, or restaurant rating.",
      icon: Search,
      details: [
        "Location-based discovery shows nearby restaurants",
        "Filter by cuisine, price range, or deal type",
        "See real-time availability and time limits",
        "Read reviews from other food lovers"
      ]
    },
    {
      number: "02", 
      title: "Claim Your Favorites",
      description: "Found a deal you love? Simply tap the 'Claim Deal' button to save it to your account. No payment required - claiming is always free!",
      icon: ShoppingBag,
      details: [
        "One-tap claiming saves deals to your account",
        "No upfront payment or fees required",
        "Track expiration times and usage limits",
        "Get reminders before deals expire"
      ]
    },
    {
      number: "03",
      title: "Redeem at Restaurant", 
      description: "Visit the restaurant and show your claimed deal on your phone. The staff will apply your discount or special offer immediately.",
      icon: Smartphone,
      details: [
        "Show your phone screen to restaurant staff",
        "Deals are verified instantly",
        "Enjoy your savings on delicious food",
        "Leave a review to help other diners"
      ]
    }
  ];

  const features = [
    {
      title: "Real-Time Updates",
      description: "Get instant notifications when restaurants post new deals",
      icon: Clock
    },
    {
      title: "Quality Verified",
      description: "All partner restaurants are verified for quality and service",
      icon: Star
    },
    {
      title: "Community Driven",
      description: "Read authentic reviews from fellow food enthusiasts",
      icon: Users
    },
    {
      title: "Location Smart",
      description: "Find deals within walking distance of your current location",
      icon: MapPin
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
      <SEOHead
        title="How MealScout Works - Find, Claim & Redeem Local Food Deals"
        description="Learn how to use MealScout's simple 3-step process to discover local restaurant deals, claim your favorites, and redeem savings. Start saving on food today!"
        keywords="how mealscout works, food deal process, restaurant promotions guide, local dining deals, claim redeem food offers"
        canonicalUrl="https://mealscout.com/how-it-works"
        schemaData={schemaData}
      />
      
      <BackHeader
        title="How It Works"
        fallbackHref="/"
        icon={CheckCircle}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-blue-500 to-indigo-500 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Discover Local Food Deals in 3 Simple Steps
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            MealScout makes finding and using food deals effortless. Follow our simple process to start saving 
            money at your favorite local restaurants today.
          </p>
        </div>

        {/* Steps Section */}
        <div className="space-y-16 mb-20">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isEven = index % 2 === 1;
            
            return (
              <div key={index} className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={isEven ? 'lg:order-2' : ''}>
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mr-4">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-blue-600 mb-1">STEP {step.number}</div>
                      <h2 className="text-3xl font-bold text-gray-900">{step.title}</h2>
                    </div>
                  </div>
                  
                  <p className="text-xl text-gray-600 leading-relaxed mb-8">
                    {step.description}
                  </p>
                  
                  <div className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={`relative ${isEven ? 'lg:order-1' : ''}`}>
                  <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl">
                    <CardContent className="p-0">
                      <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                          <IconComponent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 font-semibold">Step {step.number} Visual</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Users Love MealScout</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow text-center">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-xl mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Thousands of Happy Diners</h2>
            <p className="text-gray-600 text-lg">See why food lovers choose MealScout for local dining deals</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Partner Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50k+</div>
              <div className="text-gray-600">Deals Claimed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$2M+</div>
              <div className="text-gray-600">Total Savings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">4.8★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Saving?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of food lovers who are already discovering amazing deals in their neighborhood.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-3">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 py-3">
                Learn More About Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}