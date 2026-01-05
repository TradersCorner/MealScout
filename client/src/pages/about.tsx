import { SEOHead } from "@/components/seo-head";
import { BackHeader } from "@/components/back-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  MapPin, 
  Heart, 
  Users, 
  Star, 
  ShoppingBag,
  TrendingUp,
  Award,
  Globe
} from "lucide-react";

export default function About() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MealScout",
    "description": "Discover amazing local food deals and connect with nearby restaurants offering special promotions.",
    "url": "https://mealscout.com",
    "logo": "https://mealscout.com/logo.png",
    "foundingDate": "2024",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "hello@mealscout.com"
    }
  };

  const stats = [
    { number: "10,000+", label: "Active Users", icon: Users },
    { number: "500+", label: "Partner Restaurants", icon: ShoppingBag },
    { number: "50,000+", label: "Deals Claimed", icon: Star },
    { number: "25+", label: "Cities Covered", icon: MapPin }
  ];

  const features = [
    {
      title: "Local Discovery",
      description: "Find the best food deals within walking distance of your location.",
      icon: MapPin
    },
    {
      title: "Real-Time Updates",
      description: "Get instant notifications when your favorite restaurants post new deals.",
      icon: TrendingUp
    },
    {
      title: "Community Driven",
      description: "Read reviews and ratings from fellow food lovers in your area.",
      icon: Heart
    },
    {
      title: "Quality Assured",
      description: "All partner restaurants are verified and meet our quality standards.",
      icon: Award
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <SEOHead
        title="About MealScout - Discover Local Food Deals & Restaurant Promotions"
        description="Learn about MealScout, the leading platform for discovering local food deals, restaurant promotions, and dining experiences. Join thousands of food lovers saving money while supporting local businesses."
        keywords="about mealscout, local food deals, restaurant promotions, food discovery app, dining deals, local restaurants, food savings"
        canonicalUrl="https://mealscout.com/about"
        schemaData={schemaData}
      />
      
      <BackHeader
        title="About MealScout"
        fallbackHref="/"
        icon={Globe}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-2xl">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Connecting Food Lovers with Local Restaurants
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            MealScout is the premier platform for discovering amazing food deals in your neighborhood. 
            We help food enthusiasts save money while supporting local restaurants through targeted promotions 
            and time-sensitive offers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="text-center p-6 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-xl mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                We believe that great food brings communities together. Our mission is to make dining 
                out more affordable and accessible while helping local restaurants reach new customers 
                through innovative promotional tools.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                By focusing on hyper-local discovery and time-based promotions, we create meaningful 
                connections between diners and restaurants in their immediate vicinity.
              </p>
              <Link href="/customer-signup?role=business">
                <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-6 py-3">
                  Partner With Us
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="w-full h-64 bg-gradient-to-br from-red-200 to-orange-200 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <p className="text-red-800 font-semibold">Connecting Communities</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Choose MealScout?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-6 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Team Values */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-8 lg:p-12 text-white text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Community First</h3>
              <p className="opacity-90">Supporting local businesses and bringing neighbors together through food.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Transparency</h3>
              <p className="opacity-90">Clear pricing, honest reviews, and authentic restaurant partnerships.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="opacity-90">Using technology to make food discovery more convenient and enjoyable.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Start Exploring?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of food lovers who are already discovering amazing deals in their neighborhood.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-8 py-3">
                Get Started Today
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-8 py-3">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}