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
    "url": "https://mealscout.us/sitemap"
  };

  const siteStructure = [
    {
      category: "Main Pages",
      icon: Home,
      color: "bg-[color:var(--accent-text)]/12 text-[color:var(--accent-text)]",
      pages: [
        { title: "Home", href: "/", description: "Discover local food deals near you" },
        { title: "About Us", href: "/about", description: "Learn about MealScout's mission and values" },
        { title: "How It Works", href: "/how-it-works", description: "Role-based guides for every user type" },
        { title: "Contact", href: "/contact", description: "Email support for MealScout" },
        { title: "FAQ", href: "/faq", description: "Frequently asked questions and answers" },
        { title: "Find Food", href: "/find-food", description: "Local discovery for diners" },
        { title: "Food Trucks", href: "/truck-landing", description: "MealScout for food trucks" },
        { title: "Hosts", href: "/for-hosts", description: "MealScout for hosts" },
        { title: "Restaurants", href: "/for-restaurants", description: "MealScout for restaurants" },
        { title: "Bars", href: "/for-bars", description: "MealScout for bars" },
        { title: "Events", href: "/for-events", description: "MealScout for event coordinators" }
      ]
    },
    {
      category: "User Features",
      icon: User,
      color: "bg-[color:var(--status-success)]/12 text-[color:var(--status-success)]", 
      pages: [
        { title: "Sign Up", href: "/login", description: "Create your free MealScout account" },
        { title: "Search Deals", href: "/search", description: "Find deals by location, cuisine, or restaurant" },
        { title: "Map View", href: "/map", description: "See deals on an interactive map" },
        { title: "Time-Sensitive Deals", href: "/deals/featured", description: "Nearby limited-time offers" },
        { title: "User Dashboard", href: "/user-dashboard", description: "Manage your profile and claimed deals" },
        { title: "Favorites", href: "/favorites", description: "Your saved restaurants and deals" },
        { title: "Parking Pass", href: "/parking-pass", description: "Search and book parking pass locations" }
      ]
    },
    {
      category: "Business & Events",
      icon: Building,
      color: "bg-orange-100 text-orange-600",
      pages: [
        { title: "Restaurant Signup", href: "/customer-signup?role=business", description: "Join MealScout as a restaurant partner" },
        { title: "Host Signup", href: "/host-signup", description: "Join MealScout as a host" },
        { title: "Event Signup", href: "/event-signup", description: "Join MealScout as an event coordinator" },
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
        { title: "Mexican Food", href: "/category/mexican", description: "Mexican restaurants and Tex-Mex deals" }
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
      color: "bg-[var(--bg-subtle)] text-[color:var(--text-secondary)]",
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
    <div className="min-h-screen bg-[var(--bg-layered)]">
      <SEOHead
        title="Sitemap - Complete MealScout Navigation & Page Directory"
        description="Browse all MealScout pages, features, and sections. Find deals, account management, restaurant partnerships, support resources, and more in our complete site directory."
        keywords="mealscout sitemap, site navigation, all pages, food deals directory, restaurant features, user account pages"
        canonicalUrl="https://mealscout.us/sitemap"
        schemaData={schemaData}
      />
      
      <BackHeader
        title="Site Map"
        fallbackHref="/"
        icon={Globe}
        className="bg-[hsl(var(--background))/0.94] border-b border-[color:var(--border-subtle)] shadow-clean"
      />

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-3xl mb-8 flex items-center justify-center mx-auto shadow-clean-lg">
            <Globe className="w-10 h-10 text-[color:var(--text-inverse)]" />
          </div>
          <h1 className="text-4xl font-bold text-[color:var(--text-primary)] mb-6">Site Map</h1>
          <p className="text-xl text-[color:var(--text-secondary)] leading-relaxed max-w-3xl mx-auto">
            Find everything MealScout has to offer. Browse our complete directory of pages, 
            features, and resources to discover local food deals and restaurant partnerships.
          </p>
        </div>

        {/* Site Structure */}
        <div className="space-y-8 mb-16">
          {siteStructure.map((section, sectionIndex) => {
            const IconComponent = section.icon;
            return (
              <Card key={sectionIndex} className="bg-[var(--bg-card)] border border-[color:var(--border-subtle)] shadow-clean-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[color:var(--text-primary)] flex items-center gap-3">
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
                        <div className="p-4 rounded-lg bg-[var(--bg-surface)] hover:bg-[color:var(--accent-text)]/10 transition-colors group cursor-pointer border border-transparent hover:border-[color:var(--accent-text)]/30">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-[color:var(--text-primary)] group-hover:text-[color:var(--accent-text)]">
                              {page.title}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-[color:var(--text-muted)] group-hover:text-[color:var(--accent-text)]" />
                          </div>
                          <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">
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
        <Card className="bg-[var(--bg-card)] border border-[color:var(--border-subtle)] shadow-clean-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[color:var(--text-primary)] flex items-center gap-3">
              <div className="w-8 h-8 bg-[color:var(--status-error)]/12 text-[color:var(--status-error)] rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              Popular Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[color:var(--text-secondary)] mb-6">
              Discover food deals in these popular cities where MealScout has active restaurant partners:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {popularLocations.map((location, index) => (
                <div key={index} className="p-3 rounded-lg bg-[var(--bg-surface)] text-center text-sm font-medium text-[color:var(--text-secondary)]">
                  {location}
                </div>
              ))}
            </div>
            <p className="text-sm text-[color:var(--text-secondary)] mt-4 text-center">
              Use the search feature to find deals in these cities and many more locations.
            </p>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-[var(--bg-card)] border border-[color:var(--border-subtle)] rounded-2xl shadow-clean">
            <div className="text-3xl font-bold text-[color:var(--accent-text)] mb-2">50+</div>
            <div className="text-[color:var(--text-secondary)] font-medium">Total Pages</div>
          </div>
          <div className="text-center p-6 bg-[var(--bg-card)] border border-[color:var(--border-subtle)] rounded-2xl shadow-clean">
            <div className="text-3xl font-bold text-[color:var(--accent-text)] mb-2">25+</div>
            <div className="text-[color:var(--text-secondary)] font-medium">Cities Covered</div>
          </div>
          <div className="text-center p-6 bg-[var(--bg-card)] border border-[color:var(--border-subtle)] rounded-2xl shadow-clean">
            <div className="text-3xl font-bold text-[color:var(--accent-text)] mb-2">15+</div>
            <div className="text-[color:var(--text-secondary)] font-medium">Cuisine Categories</div>
          </div>
          <div className="text-center p-6 bg-[var(--bg-card)] border border-[color:var(--border-subtle)] rounded-2xl shadow-clean">
            <div className="text-3xl font-bold text-[color:var(--accent-text)] mb-2">500+</div>
            <div className="text-[color:var(--text-secondary)] font-medium">Restaurant Partners</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl p-8 lg:p-12 text-[color:var(--text-inverse)] text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Explore?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start discovering amazing food deals in your neighborhood today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <button className="bg-[var(--bg-surface)] text-[color:var(--accent-text)] hover:bg-[var(--bg-surface-muted)] font-semibold px-8 py-3 rounded-lg">
                <Home className="w-4 h-4 mr-2 inline" />
                Go to Home
              </button>
            </Link>
            <Link href="/search">
              <button className="border-2 border-[var(--border-strong)] text-[color:var(--text-inverse)] hover:bg-[color:var(--bg-surface)]/10 font-semibold px-8 py-3 rounded-lg">
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




