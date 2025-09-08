import { Link, useLocation } from "wouter";
import { Home, Search, Heart, Receipt, User, MapPin } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/map", icon: MapPin, label: "Map" },
    { path: "/favorites", icon: Heart, label: "Favorites" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-border px-4 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <button 
              className={`flex flex-col items-center space-y-1 py-2 ${
                location === item.path 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
