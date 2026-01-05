import { SEOHead } from "@/components/seo-head";
import { BackHeader } from "@/components/back-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Globe, 
  Home, 
  User, 
  Building, 
  Search,
  MapPin,
  Shield,
  ExternalLink
} from "lucide-react";

export default function Sitemap() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "MealScout Sitemap",
    "description": "Complete site navigation for MealScout - find all pages, features, and sections of our local food deals platform.",
    "url": "https://mealscout.com/sitemap"
  };

  const siteStructure = [
    {
      category: "Main Pages",
      icon: Home,
      color: "bg-blue-100 text-blue-600",
      pages: [
        { title: "Home", href: "/", description: "Discover local food deals near you" },
        { title: "About Us", href: "/about", description: "Learn about MealScout's mission and values" },
        { title: "How It Works", href: "/how-it-works", description: "Simple 3-step process to find and use deals" },
        { title: "Contact", href: "/contact", description: "Get in touch with our support team" },
        { title: "FAQ", href: "/faq", description: "Frequently asked questions and answers" }
      ]
    },
    {
      category: "User Features",
      icon: User,
      color: "bg-green-100 text-green-600", 
      pages: [
        { title: "Sign Up", href: "/login", description: "Create your free MealScout account" },
        { title: "Search Deals", href: "/search", description: "Find deals by location, cuisine, or restaurant" },
        { title: "Map View", href: "/map", description: "See deals on an interactive map" },
        { title: "Time-Sensitive Deals", href: "/deals/featured", description: "Nearby limited-time offers" },
        { title: "User Dashboard", href: "/user-dashboard", description: "Manage your profile and claimed deals" },
        { title: "Favorites", href: "/favorites", description: "Your saved restaurants and deals" }
      ]
    },
    {
      category: "Restaurant Partners",
      icon: Building,
      color: "bg-orange-100 text-orange-600",
      pages: [
        { title: "Restaurant Signup", href: "/customer-signup?role=business", description: "Join MealScout as a restaurant partner" },
        { title: "Create Deals", href: "/deal-creation", description: "Restaurant dashboard for creating promotions" },
        { title: "Restaurant Dashboard", href: "/restaurant-owner-dashboard", description: "Manage your restaurant profile and deals" },
        { title: "Subscription Plans", href: "/subscribe", description: "Choose the right plan for your business" }
      ]
    },
    {
      category: "Categories & Discovery",
      icon: Search,
      color: "bg-purple-100 text-purple-600",
      pages: [
        { title: "All Deals", href: "/deals", description: "Browse all available deals" },
        { title: "American Food", href: "/category/american", description: "American cuisine deals and restaurants" },
        { title: "Italian Food", href: "/category/italian", description: "Italian restaurants and pizza deals" },
        { title: "Asian Food", href: "/category/asian", description: "Asian cuisine including Chinese, Thai, Japanese" },
        { title: "Mexican Food", href: "/category/mexican", description: "Mexican restaurants and Tex-Mex deals" },
      ]
    },
    {
      category: "Account & Profile",
      icon: User,
      color: "bg-indigo-100 text-indigo-600",
      pages: [
        { title: "Profile Settings", href: "/profile/settings", description: "Update your account preferences" },
        { title: "Notification Settings", href: "/profile/notifications", description: "Manage your alert preferences" },
        { title: "Saved Addresses", href: "/profile/addresses", description: "Manage your delivery and pickup locations" },
        { title: "Payment Methods", href: "/profile/payment", description: "Manage billing and subscription info" },
        { title: "Help & Support", href: "/profile/help", description: "Get help with your account" }
      ]
    },
    {
      category: "Legal & Support",
      icon: Shield,
      color: "bg-gray-100 text-gray-600",
      pages: [
        { title: "Privacy Policy", href: "/privacy-policy", description: "How we protect and use your data" },
        { title: "Terms of Service", href: "/terms-of-service", description: "Terms and conditions for using MealScout" },
        { title: "Help & Support", href: "/profile/help", description: "Get help with your account and troubleshooting" }
      ]
    }
  ];

  const popularLocations = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
    "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC",
    "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <SEOHead
        title="Sitemap - Complete MealScout Navigation & Page Directory"
        description="Browse all MealScout pages, features, and sections. Find deals, account management, restaurant partnerships, support resources, and more in our complete site directory."
        keywords="mealscout sitemap, site navigation, all pages, food deals directory, restaurant features, user account pages"
        canonicalUrl="https://mealscout.com/sitemap"
        schemaData={schemaData}
      />
      
      <BackHeader
        title="Site Map"
        fallbackHref="/"
        icon={Globe}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm"
      />

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-2xl">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Site Map</h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Find everything MealScout has to offer. Browse our complete directory of pages, 
            features, and resources to discover local food deals and restaurant partnerships.
          </p>
        </div>

        {/* Site Structure */}
        <div className="space-y-8 mb-16">
          {siteStructure.map((section, sectionIndex) => {
            const IconComponent = section.icon;
            return (
              <Card key={sectionIndex} className="bg-white/90 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className={`w-8 h-8 ${section.color} rounded-xl flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    {section.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.pages.map((page, pageIndex) => (
                      <Link key={pageIndex} href={page.href}>
                        <div className="p-4 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors group cursor-pointer border border-transparent hover:border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                              {page.title}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {page.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Popular Locations */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              Popular Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Discover food deals in these popular cities where MealScout has active restaurant partners:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {popularLocations.map((location, index) => (
                <div key={index} className="p-3 rounded-lg bg-gray-50 text-center text-sm font-medium text-gray-700">
                  {location}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              Use the search feature to find deals in these cities and many more locations.
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600 font-medium">Total Pages</div>
          </div>
          <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">25+</div>
            <div className="text-gray-600 font-medium">Cities Covered</div>
          </div>
          <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
            <div className="text-gray-600 font-medium">Cuisine Categories</div>
          </div>
          <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600 font-medium">Restaurant Partners</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Explore?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start discovering amazing food deals in your neighborhood today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg">
                <Home className="w-4 h-4 mr-2 inline" />
                Go to Home
              </button>
            </Link>
            <Link href="/search">
              <button className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-lg">
                <Search className="w-4 h-4 mr-2 inline" />
                Search Deals
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}