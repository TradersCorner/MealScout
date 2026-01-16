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
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-10 h-10 text-amber-500" />
            Upcoming Events
          </h1>
          <p className="text-lg text-gray-600">
            Discover food truck events and parking opportunities near you
          </p>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Upcoming Events
              </h3>
              <p className="text-gray-500">
                Check back soon for new food truck events and parking
                opportunities!
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
