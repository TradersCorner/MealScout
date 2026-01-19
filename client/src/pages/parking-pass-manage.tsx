import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { SEOHead } from "@/components/seo-head";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Store,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

interface BookingDetails {
  id: string;
  eventId: string;
  truckId: string;
  hostId: string;
  status: "pending" | "confirmed" | "cancelled";
  totalCents: number;
  hostPriceCents: number;
  platformFeeCents: number;
  stripePaymentIntentId?: string;
  bookingConfirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  event: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    host: {
      businessName: string;
      address: string;
      locationType: string;
    };
  };
  truck?: {
    id: string;
    name: string;
    cuisineType: string;
    imageUrl?: string;
  };
}

export default function ParkingPassManage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"truck" | "host">("truck");
  const [isLoading, setIsLoading] = useState(true);
  const [truckBookings, setTruckBookings] = useState<BookingDetails[]>([]);
  const [hostBookings, setHostBookings] = useState<BookingDetails[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [isTruck, setIsTruck] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Check if user has a truck profile
        const truckRes = await fetch("/api/restaurants/my");
        let trucks: any[] = [];
        if (truckRes.ok) {
          const truckData = await truckRes.json();
          trucks = Array.isArray(truckData) ? truckData : [];
          if (trucks.length > 0) {
            setIsTruck(true);
            // Fetch truck bookings
            const truckBookingsRes = await fetch("/api/bookings/my-truck");
            if (truckBookingsRes.ok) {
              const data = await truckBookingsRes.json();
              setTruckBookings(data);
            }

            // Set default tab to truck if they have one
            setActiveTab("truck");
          }
        }

        // Check if user has host profiles
        const hostRes = await fetch("/api/hosts");
        if (hostRes.ok) {
          const hostData = await hostRes.json();
          if (Array.isArray(hostData) && hostData.length > 0) {
            setIsHost(true);
            // Fetch host bookings
            const hostBookingsRes = await fetch("/api/bookings/my-host");
            if (hostBookingsRes.ok) {
              const data = await hostBookingsRes.json();
              setHostBookings(data);
            }

            // Only set default to host if no truck profile
            if (trucks.length === 0) {
              setActiveTab("host");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, toast]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to cancel booking");
      }

      toast({
        title: "Booking Cancelled",
        description:
          "Your booking has been cancelled. Bookings are non-refundable.",
      });

      // Refresh bookings
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderBookingCard = (booking: BookingDetails, isTruckView: boolean) => (
    <Card key={booking.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {isTruckView ? (
                <>
                  <Store className="w-5 h-5" />
                  {booking.event.host.businessName}
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5" />
                  {booking.truck?.name || "Unknown Truck"}
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isTruckView
                ? `${booking.event.host.locationType} · ${booking.event.host.address}`
                : booking.truck?.cuisineType || ""}
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          {format(new Date(booking.event.date), "MMMM d, yyyy")}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {booking.event.startTime} - {booking.event.endTime}
        </div>
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Location Fee</span>
            <span>${(booking.hostPriceCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Platform Fee</span>
            <span>${(booking.platformFeeCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span>${(booking.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>
        {booking.status === "confirmed" && booking.bookingConfirmedAt && (
          <div className="text-xs text-gray-500">
            Confirmed on{" "}
            {format(
              new Date(booking.bookingConfirmedAt),
              "MMM d, yyyy 'at' h:mm a",
            )}
          </div>
        )}
        {isTruckView && booking.status === "confirmed" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleCancelBooking(booking.id)}
          >
            Cancel Reservation
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEOHead
          title="Manage Parking Pass Bookings - MealScout"
          description="View and manage your parking pass bookings"
        />
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  if (!isTruck && !isHost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SEOHead
          title="Manage Parking Pass Bookings - MealScout"
          description="View and manage your parking pass bookings"
        />
        <Navigation />
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>No Parking Pass Access</CardTitle>
              <CardDescription>
                You need either a food truck profile or a host profile to use
                the parking pass system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <a href="/restaurant-signup">Create Food Truck Profile</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/host-signup">Create Host Profile</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <SEOHead
        title="Manage Parking Pass Bookings - MealScout"
        description="View and manage your parking pass bookings"
      />
      <Navigation />

      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Parking Pass
          </h1>
          <p className="text-gray-600">Manage your parking spot reservations</p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "truck" | "host")}
        >
          {isTruck && isHost && (
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="truck" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                My Parking Spots
              </TabsTrigger>
              <TabsTrigger value="host" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                My Hosting
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="truck">
            <div className="space-y-4">
              {truckBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600 mb-4">
                      No parking spots reserved yet
                    </p>
                    <Button asChild>
                      <a href="/parking-pass">Find Parking Spots</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">
                    Upcoming Parking Spots
                  </h2>
                  {truckBookings
                    .filter(
                      (b) =>
                        b.status !== "cancelled" &&
                        new Date(b.event.date) >= new Date(),
                    )
                    .map((booking) => renderBookingCard(booking, true))}

                  {truckBookings.some(
                    (b) =>
                      b.status === "cancelled" ||
                      new Date(b.event.date) < new Date(),
                  ) && (
                    <>
                      <h2 className="text-xl font-semibold mb-4 mt-8">
                        Past & Cancelled
                      </h2>
                      {truckBookings
                        .filter(
                          (b) =>
                            b.status === "cancelled" ||
                            new Date(b.event.date) < new Date(),
                        )
                        .map((booking) => renderBookingCard(booking, true))}
                    </>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="host">
            <div className="space-y-4">
              {hostBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Store className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600 mb-4">
                      No parking pass reservations yet
                    </p>
                    <Button asChild>
                      <a href="/host/dashboard">Manage Events</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">
                    Upcoming Reservations
                  </h2>
                  {hostBookings
                    .filter(
                      (b) =>
                        b.status !== "cancelled" &&
                        new Date(b.event.date) >= new Date(),
                    )
                    .map((booking) => renderBookingCard(booking, false))}

                  {hostBookings.some(
                    (b) =>
                      b.status === "cancelled" ||
                      new Date(b.event.date) < new Date(),
                  ) && (
                    <>
                      <h2 className="text-xl font-semibold mb-4 mt-8">
                        Past & Cancelled
                      </h2>
                      {hostBookings
                        .filter(
                          (b) =>
                            b.status === "cancelled" ||
                            new Date(b.event.date) < new Date(),
                        )
                        .map((booking) => renderBookingCard(booking, false))}
                    </>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
