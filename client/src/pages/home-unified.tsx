import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import LocationButton from "@/components/location-button";
import { 
  MapPin, 
  Clock, 
  Truck, 
  DollarSign,
  Heart,
  Bell,
  Map,
  ChefHat,
  Radio,
  Target,
  TrendingUp,
  Shield
} from "lucide-react";
import mealScoutLogo from "@assets/ChatGPT Image Sep 14, 2025, 09_25_52 AM_1757872111259.png";

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationName, setLocationName] = useState("Your Location");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleLocationUpdate = (newLocation: {lat: number; lng: number}) => {
    setLocation(newLocation);
    setLocationError(null);
  };

  const handleLocationNameUpdate = (name: string) => {
    setLocationName(name);
  };

  const handleLocationErrorUpdate = (error: string | null) => {
    setLocationError(error);
    setIsLoadingLocation(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header with Logo and Location */}
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={mealScoutLogo} alt="MealScout" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">MealScout</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              location ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <MapPin className={`w-4 h-4 ${location ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                {locationName.split(',')[0]}
              </span>
            </div>
            <LocationButton
              onLocationUpdate={handleLocationUpdate}
              onLocationNameUpdate={handleLocationNameUpdate}
              onLocationError={handleLocationErrorUpdate}
              isLoading={isLoadingLocation}
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* 1️⃣ HERO - IDENTICAL FOR EVERYONE */}
        <section className="px-6 py-16 text-center bg-gradient-to-br from-orange-50 via-white to-red-50">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find what's open near you — <span className="text-orange-600">right now</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Real-time restaurants, food trucks, and time-sensitive deals
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LocationButton
              onLocationUpdate={handleLocationUpdate}
              onLocationNameUpdate={handleLocationNameUpdate}
              onLocationError={handleLocationErrorUpdate}
              isLoading={isLoadingLocation}
              size="lg"
              className="text-lg px-8 py-6"
            >
              {user ? "What's Open Near Me" : "Use My Location"}
            </LocationButton>
            
            {!user && (
              <Link href="/restaurant-signup">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  I own a restaurant / food truck
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* 2️⃣ HOW IT WORKS - IDENTICAL FOR EVERYONE */}
        <section className="px-6 py-16 bg-white">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Detect location</h4>
              <p className="text-gray-600">
                One click to find food near you
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Show what's open now</h4>
              <p className="text-gray-600">
                See live restaurants, trucks, and deals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">You decide where to go</h4>
              <p className="text-gray-600">
                No algorithms, no pay-to-play rankings
              </p>
            </div>
          </div>
        </section>

        {/* 3️⃣ WHAT YOU'LL SEE NEARBY - IDENTICAL FOR EVERYONE */}
        <section className="px-6 py-16 bg-gray-50">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What You'll See Nearby
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <ChefHat className="w-12 h-12 text-orange-600 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Open restaurants</h4>
              <p className="text-gray-600">
                Real-time status — know before you go
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <Truck className="w-12 h-12 text-emerald-600 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Live food trucks</h4>
              <p className="text-gray-600">
                GPS tracking — see where they are right now
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <DollarSign className="w-12 h-12 text-blue-600 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Time-sensitive deals</h4>
              <p className="text-gray-600">
                Limited-time offers — act fast
              </p>
            </div>
          </div>
        </section>

        {/* 4️⃣ AUTH-GATED SECTION */}
        <section className="px-6 py-16 bg-white">
          {!user ? (
            /* LOGGED OUT - PREVIEW */
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Go deeper with a free account
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center space-x-3 text-gray-700">
                  <Heart className="w-5 h-5 text-orange-600" />
                  <span>Save favorite spots</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-gray-700">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span>Follow food trucks</span>
                </div>
                <div className="flex items-center justify-center space-x-3 text-gray-700">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span>Get notified when places go live</span>
                </div>
              </div>
              <Link href="/customer-signup">
                <Button size="lg" className="px-8 py-6 text-lg">
                  Create free account
                </Button>
              </Link>
            </div>
          ) : (
            /* LOGGED IN - REAL FEATURES */
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-8">
                Your Nearby Food (Live)
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/favorites">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200 hover:shadow-lg transition-shadow cursor-pointer">
                    <Heart className="w-8 h-8 text-orange-600 mb-3" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Favorites</h4>
                    <p className="text-sm text-gray-600">Your saved spots</p>
                  </div>
                </Link>
                
                <Link href="/map">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-lg border border-emerald-200 hover:shadow-lg transition-shadow cursor-pointer">
                    <Map className="w-8 h-8 text-emerald-600 mb-3" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Live Truck Map</h4>
                    <p className="text-sm text-gray-600">See trucks nearby</p>
                  </div>
                </Link>
                
                <Link href="/deals/featured">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 hover:shadow-lg transition-shadow cursor-pointer">
                    <DollarSign className="w-8 h-8 text-blue-600 mb-3" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Active Deals</h4>
                    <p className="text-sm text-gray-600">Saved opportunities</p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 5️⃣ OWNER SECTION - SHOWN TO EVERYONE */}
        <section className="px-6 py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <ChefHat className="w-16 h-16 mx-auto mb-6 text-orange-400" />
            <h3 className="text-3xl font-bold mb-4">
              Own a restaurant or food truck?
            </h3>
            <div className="space-y-3 mb-8 text-gray-300">
              <div className="flex items-center justify-center space-x-3">
                <Radio className="w-5 h-5 text-emerald-400" />
                <span>Broadcast live status</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>Post time-sensitive deals</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Shield className="w-5 h-5 text-purple-400" />
                <span>No pay-to-play rankings</span>
              </div>
            </div>
            <Link href="/restaurant-signup">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg">
                Claim & Go Live
              </Button>
            </Link>
          </div>
        </section>

        {/* 6️⃣ FOOTER - IDENTICAL */}
        <footer className="px-6 py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
                <div className="space-y-2">
                  <Link href="/how-it-works" className="block text-gray-600 hover:text-orange-600">How It Works</Link>
                  <Link href="/faq" className="block text-gray-600 hover:text-orange-600">FAQ</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
                <div className="space-y-2">
                  <Link href="/about" className="block text-gray-600 hover:text-orange-600">About</Link>
                  <Link href="/contact" className="block text-gray-600 hover:text-orange-600">Contact</Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
                <div className="space-y-2">
                  <Link href="/privacy-policy" className="block text-gray-600 hover:text-orange-600">Privacy</Link>
                  <Link href="/terms-of-service" className="block text-gray-600 hover:text-orange-600">Terms</Link>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-8">
              <p>&copy; 2026 MealScout. A TradeScout Product.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
