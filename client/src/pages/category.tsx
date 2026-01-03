import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import Navigation from "@/components/navigation";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, MapPin, SlidersHorizontal, Pizza, Sandwich, Utensils, UtensilsCrossed, Coffee, Salad, Fish, Cake, Croissant, Soup } from "lucide-react";

const categoryConfig = {
  pizza: {
    title: "Pizza & Italian",
    icon: Pizza,
    gradient: "from-orange-500 to-red-500",
    description: "Delicious pizza and authentic Italian cuisine"
  },
  burgers: {
    title: "Burgers & American",
    icon: Sandwich, 
    gradient: "from-red-500 to-yellow-500",
    description: "Juicy burgers and classic American dishes"
  },
  asian: {
    title: "Asian Cuisine",
    icon: Soup,
    gradient: "from-red-600 to-orange-500", 
    description: "Authentic Asian flavors and fresh ingredients"
  },
  mexican: {
    title: "Mexican Food",
    icon: UtensilsCrossed,
    gradient: "from-green-500 to-red-500",
    description: "Spicy and flavorful Mexican specialties"
  },
  breakfast: {
    title: "Breakfast & Brunch",
    icon: Croissant,
    gradient: "from-yellow-400 to-orange-500",
    description: "Start your day with great breakfast deals"
  },
  healthy: {
    title: "Healthy Options",
    icon: Salad,
    gradient: "from-green-400 to-green-600",
    description: "Fresh, nutritious, and delicious healthy meals"
  },
  seafood: {
    title: "Seafood",
    icon: Fish,
    gradient: "from-blue-500 to-teal-500", 
    description: "Fresh catch and seafood specialties"
  },
  coffee: {
    title: "Coffee & Cafes",
    icon: Coffee,
    gradient: "from-amber-600 to-orange-600",
    description: "Great coffee and cozy cafe atmosphere"
  },
  dessert: {
    title: "Desserts & Sweets",
    icon: Cake,
    gradient: "from-pink-400 to-purple-500",
    description: "Sweet treats and decadent desserts"
  }
};

export default function CategoryPage() {
  const { category } = useParams();
  const config = category ? categoryConfig[category as keyof typeof categoryConfig] : null;

  const { data: featuredDeals, isLoading } = useQuery({
    queryKey: ["/api/deals/featured"],
    enabled: true,
  });

  if (!config) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-4">Category not found</h2>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
        <Navigation />
      </div>
    );
  }

  // Filter deals based on category
  const allDeals = Array.isArray(featuredDeals) ? featuredDeals : [];
  const categoryDeals = allDeals.filter((deal: any) => {
    const cuisineType = deal.restaurant?.cuisineType?.toLowerCase() || '';
    const title = deal.title?.toLowerCase() || '';
    
    switch (category) {
      case 'pizza':
        return cuisineType.includes('pizza') || cuisineType.includes('italian') || 
               title.includes('pizza') || title.includes('pasta');
      case 'burgers':
        return cuisineType.includes('american') || title.includes('burger') || 
               title.includes('sandwich');
      case 'asian':
        return cuisineType.includes('asian') || cuisineType.includes('chinese') || 
               cuisineType.includes('japanese') || title.includes('sushi') || 
               title.includes('noodle');
      case 'mexican':
        return cuisineType.includes('mexican') || title.includes('taco') || 
               title.includes('burrito');
      case 'breakfast':
        return title.includes('breakfast') || title.includes('brunch') || 
               title.includes('pancake') || title.includes('coffee');
      case 'healthy':
        return title.includes('salad') || title.includes('smoothie') || 
               cuisineType.includes('healthy');
      case 'seafood':
        return cuisineType.includes('seafood') || title.includes('fish') || 
               title.includes('shrimp');
      case 'coffee':
        return cuisineType.includes('cafe') || title.includes('coffee') || 
               title.includes('latte');
      case 'dessert':
        return title.includes('dessert') || title.includes('ice cream') || 
               title.includes('cake');
      default:
        return false;
    }
  });

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      {/* Header */}
      <header className="px-6 py-6 bg-white border-b border-border">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-3 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center">
            <div className={`w-8 h-8 bg-gradient-to-r ${config.gradient} rounded-lg flex items-center justify-center mr-3 shadow-sm`}>
              <config.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>

        {/* Filter & Sort */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {categoryDeals.length} deal{categoryDeals.length !== 1 ? 's' : ''} found
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" data-testid="button-sort">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Sort
            </Button>
            <Button variant="outline" size="sm" data-testid="button-filter">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md">
                <div className="w-full h-48 bg-muted"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded-lg w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : categoryDeals.length > 0 ? (
          <div className="space-y-4">
            {categoryDeals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className={`w-20 h-20 bg-gradient-to-r ${config.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20`}>
              <config.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg text-foreground mb-2">No {config.title} deals yet</h3>
            <p className="text-muted-foreground mb-6">
              Check back soon for amazing {config.title.toLowerCase()} deals!
            </p>
            <Link href="/search">
              <Button data-testid="button-browse-all">
                Browse All Deals
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}