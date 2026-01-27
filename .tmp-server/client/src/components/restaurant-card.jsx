import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Truck, Radio, MapPin, Clock, Activity } from "lucide-react";
import { format } from "date-fns";
export default function RestaurantCard(_a) {
    var restaurant = _a.restaurant, userLocation = _a.userLocation, _b = _a.showDistance, showDistance = _b === void 0 ? false : _b;
    // Calculate distance if user location is available
    var calculateDistance = function (lat1, lng1, lat2, lng2) {
        var R = 6371; // Earth's radius in km
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };
    var distance = userLocation && restaurant.currentLatitude && restaurant.currentLongitude
        ? calculateDistance(userLocation.lat, userLocation.lng, Number(restaurant.currentLatitude), Number(restaurant.currentLongitude))
        : restaurant.distance;
    var isLiveFoodTruck = restaurant.isFoodTruck && restaurant.mobileOnline && restaurant.isActive;
    var isRecentlyActive = restaurant.lastBroadcastAt &&
        (Date.now() - new Date(restaurant.lastBroadcastAt).getTime()) < 300000; // 5 minutes
    return (<Link href={"/restaurant/".concat(restaurant.id)}>
      <Card className={"bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ".concat(restaurant.isFoodTruck ? 'border-orange-200 hover:border-orange-300' : 'border-border', " ").concat(isLiveFoodTruck ? 'ring-2 ring-orange-200 ring-opacity-50' : '')} data-testid={"card-restaurant-".concat(restaurant.id)}>
        <CardContent className="p-4 relative">
          {/* Food Truck Live Badge */}
          {isLiveFoodTruck && (<div className="absolute top-2 right-2 z-10">
              <div className="flex items-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse" data-testid={"badge-live-".concat(restaurant.id)}>
                <Radio className="w-3 h-3 mr-1"/>
                LIVE
              </div>
            </div>)}

          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1 flex items-center space-x-2" data-testid={"text-restaurant-name-".concat(restaurant.id)}>
                <span>{restaurant.name}</span>
                {restaurant.isVerified && (<CheckCircle className="w-4 h-4 text-green-500" data-testid={"icon-verified-".concat(restaurant.id)}/>)}
                {restaurant.isFoodTruck && (<Truck className="w-4 h-4 text-orange-500" data-testid={"icon-food-truck-".concat(restaurant.id)}/>)}
              </h3>
              <div className="flex items-center space-x-2 mb-1">
                <p className="text-xs text-muted-foreground" data-testid={"text-restaurant-cuisine-".concat(restaurant.id)}>
                  {restaurant.cuisineType || (restaurant.isFoodTruck ? "Food Truck" : "Restaurant")}
                </p>
                {restaurant.isFoodTruck && (<span className="text-xs bg-orange-100 text-orange-600 px-1 py-0.5 rounded" data-testid={"label-food-truck-".concat(restaurant.id)}>
                    Mobile
                  </span>)}
              </div>
              <p className="text-xs text-muted-foreground" data-testid={"text-restaurant-address-".concat(restaurant.id)}>
                {restaurant.address}
              </p>
            </div>
            <div className={"w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ".concat(restaurant.isFoodTruck ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-primary')}>
              {restaurant.isFoodTruck ? (<Truck className="w-5 h-5 text-white"/>) : (<i className="fas fa-utensils text-white"></i>)}
            </div>
          </div>
          
          {/* Food Truck Specific Info */}
          {restaurant.isFoodTruck && (showDistance || distance || restaurant.lastBroadcastAt) && (<div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3" data-testid={"food-truck-info-".concat(restaurant.id)}>
              <div className="flex items-center justify-between text-xs">
                {distance && (<div className="flex items-center text-orange-600">
                    <MapPin className="w-3 h-3 mr-1"/>
                    <span data-testid={"text-distance-".concat(restaurant.id)}>
                      {distance < 1 ? "".concat(Math.round(distance * 1000), "m") : "".concat(distance.toFixed(1), "km")} away
                    </span>
                  </div>)}
                {restaurant.lastBroadcastAt && (<div className="flex items-center text-orange-600">
                    <Clock className="w-3 h-3 mr-1"/>
                    <span data-testid={"text-last-seen-".concat(restaurant.id)}>
                      {isRecentlyActive ? 'Active now' : "Last seen ".concat(format(new Date(restaurant.lastBroadcastAt), 'HH:mm'))}
                    </span>
                  </div>)}
              </div>
              {isLiveFoodTruck && (<div className="flex items-center mt-1 text-xs text-orange-700">
                  <Activity className="w-3 h-3 mr-1 animate-pulse"/>
                  <span data-testid={"text-broadcasting-".concat(restaurant.id)}>Broadcasting live location</span>
                </div>)}
            </div>)}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <i className="fas fa-star text-yellow-400 text-xs"></i>
                <span className="text-xs text-muted-foreground" data-testid={"text-rating-".concat(restaurant.id)}>4.5</span>
              </div>
              {!restaurant.isFoodTruck && (<div className="flex items-center space-x-1">
                  <i className="fas fa-clock text-muted-foreground text-xs"></i>
                  <span className="text-xs text-muted-foreground" data-testid={"text-delivery-time-".concat(restaurant.id)}>20-30 min</span>
                </div>)}
              {restaurant.isFoodTruck && distance && (<div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-muted-foreground"/>
                  <span className="text-xs text-muted-foreground" data-testid={"text-truck-distance-".concat(restaurant.id)}>
                    {distance < 1 ? "".concat(Math.round(distance * 1000), "m") : "".concat(distance.toFixed(1), "km")}
                  </span>
                </div>)}
            </div>
            <div className={"px-2 py-1 rounded-full text-xs font-medium ".concat(isLiveFoodTruck
            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse"
            : restaurant.isActive
                ? "bg-accent/20 text-accent"
                : "bg-muted text-muted-foreground")} data-testid={"status-".concat(restaurant.id)}>
              {isLiveFoodTruck ? "LIVE" : restaurant.isActive ? "Open" : "Closed"}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>);
}
