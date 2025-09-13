import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock, TrendingUp, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  text: string;
  type: "restaurant" | "cuisine" | "deal" | "location";
  subtitle?: string;
  icon?: string;
}

interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
}

const RECENT_SEARCHES_KEY = "mealscout_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export default function SmartSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Search deals, restaurants...",
  className,
  showSuggestions = true,
}: SmartSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Get search suggestions based on current input
  const { data: suggestions } = useQuery<SearchSuggestion[]>({
    queryKey: ["/api/search/suggestions", value],
    enabled: value.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Popular/trending searches - could be dynamic from API
  const popularSearches = [
    "Pizza deals",
    "Mexican food",
    "Burgers near me",
    "Asian cuisine",
    "Coffee shops",
    "Healthy options"
  ];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    
    const updatedRecent = [
      query,
      ...recentSearches.filter(search => search !== query)
    ].slice(0, MAX_RECENT_SEARCHES);
    
    setRecentSearches(updatedRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
  };

  const removeFromRecent = (query: string) => {
    const updatedRecent = recentSearches.filter(search => search !== query);
    setRecentSearches(updatedRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      addToRecentSearches(query.trim());
      onSearch(query.trim());
      setIsOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(showSuggestions && newValue.length > 0);
  };

  const handleInputFocus = () => {
    setIsOpen(showSuggestions);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(value);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "restaurant": return "🏪";
      case "cuisine": return "🍽️";
      case "deal": return "🔥";
      case "location": return "📍";
      default: return "🔍";
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-4 py-3 text-base border-2 rounded-l-xl focus:border-primary transition-colors border-r-0"
            data-testid="input-smart-search"
          />
        </div>
        <Button
          onClick={() => handleSearch(value)}
          className="px-6 py-3 text-base border-2 border-l-0 border-primary rounded-r-xl bg-primary hover:bg-primary/90 text-primary-foreground"
          data-testid="button-search"
        >
          Search
        </Button>
      </div>

      {/* Search Suggestions Dropdown */}
      {isOpen && showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 shadow-xl border-2">
          <CardContent className="p-0">
            {/* Current search results */}
            {value.length >= 2 && suggestions && suggestions.length > 0 && (
              <div className="border-b border-border">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/30">
                  Suggestions
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      onChange(suggestion.text);
                      handleSearch(suggestion.text);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center space-x-3"
                    data-testid={`suggestion-${suggestion.type}-${suggestion.id}`}
                  >
                    <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-sm text-muted-foreground truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="border-b border-border">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/30 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Recent</span>
                </div>
                {recentSearches.map((search, index) => (
                  <div
                    key={index}
                    className="flex items-center hover:bg-muted/50 transition-colors"
                  >
                    <button
                      onClick={() => {
                        onChange(search);
                        handleSearch(search);
                      }}
                      className="flex-1 px-4 py-3 text-left flex items-center space-x-3"
                      data-testid={`recent-search-${index}`}
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{search}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromRecent(search);
                      }}
                      className="p-2 mr-2 hover:bg-muted rounded-full transition-colors"
                      data-testid={`remove-recent-${index}`}
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Popular/Trending Searches */}
            {value.length === 0 && (
              <div>
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/30 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Popular</span>
                </div>
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onChange(search);
                      handleSearch(search);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center space-x-3"
                    data-testid={`popular-search-${index}`}
                  >
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* No results state */}
            {value.length >= 2 && (!suggestions || suggestions.length === 0) && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No suggestions found</p>
                <p className="text-sm">Try searching for restaurants, cuisines, or deals</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}