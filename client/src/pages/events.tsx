import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/events/upcoming"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-10 h-10 text-amber-500" />
            Find Food Trucks at Events
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-base text-gray-800 mb-2">
              <strong>What are these events?</strong>
            </p>
            <p className="text-sm text-gray-700 mb-1">
              These are high-volume events (festivals, markets, corporate
              gatherings) coordinated by event organizers to help you find food
              trucks.
            </p>
            <p className="text-sm text-gray-700">
              <strong>Looking for a parking spot?</strong> Check out our{" "}
              <a
                href="/host-locations"
                className="text-blue-600 hover:underline"
              >
                Host Locations
              </a>{" "}
              - businesses like gas stations, schools, and laundromats offering
              parking spots for food trucks.
            </p>
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Upcoming Events
              </h3>
              <p className="text-gray-500 mb-3">
                No high-volume events are currently listed.
              </p>
              <p className="text-sm text-gray-600">
                Looking for a place to park your food truck? Browse{" "}
                <a
                  href="/host-locations"
                  className="text-blue-600 hover:underline"
                >
                  Host Locations
                </a>{" "}
                - businesses offering parking spots at gas stations, schools,
                breweries, and more.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-2">
                      {event.name || "Food Truck Event"}
                    </CardTitle>
                    {event.status === "published" && (
                      <Badge variant="default">Open</Badge>
                    )}
                    {event.status === "draft" && (
                      <Badge variant="outline">Draft</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Date & Time */}
                  {event.startDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  {event.host?.businessName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">
                        {event.host.businessName}
                      </span>
                    </div>
                  )}

                  {/* Capacity */}
                  {event.maxTrucks && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Up to {event.maxTrucks} trucks</span>
                    </div>
                  )}

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {/* Series Info */}
                  {event.series && (
                    <Badge variant="secondary" className="text-xs">
                      {event.series.name}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
