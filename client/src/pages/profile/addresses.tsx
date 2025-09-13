import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Home, Briefcase, MoreHorizontal } from "lucide-react";
import { BackHeader } from "@/components/back-header";

export default function AddressesPage() {
  const { user, isAuthenticated } = useAuth();
  const [addresses] = useState([
    {
      id: "1",
      type: "home",
      label: "Home",
      address: "123 Oak Street",
      city: "Houma, LA 70360",
      isDefault: true,
    },
    {
      id: "2", 
      type: "work",
      label: "Work",
      address: "456 Business Blvd",
      city: "Houma, LA 70364",
      isDefault: false,
    }
  ]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <p className="text-muted-foreground">Log in to manage your addresses</p>
        </div>
        <Navigation />
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'work':
        return <Briefcase className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative pb-20">
      <BackHeader
        title="Addresses"
        subtitle="Manage your saved locations"
        fallbackHref="/profile"
        icon={MapPin}
        rightActions={
          <Button size="sm" data-testid="button-add-address">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        }
        className="bg-white border-b border-border"
      />

      {/* Content */}
      <div className="px-6 py-6 space-y-4">
        {addresses.map((address) => (
          <Card key={address.id} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    {getIcon(address.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-foreground">{address.label}</h3>
                      {address.isDefault && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{address.address}</p>
                    <p className="text-sm text-muted-foreground">{address.city}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" data-testid={`button-address-menu-${address.id}`}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Address Card */}
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Add New Address</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save addresses for faster deal discovery
            </p>
            <Button variant="outline" data-testid="button-add-new-address">
              Add Address
            </Button>
          </CardContent>
        </Card>
      </div>

      <Navigation />
    </div>
  );
}