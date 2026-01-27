var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
var RECENT_SEARCHES_KEY = "mealscout_recent_searches";
var MAX_RECENT_SEARCHES = 5;
export default function SmartSearch(_a) {
    var value = _a.value, onChange = _a.onChange, onSearch = _a.onSearch, _b = _a.placeholder, placeholder = _b === void 0 ? "Search deals, restaurants..." : _b, className = _a.className, _c = _a.showSuggestions, showSuggestions = _c === void 0 ? true : _c;
    var _d = useState(false), isOpen = _d[0], setIsOpen = _d[1];
    var _e = useState([]), recentSearches = _e[0], setRecentSearches = _e[1];
    var inputRef = useRef(null);
    var containerRef = useRef(null);
    // Load recent searches from localStorage
    useEffect(function () {
        var stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
            try {
                setRecentSearches(JSON.parse(stored));
            }
            catch (_a) {
                // Ignore invalid JSON
            }
        }
    }, []);
    // Get search suggestions based on current input
    var suggestions = useQuery({
        queryKey: ["/api/search/suggestions", value],
        enabled: value.length >= 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
    }).data;
    // Popular/trending searches - could be dynamic from API
    var popularSearches = [
        "Pizza deals",
        "Mexican food",
        "Burgers near me",
        "Asian cuisine",
        "Coffee shops",
        "Healthy options",
    ];
    // Close suggestions when clicking outside
    useEffect(function () {
        var handleClickOutside = function (event) {
            if (containerRef.current &&
                !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return function () { return document.removeEventListener("mousedown", handleClickOutside); };
    }, []);
    var addToRecentSearches = function (query) {
        if (!query.trim())
            return;
        var updatedRecent = __spreadArray([
            query
        ], recentSearches.filter(function (search) { return search !== query; }), true).slice(0, MAX_RECENT_SEARCHES);
        setRecentSearches(updatedRecent);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
    };
    var removeFromRecent = function (query) {
        var updatedRecent = recentSearches.filter(function (search) { return search !== query; });
        setRecentSearches(updatedRecent);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedRecent));
    };
    var handleSearch = function (query) {
        if (query.trim()) {
            addToRecentSearches(query.trim());
            onSearch(query.trim());
            setIsOpen(false);
        }
    };
    var handleInputChange = function (e) {
        var newValue = e.target.value;
        onChange(newValue);
        setIsOpen(showSuggestions && newValue.length > 0);
    };
    var handleInputFocus = function () {
        setIsOpen(showSuggestions);
    };
    var handleKeyDown = function (e) {
        var _a;
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearch(value);
        }
        if (e.key === "Escape") {
            setIsOpen(false);
            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.blur();
        }
    };
    var getSuggestionIcon = function (type) {
        switch (type) {
            case "restaurant":
                return "🏪";
            case "cuisine":
                return "🍽️";
            case "deal":
                return "🔥";
            case "location":
                return "📍";
            default:
                return "🔍";
        }
    };
    return (<div ref={containerRef} className={cn("relative", className)}>
      <div className="smart-search-shell relative flex items-center gap-2 rounded-full px-3 py-2 shadow-md">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--accent-text)] w-5 h-5 z-10"/>
          <Input ref={inputRef} type="text" placeholder={placeholder} value={value} onChange={handleInputChange} onFocus={handleInputFocus} onKeyDown={handleKeyDown} className="smart-search-input w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-full border border-transparent bg-transparent shadow-none focus:border-transparent focus:ring-2 focus:ring-[#F59E0B]/40 focus:ring-offset-0" data-testid="input-smart-search"/>
        </div>
        <Button onClick={function () { return handleSearch(value); }} className="smart-search-button px-5 sm:px-6 py-2.5 text-sm sm:text-base font-semibold rounded-full shadow-lg hover:shadow-xl focus:ring-2 focus:ring-[#F59E0B]/40 focus:ring-offset-0" data-testid="button-search">
          Search
        </Button>
      </div>

      {/* Search Suggestions Dropdown */}
      {isOpen && showSuggestions && (<Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50 shadow-xl border-2">
          <CardContent className="p-0">
            {/* Current search results */}
            {value.length >= 2 && suggestions && suggestions.length > 0 && (<div className="border-b border-border">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/30">
                  Suggestions
                </div>
                {suggestions.map(function (suggestion) { return (<button key={suggestion.id} onClick={function () {
                        onChange(suggestion.text);
                        handleSearch(suggestion.text);
                    }} className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center space-x-3" data-testid={"suggestion-".concat(suggestion.type, "-").concat(suggestion.id)}>
                    <span className="text-lg">
                      {getSuggestionIcon(suggestion.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {suggestion.text}
                      </div>
                      {suggestion.subtitle && (<div className="text-sm text-muted-foreground truncate">
                          {suggestion.subtitle}
                        </div>)}
                    </div>
                  </button>); })}
              </div>)}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (<div className="border-b border-border">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/30 flex items-center space-x-2">
                  <Clock className="w-4 h-4"/>
                  <span>Recent</span>
                </div>
                {recentSearches.map(function (search, index) { return (<div key={index} className="flex items-center hover:bg-muted/50 transition-colors">
                    <button onClick={function () {
                        onChange(search);
                        handleSearch(search);
                    }} className="flex-1 px-4 py-3 text-left flex items-center space-x-3" data-testid={"recent-search-".concat(index)}>
                      <Clock className="w-4 h-4 text-muted-foreground"/>
                      <span className="text-foreground">{search}</span>
                    </button>
                    <button onClick={function (e) {
                        e.stopPropagation();
                        removeFromRecent(search);
                    }} className="p-2 mr-2 hover:bg-muted rounded-full transition-colors" data-testid={"remove-recent-".concat(index)}>
                      <X className="w-3 h-3 text-muted-foreground"/>
                    </button>
                  </div>); })}
              </div>)}

            {/* Popular/Trending Searches */}
            {value.length === 0 && (<div>
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/30 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4"/>
                  <span>Popular</span>
                </div>
                {popularSearches.map(function (search, index) { return (<button key={index} onClick={function () {
                        onChange(search);
                        handleSearch(search);
                    }} className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center space-x-3" data-testid={"popular-search-".concat(index)}>
                    <TrendingUp className="w-4 h-4 text-muted-foreground"/>
                    <span className="text-foreground">{search}</span>
                  </button>); })}
              </div>)}

            {/* No results state */}
            {value.length >= 2 &&
                (!suggestions || suggestions.length === 0) && (<div className="px-4 py-8 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                  <p>No suggestions found</p>
                  <p className="text-sm">
                    Try searching for restaurants, cuisines, or deals
                  </p>
                </div>)}
          </CardContent>
        </Card>)}
    </div>);
}
