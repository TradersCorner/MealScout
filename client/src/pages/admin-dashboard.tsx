import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import {
  Shield,
  Users,
  Store,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Activity,
  Package,
  Settings,
  Eye,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  UserMinus,
} from "lucide-react";
import { Link } from "wouter";
import QuickDashboardAccess from "@/components/quick-dashboard-access";
import { getOptimizedImageUrl } from "@/lib/images";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalDeals: number;
  activeDeals: number;
  totalClaims: number;
  todayClaims: number;
  revenue: number;
  newUsersToday: number;
}

interface PendingRestaurant {
  id: string;
  name: string;
  email: string;
  cuisineType: string;
  createdAt: string;
  isActive: boolean;
}

function TruckImportPanel({ enabled }: { enabled: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);

  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/truck-imports"],
    enabled,
  });

  const uploadImport = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Please select a file to upload.");
      }
      const formData = new FormData();
      formData.append("file", file);
      if (source.trim()) {
        formData.append("source", source.trim());
      }

      const res = await fetch("/api/admin/truck-imports", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to upload import file.");
      }
      return await res.json();
    },
    onSuccess: (data: any) => {
      setLastResult(data);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/truck-imports"] });
      toast({
        title: "Import queued",
        description: `Imported ${data.importedRows} rows.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Unable to import file.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Food Truck Imports
        </CardTitle>
        <CardDescription>
          Upload CSV or XLSX lists to preload food trucks for claims.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="State registry, county export, etc."
            />
          </div>
          <div>
            <label className="text-sm font-medium">File</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <Button
            type="button"
            onClick={() => uploadImport.mutate()}
            disabled={uploadImport.isPending}
            data-testid="button-import-trucks"
          >
            {uploadImport.isPending ? "Uploading..." : "Upload Import"}
          </Button>
        </div>

        {lastResult && (
          <div className="p-3 rounded-md bg-muted/40 text-sm">
            <div>Batch: {lastResult.batchId}</div>
            <div>Imported: {lastResult.importedRows}</div>
            <div>Duplicates: {lastResult.duplicateRows}</div>
            <div>Missing Required: {lastResult.missingRows}</div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-semibold">Recent Imports</div>
          {batches.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              No import batches yet.
            </div>
          ) : (
            <div className="space-y-2">
              {batches.slice(0, 5).map((batch: any) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-semibold">{batch.fileName}</div>
                    <div className="text-muted-foreground">
                      {batch.source || "Unspecified source"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>Imported: {batch.importedRows}</div>
                    <div className="text-muted-foreground">
                      Skipped: {batch.skippedRows}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Manual User/Host Creation Component (Combined)
function ManualUserCreation({ adminUser }: { adminUser?: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    businessName: "",
    address: "",
    cuisineType: "",
    latitude: "",
    longitude: "",
    locationType: "private_residence",
    footTraffic: "low",
    amenities: [] as string[],
    userType: "customer" as
      | "customer"
      | "food_truck"
      | "restaurant_owner"
      | "staff"
      | "event_coordinator"
      | "host",
  });
  const [geocoding, setGeocoding] = useState(false);
  const [inviteSentEmail, setInviteSentEmail] = useState("");

  const createUser = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/users/create", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setInviteSentEmail(formData.email);
      toast({
        title: "Account Created",
        description:
          "Setup link sent. The user will complete their profile and password.",
      });
      // Reset form
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        businessName: "",
        address: "",
        cuisineType: "",
        latitude: "",
        longitude: "",
        locationType: "private_residence",
        footTraffic: "low",
        amenities: [],
        userType: "food_truck",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-geocode for hosts if address provided
    if (
      formData.userType === "host" &&
      formData.address &&
      !formData.latitude
    ) {
      setGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            formData.address,
          )}`,
        );
        const data = await response.json();

        if (data && data[0]) {
          formData.latitude = data[0].lat;
          formData.longitude = data[0].lon;
        }
      } catch (error) {
        console.error("Failed to geocode:", error);
      } finally {
        setGeocoding(false);
      }
    }

    createUser.mutate(formData);
  };

  const handleUserTypeChange = (newType: typeof formData.userType) => {
    // Reset conditional fields when type changes
    setFormData({
      ...formData,
      userType: newType,
      businessName: "",
      address: "",
      cuisineType: "",
      latitude: "",
      longitude: "",
      locationType: "private_residence",
      footTraffic: "low",
      amenities: [],
    });
  };

  const handleGeocode = async () => {
    if (!formData.address) return;

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address,
        )}`,
      );
      const data = await response.json();

      if (data && data[0]) {
        setFormData({
          ...formData,
          latitude: data[0].lat,
          longitude: data[0].lon,
        });
        toast({
          title: "Coordinates Found",
          description: "Location has been geocoded successfully.",
        });
      } else {
        toast({
          title: "Not Found",
          description:
            "Could not find coordinates for this address. Please enter manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to geocode address.",
        variant: "destructive",
      });
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      {inviteSentEmail && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <p className="font-semibold text-green-800">Setup Email Sent</p>
          <p className="text-sm text-green-700">
            Invite sent to {inviteSentEmail}. The user will finish their profile
            and set a password from the link.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInviteSentEmail("")}
          >
            Dismiss
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* User Type - First Field */}
        <div>
          <label className="text-sm font-medium">Account Type</label>
          <select
            value={formData.userType}
            onChange={(e) => handleUserTypeChange(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="food_truck">Food Truck</option>
            <option value="restaurant_owner">Restaurant Owner</option>
            <option value="customer">Customer</option>
            <option value="host">Host (Parking/Events)</option>
            <option value="event_coordinator">Event Coordinator</option>
            <option value="staff">Staff</option>
            {(adminUser?.userType === "admin" ||
              adminUser?.userType === "super_admin") && (
              <option value="admin">Admin</option>
            )}
            {adminUser?.userType === "super_admin" && (
              <option value="super_admin">Super Admin</option>
            )}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {formData.userType === "food_truck" &&
              "Food truck owner - mobile restaurant, create deals, manage location"}
            {formData.userType === "customer" &&
              "Regular customer - can claim deals and browse restaurants"}
            {formData.userType === "restaurant_owner" &&
              "Business owner - manage restaurant and create deals"}
            {formData.userType === "staff" &&
              "Staff member - help manage restaurant operations"}
            {formData.userType === "event_coordinator" &&
              "Event coordinator - organize events (NO PAYMENTS through us)"}
            {formData.userType === "host" &&
              "Host - rent parking spots/lots to food trucks (hourly/daily/weekly/monthly)"}
          </p>
        </div>

        {/* Common Fields */}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="user@example.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="+1234567890"
          />
        </div>

        {/* Restaurant Owner & Food Truck Specific Fields */}
        {(formData.userType === "restaurant_owner" ||
          formData.userType === "food_truck") && (
          <>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Restaurant Information
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Business Name</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Joe's Pizza"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Cuisine Type</label>
                  <input
                    type="text"
                    required
                    value={formData.cuisineType}
                    onChange={(e) =>
                      setFormData({ ...formData, cuisineType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Italian, Mexican, American, etc."
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Restaurant will be created as verified
                and active. No document verification required for manual
                onboarding.
              </p>
            </div>
          </>
        )}

        {/* Staff Specific Fields */}
        {formData.userType === "staff" && (
          <>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">Staff Information</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Restaurant/Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Which restaurant will they work for?"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Staff member will need to be assigned to
                a restaurant after creation.
              </p>
            </div>
          </>
        )}

        {/* Event Coordinator Specific Fields */}
        {formData.userType === "event_coordinator" && (
          <>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Event Coordinator Information
              </h4>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-xs text-purple-800">
                  <strong>Event Coordinator:</strong> Organizes food truck
                  events and coordinates logistics.
                  <br />
                  <strong className="text-red-700">
                    IMPORTANT: NO payments go through us. They handle all
                    payments directly.
                  </strong>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Host Specific Fields */}
        {formData.userType === "host" && (
          <>
            <div className="pt-3 border-t">
              <h4 className="text-sm font-semibold mb-3">
                Host Location Information
              </h4>

              <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-3">
                <p className="text-xs text-green-800">
                  <strong>Host Model:</strong> Hosts create lots with 1+ spots.
                  They set rental prices (hourly/daily/weekly/monthly).
                  <br />
                  <strong>
                    We add $10 to every booking - host gets their price, we get
                    $10.
                  </strong>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Location/Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Park name, business name, etc."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Full Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="123 Main St, City, State 12345"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates will be automatically geocoded from this address
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Location Type</label>
                  <select
                    value={formData.locationType}
                    onChange={(e) =>
                      setFormData({ ...formData, locationType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="private_residence">Private Residence</option>
                    <option value="business">Business</option>
                    <option value="parking_lot">Parking Lot</option>
                    <option value="event_space">Event Space</option>
                    <option value="public_park">Public Park</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Foot Traffic</label>
                  <select
                    value={formData.footTraffic}
                    onChange={(e) =>
                      setFormData({ ...formData, footTraffic: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="low">Low (Quiet area)</option>
                    <option value="medium">Medium (Moderate activity)</option>
                    <option value="high">High (Busy area)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Amenities (Optional)
                  </label>
                  <div className="space-y-2">
                    {["Power", "Water", "Restrooms", "Wifi", "Seating"].map(
                      (amenity) => (
                        <label
                          key={amenity}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(
                              amenity.toLowerCase(),
                            )}
                            onChange={(e) => {
                              const value = amenity.toLowerCase();
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  amenities: [...formData.amenities, value],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  amenities: formData.amenities.filter(
                                    (a) => a !== value,
                                  ),
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-xs text-green-800">
                <strong>Host Account:</strong> Can list parking spots and event
                spaces for food trucks to use. Will have access to host
                dashboard.
              </p>
            </div>
          </>
        )}

        <Button
          type="submit"
          disabled={createUser.isPending}
          className="w-full"
        >
          {createUser.isPending ? "Creating..." : "Create Account"}
        </Button>
      </form>
    </div>
  );
}

// Host Location Manager Component
function HostLocationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingHostId, setEditingHostId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState({ lat: "", lng: "" });
  const [geocoding, setGeocoding] = useState(false);

  const { data: hosts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/hosts"],
  });

  const updateCoordinates = useMutation({
    mutationFn: async ({
      hostId,
      lat,
      lng,
    }: {
      hostId: string;
      lat: string;
      lng: string;
    }) => {
      return await apiRequest(
        "PATCH",
        `/api/admin/hosts/${hostId}/coordinates`,
        {
          latitude: lat,
          longitude: lng,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hosts"] });
      setEditingHostId(null);
      setCoordinates({ lat: "", lng: "" });
      toast({ title: "Success", description: "Host coordinates updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update coordinates",
        variant: "destructive",
      });
    },
  });

  const geocodeHost = async (host: any) => {
    if (!host.address) {
      toast({
        title: "Error",
        description: "Host has no address",
        variant: "destructive",
      });
      return;
    }

    setGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          host.address,
        )}`,
        { headers: { "User-Agent": "MealScout/1.0" } },
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setCoordinates({ lat: data[0].lat, lng: data[0].lon });
        setEditingHostId(host.id);
        toast({
          title: "Success",
          description: "Address geocoded - click Update to save",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not find coordinates",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to geocode address",
        variant: "destructive",
      });
    } finally {
      setGeocoding(false);
    }
  };

  if (isLoading) return <p>Loading hosts...</p>;

  return (
    <div className="space-y-3">
      {hosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hosts found. Create one above!
        </p>
      ) : (
        hosts.map((host) => (
          <div key={host.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{host.businessName}</p>
                <p className="text-sm text-muted-foreground">{host.address}</p>
                {host.latitude && host.longitude && (
                  <p className="text-xs text-green-600 mt-1">
                    📍 {host.latitude}, {host.longitude}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => geocodeHost(host)}
                disabled={geocoding}
              >
                {geocoding ? "..." : "Geocode"}
              </Button>
            </div>

            {editingHostId === host.id && (
              <div className="pt-2 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Latitude"
                    value={coordinates.lat}
                    onChange={(e) =>
                      setCoordinates({ ...coordinates, lat: e.target.value })
                    }
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Longitude"
                    value={coordinates.lng}
                    onChange={(e) =>
                      setCoordinates({ ...coordinates, lng: e.target.value })
                    }
                    className="px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      updateCoordinates.mutate({
                        hostId: host.id,
                        lat: coordinates.lat,
                        lng: coordinates.lng,
                      })
                    }
                    disabled={
                      !coordinates.lat ||
                      !coordinates.lng ||
                      updateCoordinates.isPending
                    }
                  >
                    Update
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingHostId(null);
                      setCoordinates({ lat: "", lng: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Staff Management Tab Component
function StaffManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: staffMembers = [], isLoading: loadingStaff } = useQuery<any[]>({
    queryKey: ["/api/admin/staff"],
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });

  const promoteToStaff = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/staff/${userId}/promote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUserId("");
      toast({
        title: "Staff Promoted",
        description: "User has been promoted to staff role.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to promote user to staff.",
        variant: "destructive",
      });
    },
  });

  const demoteStaff = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/admin/staff/${userId}/demote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Staff Demoted",
        description: "Staff member has been demoted to customer role.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to demote staff member.",
        variant: "destructive",
      });
    },
  });

  const eligibleUsers = allUsers.filter(
    (user) =>
      user.userType !== "admin" &&
      user.userType !== "staff" &&
      user.userType !== "super_admin",
  );

  // Filter out super_admin from staff members list (they should never appear here)
  const displayStaffMembers = staffMembers.filter(
    (staff) => staff.userType !== "super_admin",
  );

  return (
    <div className="space-y-6">
      {/* Current Staff */}
      <div>
        <h3 className="font-semibold mb-3">Current Staff Members</h3>
        {loadingStaff ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : displayStaffMembers.length === 0 ? (
          <p className="text-muted-foreground">No staff members yet.</p>
        ) : (
          <div className="space-y-2">
            {displayStaffMembers.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {staff.firstName} {staff.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {staff.email}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (
                      window.confirm(`Remove ${staff.email} from staff role?`)
                    ) {
                      demoteStaff.mutate(staff.id);
                    }
                  }}
                  disabled={demoteStaff.isPending}
                >
                  <UserMinus className="w-4 h-4 mr-1" />
                  Remove Staff
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promote User */}
      <div>
        <h3 className="font-semibold mb-3">Promote User to Staff</h3>
        <div className="flex gap-3">
          <select
            className="flex-1 px-3 py-2 border rounded-md bg-background"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select user...</option>
            {eligibleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email} ({user.firstName} {user.lastName}) -{" "}
                {user.userType}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              if (selectedUserId) {
                promoteToStaff.mutate(selectedUserId);
              }
            }}
            disabled={!selectedUserId || promoteToStaff.isPending}
          >
            Promote to Staff
          </Button>
        </div>
      </div>

      {/* Quick Link */}
      <div className="pt-4 border-t">
        <Link href="/staff">
          <Button variant="outline">Go to Staff Dashboard →</Button>
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [userSortKey, setUserSortKey] = useState<"name" | "type" | "created">(
    "type",
  );
  const [userSortDir, setUserSortDir] = useState<"asc" | "desc">("asc");
  const [userSearch, setUserSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [dealDetailsOpen, setDealDetailsOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [userEdits, setUserEdits] = useState<any>(null);
  const [parkingPassEdits, setParkingPassEdits] = useState<
    Record<string, any>
  >({});
  const [addressEdits, setAddressEdits] = useState<Record<string, any>>({});
  const [hostEdits, setHostEdits] = useState<Record<string, any>>({});
  const [restaurantEdits, setRestaurantEdits] = useState<Record<string, any>>(
    {},
  );
  const [dealEdits, setDealEdits] = useState<Record<string, any>>({});
  const [eventEdits, setEventEdits] = useState<Record<string, any>>({});
  const [seriesEdits, setSeriesEdits] = useState<Record<string, any>>({});
  const [bookingEdits, setBookingEdits] = useState<Record<string, any>>({});
  const [newAddress, setNewAddress] = useState<any>({
    label: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    type: "other",
    isDefault: false,
  });
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } finally {
      window.location.href = "/";
    }
  };

  // Check admin authentication
  const { data: adminUser, isLoading: isAuthLoading } = useQuery<any>({
    queryKey: ["/api/auth/admin/verify"],
    retry: false,
  });
  const isStaff = adminUser?.userType === "staff";
  const isAdminOrSuper =
    adminUser?.userType === "admin" || adminUser?.userType === "super_admin";

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!adminUser,
  });

  // Fetch pending restaurants
  const { data: pendingRestaurants = [] } = useQuery<PendingRestaurant[]>({
    queryKey: ["/api/admin/restaurants/pending"],
    enabled: !!adminUser && selectedTab === "restaurants",
  });

  // Fetch all users
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!adminUser && selectedTab === "users",
  });

  const { data: parkingPasses = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "parking-pass"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  const { data: userHosts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "hosts"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  const { data: userRestaurants = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "restaurants"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  const { data: userDeals = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "deals"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  const { data: userEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "events"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  const { data: userEventSeries = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "event-series"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  const { data: userParkingBookings } = useQuery<any>({
    queryKey: ["/api/admin/users", selectedUser?.id, "parking-pass-bookings"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });
  const { data: userAddresses = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users", selectedUser?.id, "addresses"],
    enabled: !!adminUser && !!selectedUser?.id && userDetailsOpen,
  });

  const sortedUsers = useMemo(() => {
    const typeOrder = [
      "super_admin",
      "admin",
      "staff",
      "restaurant_owner",
      "food_truck",
      "host",
      "event_coordinator",
      "customer",
    ];
    const orderMap = new Map(typeOrder.map((type, index) => [type, index]));

    const normalized = [...users];
    normalized.sort((a, b) => {
      const dir = userSortDir === "asc" ? 1 : -1;
      if (userSortKey === "type") {
        const aRank = orderMap.get(a.userType) ?? 999;
        const bRank = orderMap.get(b.userType) ?? 999;
        if (aRank !== bRank) return (aRank - bRank) * dir;
      }
      if (userSortKey === "created") {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aTime !== bTime) return (aTime - bTime) * dir;
      }

      const aName = `${a.firstName || ""} ${a.lastName || ""}`
        .trim()
        .toLowerCase();
      const bName = `${b.firstName || ""} ${b.lastName || ""}`
        .trim()
        .toLowerCase();
      return aName.localeCompare(bName) * dir;
    });

    return normalized;
  }, [users, userSortDir, userSortKey]);
  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    return sortedUsers.filter((user: any) => {
      if (userTypeFilter !== "all" && user.userType !== userTypeFilter) {
        return false;
      }
      if (!search) return true;
      const name = `${user.firstName || ""} ${user.lastName || ""}`
        .trim()
        .toLowerCase();
      const email = `${user.email || ""}`.toLowerCase();
      const phone = `${user.phone || ""}`.toLowerCase();
      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search)
      );
    });
  }, [sortedUsers, userSearch, userTypeFilter]);

  useEffect(() => {
    if (!selectedUser) {
      setUserEdits(null);
      return;
    }
    setUserEdits({
      email: selectedUser.email || "",
      firstName: selectedUser.firstName || "",
      lastName: selectedUser.lastName || "",
      phone: selectedUser.phone || "",
      postalCode: selectedUser.postalCode || "",
      birthYear: selectedUser.birthYear || "",
      gender: selectedUser.gender || "",
      isActive: !selectedUser.isDisabled,
      emailVerified: !!selectedUser.emailVerified,
      userType: selectedUser.userType || "customer",
    });
  }, [selectedUser]);

  useEffect(() => {
    if (!parkingPasses.length) {
      setParkingPassEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    parkingPasses.forEach((pass: any) => {
      nextEdits[pass.id] = {
        startTime: pass.startTime || "",
        endTime: pass.endTime || "",
        maxTrucks: pass.maxTrucks ?? 1,
        status: pass.status || "open",
        breakfastPriceCents: pass.breakfastPriceCents ?? 0,
        lunchPriceCents: pass.lunchPriceCents ?? 0,
        dinnerPriceCents: pass.dinnerPriceCents ?? 0,
        dailyPriceCents: pass.dailyPriceCents ?? 0,
        weeklyPriceCents: pass.weeklyPriceCents ?? 0,
      };
    });
    setParkingPassEdits(nextEdits);
  }, [parkingPasses]);

  useEffect(() => {
    if (!userAddresses.length) {
      setAddressEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    userAddresses.forEach((address: any) => {
      nextEdits[address.id] = {
        label: address.label || "",
        address: address.address || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        type: address.type || "other",
        isDefault: !!address.isDefault,
      };
    });
    setAddressEdits(nextEdits);
  }, [userAddresses]);

  useEffect(() => {
    if (!userHosts.length) {
      setHostEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    userHosts.forEach((host: any) => {
      nextEdits[host.id] = {
        businessName: host.businessName || "",
        address: host.address || "",
        city: host.city || "",
        state: host.state || "",
        latitude: host.latitude || "",
        longitude: host.longitude || "",
        locationType: host.locationType || "other",
        expectedFootTraffic: host.expectedFootTraffic ?? "",
        contactPhone: host.contactPhone || "",
        notes: host.notes || "",
        isVerified: !!host.isVerified,
        amenitiesText: host.amenities ? JSON.stringify(host.amenities) : "",
      };
    });
    setHostEdits(nextEdits);
  }, [userHosts]);

  useEffect(() => {
    if (!userRestaurants.length) {
      setRestaurantEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    userRestaurants.forEach((restaurant: any) => {
      nextEdits[restaurant.id] = {
        name: restaurant.name || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        businessType: restaurant.businessType || "restaurant",
        cuisineType: restaurant.cuisineType || "",
        promoCode: restaurant.promoCode || "",
        city: restaurant.city || "",
        state: restaurant.state || "",
        latitude: restaurant.latitude || "",
        longitude: restaurant.longitude || "",
        description: restaurant.description || "",
        websiteUrl: restaurant.websiteUrl || "",
        instagramUrl: restaurant.instagramUrl || "",
        facebookPageUrl: restaurant.facebookPageUrl || "",
        isActive: !!restaurant.isActive,
        isVerified: !!restaurant.isVerified,
        amenitiesText: restaurant.amenities
          ? JSON.stringify(restaurant.amenities)
          : "",
      };
    });
    setRestaurantEdits(nextEdits);
  }, [userRestaurants]);

  useEffect(() => {
    if (!userDeals.length) {
      setDealEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    userDeals.forEach((deal: any) => {
      nextEdits[deal.id] = {
        title: deal.title || "",
        description: deal.description || "",
        dealType: deal.dealType || "percentage",
        discountValue: deal.discountValue ?? "",
        minOrderAmount: deal.minOrderAmount ?? "",
        imageUrl: deal.imageUrl || "",
        startDate: deal.startDate ? deal.startDate.slice(0, 10) : "",
        endDate: deal.endDate ? deal.endDate.slice(0, 10) : "",
        startTime: deal.startTime || "",
        endTime: deal.endTime || "",
        availableDuringBusinessHours: !!deal.availableDuringBusinessHours,
        isOngoing: !!deal.isOngoing,
        totalUsesLimit: deal.totalUsesLimit ?? "",
        perCustomerLimit: deal.perCustomerLimit ?? "",
        isActive: !!deal.isActive,
      };
    });
    setDealEdits(nextEdits);
  }, [userDeals]);

  useEffect(() => {
    if (!userEvents.length) {
      setEventEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    userEvents.forEach((event: any) => {
      nextEdits[event.id] = {
        name: event.name || "",
        description: event.description || "",
        date: event.date ? event.date.slice(0, 10) : "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        maxTrucks: event.maxTrucks ?? 1,
        status: event.status || "open",
        hardCapEnabled: !!event.hardCapEnabled,
        requiresPayment: !!event.requiresPayment,
        breakfastPriceCents: event.breakfastPriceCents ?? 0,
        lunchPriceCents: event.lunchPriceCents ?? 0,
        dinnerPriceCents: event.dinnerPriceCents ?? 0,
      };
    });
    setEventEdits(nextEdits);
  }, [userEvents]);

  useEffect(() => {
    if (!userEventSeries.length) {
      setSeriesEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    userEventSeries.forEach((series: any) => {
      nextEdits[series.id] = {
        name: series.name || "",
        description: series.description || "",
        timezone: series.timezone || "America/New_York",
        recurrenceRule: series.recurrenceRule || "",
        startDate: series.startDate ? series.startDate.slice(0, 10) : "",
        endDate: series.endDate ? series.endDate.slice(0, 10) : "",
        defaultStartTime: series.defaultStartTime || "",
        defaultEndTime: series.defaultEndTime || "",
        defaultMaxTrucks: series.defaultMaxTrucks ?? 1,
        defaultHardCapEnabled: !!series.defaultHardCapEnabled,
        status: series.status || "draft",
      };
    });
    setSeriesEdits(nextEdits);
  }, [userEventSeries]);

  useEffect(() => {
    const bookingRows = [
      ...(userParkingBookings?.bookingsAsTruck || []),
      ...(userParkingBookings?.bookingsAsHost || []),
    ];
    if (!bookingRows.length) {
      setBookingEdits({});
      return;
    }
    const nextEdits: Record<string, any> = {};
    bookingRows.forEach((row: any) => {
      const booking = row.event_bookings || row;
      nextEdits[booking.id] = {
        status: booking.status || "pending",
        refundStatus: booking.refundStatus || "none",
        refundAmountCents: booking.refundAmountCents ?? "",
        cancellationReason: booking.cancellationReason || "",
        refundReason: booking.refundReason || "",
      };
    });
    setBookingEdits(nextEdits);
  }, [userParkingBookings]);

  // Fetch selected deal's performance stats
  const { data: dealStats } = useQuery<any>({
    queryKey: ["/api/admin/deals", selectedDeal?.id, "stats"],
    enabled: !!adminUser && !!selectedDeal?.id && dealDetailsOpen,
  });

  // Fetch all deals
  const { data: deals = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/deals"],
    enabled: !!adminUser && selectedTab === "deals",
  });

  // Fetch verification requests
  const { data: verificationRequests = [], isLoading: loadingVerifications } =
    useQuery<any[]>({
      queryKey: ["/api/admin/verifications"],
      enabled: !!adminUser && selectedTab === "verifications",
    });

  // Approve restaurant mutation
  const approveRestaurant = useMutation({
    mutationFn: async (restaurantId: string) => {
      return await apiRequest(
        "POST",
        `/api/admin/restaurants/${restaurantId}/approve`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/restaurants/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Restaurant Approved",
        description: "The restaurant has been activated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve restaurant. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject restaurant mutation
  const rejectRestaurant = useMutation({
    mutationFn: async (restaurantId: string) => {
      return await apiRequest(
        "DELETE",
        `/api/admin/restaurants/${restaurantId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/restaurants/pending"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Restaurant Rejected",
        description: "The restaurant application has been rejected.",
      });
    },
  });

  // Toggle deal featured status
  const toggleDealFeatured = useMutation({
    mutationFn: async ({
      dealId,
      isFeatured,
    }: {
      dealId: string;
      isFeatured: boolean;
    }) => {
      return await apiRequest("PATCH", `/api/admin/deals/${dealId}/featured`, {
        isFeatured,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      toast({
        title: "Deal Updated",
        description: "Featured status has been updated.",
      });
    },
  });

  // Delete deal
  const deleteDeal = useMutation({
    mutationFn: async (dealId: string) => {
      return await apiRequest("DELETE", `/api/admin/deals/${dealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDealDetailsOpen(false);
      toast({
        title: "Deal Deleted",
        description: "The deal has been permanently deleted.",
      });
    },
  });

  // Clone deal
  const cloneDeal = useMutation({
    mutationFn: async (dealId: string) => {
      return await apiRequest("POST", `/api/admin/deals/${dealId}/clone`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      toast({
        title: "Deal Cloned",
        description: "A copy of the deal has been created (inactive).",
      });
    },
  });

  // Toggle deal active status
  const toggleDealStatus = useMutation({
    mutationFn: async ({
      dealId,
      isActive,
    }: {
      dealId: string;
      isActive: boolean;
    }) => {
      return await apiRequest("PATCH", `/api/admin/deals/${dealId}/status`, {
        isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Deal Status Updated",
        description: "The deal has been activated/deactivated.",
      });
    },
  });

  // Extend deal
  const extendDeal = useMutation({
    mutationFn: async ({ dealId, days }: { dealId: string; days: number }) => {
      return await apiRequest("PATCH", `/api/admin/deals/${dealId}/extend`, {
        days,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deals"] });
      setDealDetailsOpen(false);
      toast({
        title: "Deal Extended",
        description: `Deal extended by ${extendDays} days successfully.`,
      });
    },
  });

  // Toggle user status
  const toggleUserStatus = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/status`, {
        isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Status Updated",
        description: "User account status has been updated.",
      });
    },
  });

  // Update user type
  const updateUserType = useMutation({
    mutationFn: async ({
      userId,
      userType,
    }: {
      userId: string;
      userType: string;
    }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/type`, {
        userType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Type Updated",
        description: "User type has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user type.",
        variant: "destructive",
      });
    },
  });

  const resendVerificationEmail = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(
        "POST",
        `/api/admin/users/${userId}/resend-verification`,
      );
    },
    onSuccess: () => {
      toast({
        title: "Verification Sent",
        description: "Verification email has been resent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive",
      });
    },
  });

  const verifyUserEmail = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/verify`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Verified",
        description: "Email verification marked as complete.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify user.",
        variant: "destructive",
      });
    },
  });

  const sendSubscriptionLink = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(
        "POST",
        `/api/admin/users/${userId}/send-subscription-link`,
      );
    },
    onSuccess: () => {
      toast({
        title: "Subscription Link Sent",
        description: "Monthly subscription link has been emailed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send subscription link.",
        variant: "destructive",
      });
    },
  });

  const updateUserInfo = useMutation({
    mutationFn: async (payload: { userId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/users/${payload.userId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(updatedUser);
      toast({
        title: "User Updated",
        description: "User information has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  const updateParkingPass = useMutation({
    mutationFn: async (payload: { eventId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/parking-pass/${payload.eventId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "parking-pass"],
      });
      toast({
        title: "Parking Pass Updated",
        description: "Parking pass listing updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update parking pass.",
        variant: "destructive",
      });
    },
  });

  const createAddress = useMutation({
    mutationFn: async (payload: { userId: string; data: any }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/users/${payload.userId}/addresses`,
        payload.data,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "addresses"],
      });
      setNewAddress({
        label: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        type: "other",
        isDefault: false,
      });
      toast({ title: "Address Added" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add address.",
        variant: "destructive",
      });
    },
  });

  const updateAddress = useMutation({
    mutationFn: async (payload: {
      userId: string;
      addressId: string;
      updates: any;
    }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/users/${payload.userId}/addresses/${payload.addressId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "addresses"],
      });
      toast({ title: "Address Updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update address.",
        variant: "destructive",
      });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (payload: { userId: string; addressId: string }) => {
      return await apiRequest(
        "DELETE",
        `/api/admin/users/${payload.userId}/addresses/${payload.addressId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "addresses"],
      });
      toast({ title: "Address Deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address.",
        variant: "destructive",
      });
    },
  });

  const setDefaultAddress = useMutation({
    mutationFn: async (payload: { userId: string; addressId: string }) => {
      return await apiRequest(
        "POST",
        `/api/admin/users/${payload.userId}/addresses/${payload.addressId}/default`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "addresses"],
      });
      toast({ title: "Default Address Updated" });
    },
  });

  const updateHost = useMutation({
    mutationFn: async (payload: { hostId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/hosts/${payload.hostId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "hosts"],
      });
      toast({ title: "Host Updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update host.",
        variant: "destructive",
      });
    },
  });

  const updateRestaurant = useMutation({
    mutationFn: async (payload: { restaurantId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/restaurants/${payload.restaurantId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "restaurants"],
      });
      toast({ title: "Restaurant Updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update restaurant.",
        variant: "destructive",
      });
    },
  });

  const updateDeal = useMutation({
    mutationFn: async (payload: { dealId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/deals/${payload.dealId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "deals"],
      });
      toast({ title: "Deal Updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update deal.",
        variant: "destructive",
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (payload: { eventId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/events/${payload.eventId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "events"],
      });
      toast({ title: "Event Updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event.",
        variant: "destructive",
      });
    },
  });

  const updateEventSeries = useMutation({
    mutationFn: async (payload: { seriesId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/event-series/${payload.seriesId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "event-series"],
      });
      toast({ title: "Open Call Updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update open call.",
        variant: "destructive",
      });
    },
  });

  const updateBooking = useMutation({
    mutationFn: async (payload: { bookingId: string; updates: any }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/parking-pass-bookings/${payload.bookingId}`,
        payload.updates,
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users", selectedUser?.id, "parking-pass-bookings"],
      });
      toast({ title: "Booking Updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update booking.",
        variant: "destructive",
      });
    },
  });

  // Delete user
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserDetailsOpen(false);
      toast({
        title: "User Deleted",
        description: "User account has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  // Delete user (super admin only)
  const deleteUserPermanently = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setUserDetailsOpen(false);
      toast({
        title: "User Deleted",
        description: "User has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to delete user. You may need super admin permissions.",
        variant: "destructive",
      });
    },
  });

  // Approve verification request
  const approveVerification = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest(
        "POST",
        `/api/admin/verifications/${requestId}/approve`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Verification Approved",
        description: "Restaurant verification has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject verification request
  const rejectVerification = useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) => {
      return await apiRequest(
        "POST",
        `/api/admin/verifications/${requestId}/reject`,
        { reason },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Verification Rejected",
        description: "Restaurant verification has been rejected.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject verification. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center p-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-destructive" />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultStats: DashboardStats = {
    totalUsers: 0,
    totalRestaurants: 0,
    totalDeals: 0,
    activeDeals: 0,
    totalClaims: 0,
    todayClaims: 0,
    revenue: 0,
    newUsersToday: 0,
  };

  const dashboardStats = stats || defaultStats;

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-[var(--bg-app)] pb-20">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-6 bg-[hsl(var(--background))] border-b border-white/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage your MealScout platform
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            data-testid="button-logout-admin"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Dashboard Switcher */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <QuickDashboardAccess />
      </div>

      {/* Stats Overview */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.totalUsers}
                </div>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{dashboardStats.newUsersToday} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Restaurants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.totalRestaurants}
                </div>
                <Store className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingRestaurants.length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Deals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.activeDeals}
                </div>
                <Package className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {dashboardStats.totalDeals} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Claims Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {dashboardStats.todayClaims}
                </div>
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dashboardStats.totalClaims} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full inline-flex h-auto flex-wrap gap-1 p-1">
            <TabsTrigger
              value="overview"
              data-testid="tab-overview"
              className="flex-shrink-0"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="restaurants"
              data-testid="tab-restaurants"
              className="flex-shrink-0"
            >
              Restaurants
            </TabsTrigger>
            <TabsTrigger
              value="users"
              data-testid="tab-users"
              className="flex-shrink-0"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              data-testid="tab-staff"
              className="flex-shrink-0"
            >
              Staff
            </TabsTrigger>
            <TabsTrigger
              value="deals"
              data-testid="tab-deals"
              className="flex-shrink-0"
            >
              Deals
            </TabsTrigger>
            <TabsTrigger
              value="verifications"
              data-testid="tab-verifications"
              className="flex-shrink-0"
            >
              Verifications
            </TabsTrigger>
            <TabsTrigger
              value="onboarding"
              data-testid="tab-onboarding"
              className="flex-shrink-0"
            >
              Manual Onboarding
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">System Status</span>
                  </div>
                  <Badge variant="default">Operational</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Conversion Rate
                    </div>
                    <div className="text-xl font-bold">
                      {dashboardStats.totalClaims > 0
                        ? (
                            (dashboardStats.todayClaims /
                              dashboardStats.totalClaims) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Monthly Revenue
                    </div>
                    <div className="text-xl font-bold">
                      {(() => {
                        const revenue = Number(dashboardStats?.revenue ?? 0);
                        return `$${revenue.toFixed(2)}`;
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Restaurant Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRestaurants.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No pending approvals
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingRestaurants.map((restaurant: PendingRestaurant) => (
                      <div
                        key={restaurant.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{restaurant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {restaurant.cuisineType} • {restaurant.email}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              approveRestaurant.mutate(restaurant.id)
                            }
                            disabled={approveRestaurant.isPending}
                            data-testid={`button-approve-${restaurant.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              rejectRestaurant.mutate(restaurant.id)
                            }
                            disabled={rejectRestaurant.isPending}
                            data-testid={`button-reject-${restaurant.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Sorting affects the full user list.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search name, email, phone"
                      className="text-xs px-2 py-1 border rounded-md bg-background"
                    />
                    <select
                      value={userTypeFilter}
                      onChange={(e) => setUserTypeFilter(e.target.value)}
                      className="text-xs px-2 py-1 border rounded-md bg-background"
                    >
                      <option value="all">All Types</option>
                      <option value="customer">Customer</option>
                      <option value="food_truck">Food Truck</option>
                      <option value="restaurant_owner">Restaurant Owner</option>
                      <option value="host">Host</option>
                      <option value="event_coordinator">Event Coordinator</option>
                      <option value="staff">Staff</option>
                      {(adminUser?.userType === "admin" ||
                        adminUser?.userType === "super_admin") && (
                        <option value="admin">Admin</option>
                      )}
                      {adminUser?.userType === "super_admin" && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                    <select
                      value={userSortKey}
                      onChange={(e) =>
                        setUserSortKey(e.target.value as typeof userSortKey)
                      }
                      className="text-xs px-2 py-1 border rounded-md bg-background"
                    >
                      <option value="type">Sort by Type</option>
                      <option value="name">Sort by Name</option>
                      <option value="created">Sort by Created</option>
                    </select>
                    <select
                      value={userSortDir}
                      onChange={(e) =>
                        setUserSortDir(e.target.value as typeof userSortDir)
                      }
                      className="text-xs px-2 py-1 border rounded-md bg-background"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3 mt-3">
                  {filteredUsers.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.postalCode && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3" />
                            {user.postalCode}
                          </div>
                        )}
                      </div>
                      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex flex-col gap-2">
                          <select
                            value={user.userType}
                            onChange={(e) =>
                              updateUserType.mutate({
                                userId: user.id,
                                userType: e.target.value,
                              })
                            }
                            className="text-xs px-2 py-1 border rounded-md"
                            disabled={updateUserType.isPending || isStaff}
                          >
                            <option value="customer">Customer</option>
                            <option value="food_truck">Food Truck</option>
                            <option value="restaurant_owner">
                              Restaurant Owner
                            </option>
                            <option value="host">Host</option>
                            <option value="event_coordinator">
                              Event Coordinator
                            </option>
                            <option value="staff">Staff</option>
                            {(adminUser?.userType === "admin" ||
                              adminUser?.userType === "super_admin") && (
                              <option value="admin">Admin</option>
                            )}
                            {adminUser?.userType === "super_admin" && (
                              <option value="super_admin">Super Admin</option>
                            )}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resendVerificationEmail.mutate(user.id)}
                            disabled={
                              resendVerificationEmail.isPending ||
                              isStaff ||
                              !user.email ||
                              user.emailVerified
                            }
                            data-testid={`button-resend-verify-${user.id}`}
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            {user.emailVerified ? "Verified" : "Resend Verify"}
                          </Button>
                          {isAdminOrSuper && !user.emailVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verifyUserEmail.mutate(user.id)}
                              disabled={verifyUserEmail.isPending}
                              data-testid={`button-verify-user-${user.id}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Auto Verify
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendSubscriptionLink.mutate(user.id)}
                            disabled={
                              sendSubscriptionLink.isPending ||
                              isStaff ||
                              !user.email ||
                              !["restaurant_owner", "food_truck"].includes(
                                user.userType,
                              )
                            }
                            data-testid={`button-send-subscription-${user.id}`}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Send Monthly Link
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDetailsOpen(true);
                          }}
                          data-testid={`button-view-user-${user.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        {!isStaff && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!user.isDisabled}
                              onCheckedChange={(checked) =>
                                toggleUserStatus.mutate({
                                  userId: user.id,
                                  isActive: checked,
                                })
                              }
                              data-testid={`switch-user-${user.id}`}
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to permanently delete ${user.firstName} ${user.lastName}? This cannot be undone.`,
                                  )
                                ) {
                                  deleteUser.mutate(user.id);
                                }
                              }}
                              disabled={deleteUser.isPending}
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab (Admin Only) */}
          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Promote users to staff role or remove staff access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffManagementTab />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deal Management</CardTitle>
                <CardDescription>
                  View, edit, and manage all deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-lg">
                            {deal.title}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {deal.restaurant?.name} • {deal.discountValue}% off
                            • Ends {new Date(deal.endDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={deal.isActive ? "default" : "secondary"}
                          >
                            {deal.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {deal.isFeatured && (
                            <Badge variant="outline">Featured</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            {deal.currentUses || 0} uses
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {deal.startTime} - {deal.endTime}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDeal(deal);
                              setDealDetailsOpen(true);
                            }}
                            data-testid={`button-view-deal-${deal.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>

                          <Link href={`/deal-edit/${deal.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-edit-deal-${deal.id}`}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </Link>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cloneDeal.mutate(deal.id)}
                            disabled={cloneDeal.isPending}
                            data-testid={`button-clone-deal-${deal.id}`}
                          >
                            <Package className="w-4 h-4 mr-1" />
                            Clone
                          </Button>

                          <Switch
                            checked={deal.isActive}
                            onCheckedChange={(checked) =>
                              toggleDealStatus.mutate({
                                dealId: deal.id,
                                isActive: checked,
                              })
                            }
                            data-testid={`switch-deal-active-${deal.id}`}
                          />

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this deal? This action cannot be undone.",
                                )
                              ) {
                                deleteDeal.mutate(deal.id);
                              }
                            }}
                            disabled={deleteDeal.isPending}
                            data-testid={`button-delete-deal-${deal.id}`}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Business Verification Requests</span>
                </CardTitle>
                <CardDescription>
                  Review and approve restaurant verification documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVerifications ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : verificationRequests.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No verification requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verificationRequests.map((request: any) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {request.restaurant?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {request.restaurant?.address}
                            </p>
                          </div>
                          <Badge
                            variant={
                              request.status === "pending"
                                ? "secondary"
                                : request.status === "approved"
                                  ? "default"
                                  : "destructive"
                            }
                            className="flex items-center space-x-1"
                          >
                            {request.status === "pending" && (
                              <Clock className="w-3 h-3" />
                            )}
                            {request.status === "approved" && (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            {request.status === "rejected" && (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Submitted:{" "}
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </p>
                          {request.documents &&
                            request.documents.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">
                                  Documents ({request.documents.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {request.documents.map(
                                    (doc: string, index: number) => (
                                      <div key={index} className="relative">
                                        {doc.startsWith("data:image") ? (
                                          <img
                                            src={doc}
                                            alt={`Document ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded cursor-pointer border"
                                            onClick={() =>
                                              window.open(doc, "_blank")
                                            }
                                            data-testid={`img-document-${request.id}-${index}`}
                                          />
                                        ) : (
                                          <div
                                            className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center cursor-pointer border"
                                            onClick={() =>
                                              window.open(doc, "_blank")
                                            }
                                            data-testid={`doc-document-${request.id}-${index}`}
                                          >
                                            <i className="fas fa-file-pdf text-2xl text-red-500"></i>
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </div>

                        {request.rejectionReason && (
                          <div className="mb-4 p-3 bg-destructive/10 rounded-md">
                            <p className="text-sm font-medium text-destructive mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-destructive">
                              {request.rejectionReason}
                            </p>
                          </div>
                        )}

                        {request.status === "pending" && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                approveVerification.mutate(request.id)
                              }
                              disabled={approveVerification.isPending}
                              data-testid={`button-approve-verification-${request.id}`}
                              className="flex items-center space-x-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = window.prompt(
                                  "Please provide a reason for rejection:",
                                );
                                if (reason && reason.trim()) {
                                  rejectVerification.mutate({
                                    requestId: request.id,
                                    reason: reason.trim(),
                                  });
                                }
                              }}
                              disabled={rejectVerification.isPending}
                              data-testid={`button-reject-verification-${request.id}`}
                              className="flex items-center space-x-1"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Create User Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Create Account
                  </CardTitle>
                  <CardDescription>
                    Manually onboard a new user, host, event coordinator,
                    restaurant owner, or staff member. We'll email a setup link
                    so they can finish their profile and set a password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ManualUserCreation adminUser={adminUser} />
                </CardContent>
              </Card>

              <TruckImportPanel enabled={selectedTab === "onboarding"} />
            </div>

            {/* Existing Hosts Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Manage Host Locations
                </CardTitle>
                <CardDescription>
                  View and update geocoded locations for existing hosts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HostLocationManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Details</span>
            </DialogTitle>
            <DialogDescription>
              Complete profile information and activity details
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 mt-4">
              {/* Edit User */}
              {!isStaff && userEdits && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <Settings className="w-4 h-4 mr-2" />
                    EDIT USER
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={userEdits.email}
                        onChange={(e) =>
                          setUserEdits({ ...userEdits, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">User Type</p>
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                        value={userEdits.userType}
                        onChange={(e) =>
                          setUserEdits({
                            ...userEdits,
                            userType: e.target.value,
                          })
                        }
                      >
                        <option value="customer">Customer</option>
                        <option value="food_truck">Food Truck</option>
                        <option value="restaurant_owner">Restaurant Owner</option>
                        <option value="host">Host</option>
                        <option value="event_coordinator">Event Coordinator</option>
                        <option value="staff">Staff</option>
                        {(adminUser?.userType === "admin" ||
                          adminUser?.userType === "super_admin") && (
                          <option value="admin">Admin</option>
                        )}
                        {adminUser?.userType === "super_admin" && (
                          <option value="super_admin">Super Admin</option>
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">First Name</p>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={userEdits.firstName}
                        onChange={(e) =>
                          setUserEdits({
                            ...userEdits,
                            firstName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Last Name</p>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={userEdits.lastName}
                        onChange={(e) =>
                          setUserEdits({
                            ...userEdits,
                            lastName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={userEdits.phone}
                        onChange={(e) =>
                          setUserEdits({
                            ...userEdits,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Postal Code</p>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={userEdits.postalCode}
                        onChange={(e) =>
                          setUserEdits({
                            ...userEdits,
                            postalCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Birth Year</p>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        value={userEdits.birthYear}
                        onChange={(e) =>
                          setUserEdits({
                            ...userEdits,
                            birthYear: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <select
                        className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                        value={userEdits.gender}
                        onChange={(e) =>
                          setUserEdits({
                            ...userEdits,
                            gender: e.target.value,
                          })
                        }
                      >
                        <option value="">Unspecified</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">
                        Active
                      </label>
                      <Switch
                        checked={!!userEdits.isActive}
                        onCheckedChange={(checked) =>
                          setUserEdits({ ...userEdits, isActive: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">
                        Email Verified
                      </label>
                      <Switch
                        checked={!!userEdits.emailVerified}
                        onCheckedChange={(checked) =>
                          setUserEdits({
                            ...userEdits,
                            emailVerified: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateUserInfo.mutate({
                          userId: selectedUser.id,
                          updates: userEdits,
                        })
                      }
                      disabled={updateUserInfo.isPending || isStaff}
                      data-testid="button-save-user"
                    >
                      Save User Changes
                    </Button>
                  </div>
                </div>
              )}
              {/* Basic Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  BASIC INFORMATION
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">User Type</p>
                    <Badge
                      variant={
                        selectedUser.userType === "admin"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedUser.userType}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {selectedUser.email}
                    </p>
                  </div>
                  {selectedUser.phone && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedUser.phone}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Email Verified
                    </p>
                    <Badge
                      variant={
                        selectedUser.emailVerified ? "default" : "secondary"
                      }
                    >
                      {selectedUser.emailVerified ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Account Status
                    </p>
                    <Badge
                      variant={
                        !selectedUser.isDisabled ? "default" : "destructive"
                      }
                    >
                      {!selectedUser.isDisabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Location & Demographics */}
              {(selectedUser.postalCode ||
                selectedUser.birthYear ||
                selectedUser.gender) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    LOCATION & DEMOGRAPHICS
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.postalCode && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Postal Code
                        </p>
                        <p className="text-sm flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedUser.postalCode}
                        </p>
                      </div>
                    )}
                    {selectedUser.birthYear && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Birth Year
                        </p>
                        <p className="text-sm">{selectedUser.birthYear}</p>
                      </div>
                    )}
                    {selectedUser.gender && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm capitalize">
                          {selectedUser.gender}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subscription Information */}
              {(selectedUser.stripeCustomerId ||
                selectedUser.stripeSubscriptionId) && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <CreditCard className="w-4 h-4 mr-2" />
                    SUBSCRIPTION
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedUser.stripeCustomerId && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Stripe Customer ID
                        </p>
                        <p className="text-sm font-mono text-xs">
                          {selectedUser.stripeCustomerId}
                        </p>
                      </div>
                    )}
                    {selectedUser.stripeSubscriptionId && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Subscription ID
                        </p>
                        <p className="text-sm font-mono text-xs">
                          {selectedUser.stripeSubscriptionId}
                        </p>
                      </div>
                    )}
                    {selectedUser.subscriptionBillingInterval && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Billing Interval
                        </p>
                        <Badge variant="outline">
                          {selectedUser.subscriptionBillingInterval}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Authentication Methods */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 mr-2" />
                  AUTHENTICATION METHODS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.googleId && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Google OAuth
                    </Badge>
                  )}
                  {selectedUser.facebookId && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Facebook OAuth
                    </Badge>
                  )}
                  {selectedUser.passwordHash && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Email/Password
                    </Badge>
                  )}
                </div>
              </div>

              {/* Account Activity */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  ACCOUNT ACTIVITY
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Account Created
                    </p>
                    <p className="text-sm">
                      {new Date(selectedUser.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  {selectedUser.updatedAt && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Last Updated
                      </p>
                      <p className="text-sm">
                        {new Date(selectedUser.updatedAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Addresses */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  SAVED ADDRESSES ({userAddresses.length})
                </h3>
                <div className="space-y-3">
                  {userAddresses.map((address: any) => {
                    const edits = addressEdits[address.id];
                    if (!edits) return null;
                    return (
                      <div
                        key={address.id}
                        className="border rounded-lg p-3 bg-muted/30 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge variant="default" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setDefaultAddress.mutate({
                                  userId: selectedUser.id,
                                  addressId: address.id,
                                })
                              }
                              disabled={isStaff}
                            >
                              Set Default
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteAddress.mutate({
                                  userId: selectedUser.id,
                                  addressId: address.id,
                                })
                              }
                              disabled={isStaff}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            className="w-full px-2 py-1 border rounded-md text-sm"
                            placeholder="Label"
                            value={edits.label}
                            onChange={(e) =>
                              setAddressEdits({
                                ...addressEdits,
                                [address.id]: {
                                  ...edits,
                                  label: e.target.value,
                                },
                              })
                            }
                          />
                          <select
                            className="w-full px-2 py-1 border rounded-md text-sm bg-background"
                            value={edits.type}
                            onChange={(e) =>
                              setAddressEdits({
                                ...addressEdits,
                                [address.id]: {
                                  ...edits,
                                  type: e.target.value,
                                },
                              })
                            }
                          >
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                          <input
                            className="w-full px-2 py-1 border rounded-md text-sm"
                            placeholder="Address"
                            value={edits.address}
                            onChange={(e) =>
                              setAddressEdits({
                                ...addressEdits,
                                [address.id]: {
                                  ...edits,
                                  address: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            className="w-full px-2 py-1 border rounded-md text-sm"
                            placeholder="City"
                            value={edits.city}
                            onChange={(e) =>
                              setAddressEdits({
                                ...addressEdits,
                                [address.id]: {
                                  ...edits,
                                  city: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            className="w-full px-2 py-1 border rounded-md text-sm"
                            placeholder="State"
                            value={edits.state}
                            onChange={(e) =>
                              setAddressEdits({
                                ...addressEdits,
                                [address.id]: {
                                  ...edits,
                                  state: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            className="w-full px-2 py-1 border rounded-md text-sm"
                            placeholder="Postal Code"
                            value={edits.postalCode}
                            onChange={(e) =>
                              setAddressEdits({
                                ...addressEdits,
                                [address.id]: {
                                  ...edits,
                                  postalCode: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateAddress.mutate({
                                userId: selectedUser.id,
                                addressId: address.id,
                                updates: edits,
                              })
                            }
                            disabled={isStaff}
                          >
                            Save Address
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border rounded-lg p-3 space-y-3">
                    <div className="text-sm font-medium">Add New Address</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        className="w-full px-2 py-1 border rounded-md text-sm"
                        placeholder="Label"
                        value={newAddress.label}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, label: e.target.value })
                        }
                      />
                      <select
                        className="w-full px-2 py-1 border rounded-md text-sm bg-background"
                        value={newAddress.type}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, type: e.target.value })
                        }
                      >
                        <option value="home">Home</option>
                        <option value="work">Work</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        className="w-full px-2 py-1 border rounded-md text-sm"
                        placeholder="Address"
                        value={newAddress.address}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            address: e.target.value,
                          })
                        }
                      />
                      <input
                        className="w-full px-2 py-1 border rounded-md text-sm"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                      />
                      <input
                        className="w-full px-2 py-1 border rounded-md text-sm"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, state: e.target.value })
                        }
                      />
                      <input
                        className="w-full px-2 py-1 border rounded-md text-sm"
                        placeholder="Postal Code"
                        value={newAddress.postalCode}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            postalCode: e.target.value,
                          })
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={newAddress.isDefault}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            isDefault: e.target.checked,
                          })
                        }
                      />
                      Set as default
                    </label>
                    <Button
                      size="sm"
                      onClick={() =>
                        createAddress.mutate({
                          userId: selectedUser.id,
                          data: newAddress,
                        })
                      }
                      disabled={createAddress.isPending || isStaff}
                    >
                      Add Address
                    </Button>
                  </div>
                </div>
              </div>

              {/* Host Profiles */}
              {userHosts.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    HOST PROFILES ({userHosts.length})
                  </h3>
                  <div className="space-y-4">
                    {userHosts.map((host: any) => {
                      const edits = hostEdits[host.id];
                      if (!edits) return null;
                      return (
                        <div
                          key={host.id}
                          className="border rounded-lg p-3 bg-muted/30 space-y-3"
                        >
                          <div className="text-sm font-medium">
                            {host.businessName}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.businessName}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    businessName: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.address}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    address: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="City"
                              value={edits.city}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    city: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="State"
                              value={edits.state}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    state: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Latitude"
                              value={edits.latitude}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    latitude: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Longitude"
                              value={edits.longitude}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    longitude: e.target.value,
                                  },
                                })
                              }
                            />
                            <select
                              className="w-full px-2 py-1 border rounded-md text-sm bg-background"
                              value={edits.locationType}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    locationType: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="private_residence">
                                Private Residence
                              </option>
                              <option value="business">Business</option>
                              <option value="parking_lot">Parking Lot</option>
                              <option value="event_space">Event Space</option>
                              <option value="public_park">Public Park</option>
                              <option value="other">Other</option>
                            </select>
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Foot Traffic"
                              value={edits.expectedFootTraffic}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    expectedFootTraffic: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Contact Phone"
                              value={edits.contactPhone}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    contactPhone: e.target.value,
                                  },
                                })
                              }
                            />
                            <textarea
                              className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2"
                              placeholder="Amenities JSON"
                              value={edits.amenitiesText}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    amenitiesText: e.target.value,
                                  },
                                })
                              }
                            />
                            <textarea
                              className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2"
                              placeholder="Notes"
                              value={edits.notes}
                              onChange={(e) =>
                                setHostEdits({
                                  ...hostEdits,
                                  [host.id]: {
                                    ...edits,
                                    notes: e.target.value,
                                  },
                                })
                              }
                            />
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={edits.isVerified}
                                onChange={(e) =>
                                  setHostEdits({
                                    ...hostEdits,
                                    [host.id]: {
                                      ...edits,
                                      isVerified: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Verified
                            </label>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              let amenities: any = undefined;
                              if (edits.amenitiesText) {
                                try {
                                  amenities = JSON.parse(edits.amenitiesText);
                                } catch {
                                  toast({
                                    title: "Invalid JSON",
                                    description:
                                      "Amenities must be valid JSON.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                              }
                              updateHost.mutate({
                                hostId: host.id,
                                updates: {
                                  ...edits,
                                  amenities,
                                },
                              });
                            }}
                            disabled={isStaff}
                          >
                            Save Host
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Restaurants */}
              {userRestaurants.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <Store className="w-4 h-4 mr-2" />
                    RESTAURANTS ({userRestaurants.length})
                  </h3>
                  <div className="space-y-4">
                    {userRestaurants.map((restaurant: any) => {
                      const edits = restaurantEdits[restaurant.id];
                      if (!edits) return null;
                      return (
                        <div
                          key={restaurant.id}
                          className="border rounded-lg p-3 bg-muted/30 space-y-3"
                        >
                          <div className="text-sm font-medium">
                            {restaurant.name}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.name}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    name: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.address}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    address: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Phone"
                              value={edits.phone}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    phone: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Cuisine Type"
                              value={edits.cuisineType}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    cuisineType: e.target.value,
                                  },
                                })
                              }
                            />
                            <select
                              className="w-full px-2 py-1 border rounded-md text-sm bg-background"
                              value={edits.businessType}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    businessType: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="restaurant">Restaurant</option>
                              <option value="bar">Bar</option>
                              <option value="food_truck">Food Truck</option>
                            </select>
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Promo Code"
                              value={edits.promoCode}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    promoCode: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="City"
                              value={edits.city}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    city: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="State"
                              value={edits.state}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    state: e.target.value,
                                  },
                                })
                              }
                            />
                            <textarea
                              className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2"
                              placeholder="Description"
                              value={edits.description}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    description: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Website URL"
                              value={edits.websiteUrl}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    websiteUrl: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Instagram URL"
                              value={edits.instagramUrl}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    instagramUrl: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Facebook Page URL"
                              value={edits.facebookPageUrl}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    facebookPageUrl: e.target.value,
                                  },
                                })
                              }
                            />
                            <textarea
                              className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2"
                              placeholder="Amenities JSON"
                              value={edits.amenitiesText}
                              onChange={(e) =>
                                setRestaurantEdits({
                                  ...restaurantEdits,
                                  [restaurant.id]: {
                                    ...edits,
                                    amenitiesText: e.target.value,
                                  },
                                })
                              }
                            />
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={edits.isActive}
                                onChange={(e) =>
                                  setRestaurantEdits({
                                    ...restaurantEdits,
                                    [restaurant.id]: {
                                      ...edits,
                                      isActive: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Active
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={edits.isVerified}
                                onChange={(e) =>
                                  setRestaurantEdits({
                                    ...restaurantEdits,
                                    [restaurant.id]: {
                                      ...edits,
                                      isVerified: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Verified
                            </label>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              let amenities: any = undefined;
                              if (edits.amenitiesText) {
                                try {
                                  amenities = JSON.parse(edits.amenitiesText);
                                } catch {
                                  toast({
                                    title: "Invalid JSON",
                                    description:
                                      "Amenities must be valid JSON.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                              }
                              updateRestaurant.mutate({
                                restaurantId: restaurant.id,
                                updates: {
                                  ...edits,
                                  amenities,
                                },
                              });
                            }}
                            disabled={isStaff}
                          >
                            Save Restaurant
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deals */}
              {userDeals.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4 mr-2" />
                    DEALS ({userDeals.length})
                  </h3>
                  <div className="space-y-4">
                    {userDeals.map((deal: any) => {
                      const edits = dealEdits[deal.id];
                      if (!edits) return null;
                      return (
                        <div
                          key={deal.id}
                          className="border rounded-lg p-3 bg-muted/30 space-y-3"
                        >
                          <div className="text-sm font-medium">
                            {deal.title}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.title}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    title: e.target.value,
                                  },
                                })
                              }
                            />
                            <select
                              className="w-full px-2 py-1 border rounded-md text-sm bg-background"
                              value={edits.dealType}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    dealType: e.target.value,
                                  },
                                })
                              }
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed</option>
                            </select>
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Discount Value"
                              value={edits.discountValue}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    discountValue: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Min Order Amount"
                              value={edits.minOrderAmount}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    minOrderAmount: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              placeholder="Image URL"
                              value={edits.imageUrl}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    imageUrl: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              type="date"
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.startDate}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    startDate: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              type="date"
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.endDate}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    endDate: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              type="time"
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.startTime}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    startTime: e.target.value,
                                  },
                                })
                              }
                            />
                            <input
                              type="time"
                              className="w-full px-2 py-1 border rounded-md text-sm"
                              value={edits.endTime}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    endTime: e.target.value,
                                  },
                                })
                              }
                            />
                            <textarea
                              className="w-full px-2 py-1 border rounded-md text-sm sm:col-span-2"
                              placeholder="Description"
                              value={edits.description}
                              onChange={(e) =>
                                setDealEdits({
                                  ...dealEdits,
                                  [deal.id]: {
                                    ...edits,
                                    description: e.target.value,
                                  },
                                })
                              }
                            />
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={edits.availableDuringBusinessHours}
                                onChange={(e) =>
                                  setDealEdits({
                                    ...dealEdits,
                                    [deal.id]: {
                                      ...edits,
                                      availableDuringBusinessHours:
                                        e.target.checked,
                                    },
                                  })
                                }
                              />
                              Business Hours Only
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={edits.isOngoing}
                                onChange={(e) =>
                                  setDealEdits({
                                    ...dealEdits,
                                    [deal.id]: {
                                      ...edits,
                                      isOngoing: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Ongoing
                            </label>
                            <label className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={edits.isActive}
                                onChange={(e) =>
                                  setDealEdits({
                                    ...dealEdits,
                                    [deal.id]: {
                                      ...edits,
                                      isActive: e.target.checked,
                                    },
                                  })
                                }
                              />
                              Active
                            </label>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateDeal.mutate({
                                dealId: deal.id,
                                updates: edits,
                              })
                            }
                            disabled={isStaff}
                          >
                            Save Deal
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Profile Image */}
              {selectedUser.profileImageUrl && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    PROFILE IMAGE
                  </h3>
                  <img
                    src={getOptimizedImageUrl(
                      selectedUser.profileImageUrl,
                      "large",
                    )}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2"
                    data-testid="img-user-profile"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Parking Pass Listings */}
              {parkingPasses.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    PARKING PASS LISTINGS ({parkingPasses.length})
                  </h3>
                  <div className="space-y-4">
                    {parkingPasses.map((pass: any) => {
                      const edits = parkingPassEdits[pass.id];
                      if (!edits) return null;
                      const hostName =
                        pass.host?.businessName ?? pass.name ?? "Parking Pass";
                      const addressParts = [
                        pass.host?.address,
                        pass.host?.city,
                        pass.host?.state,
                      ].filter(Boolean);
                      const addressLabel = addressParts.length
                        ? addressParts.join(", ")
                        : null;
                      const nextDate = pass.nextDate ?? pass.date;
                      return (
                        <div
                          key={pass.id}
                          className="border rounded-lg p-3 bg-muted/30 space-y-3"
                        >
                          <div className="text-sm font-medium">
                            {hostName}
                            {addressLabel ? ` · ${addressLabel}` : ""}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Applies to all upcoming dates
                            {nextDate
                              ? ` · Next date ${new Date(
                                  nextDate,
                                ).toLocaleDateString()}`
                              : ""}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Start Time
                              </p>
                              <input
                                type="time"
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={edits.startTime}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      startTime: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                End Time
                              </p>
                              <input
                                type="time"
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={edits.endTime}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      endTime: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Max Trucks
                              </p>
                              <input
                                type="number"
                                min={1}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={edits.maxTrucks}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      maxTrucks: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Status
                              </p>
                              <select
                                className="w-full px-2 py-1 border rounded-md text-sm bg-background"
                                value={edits.status}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      status: e.target.value,
                                    },
                                  })
                                }
                              >
                                <option value="open">Open</option>
                                <option value="booked">Booked</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Breakfast (cents)
                              </p>
                              <input
                                type="number"
                                min={0}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={edits.breakfastPriceCents}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      breakfastPriceCents: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Lunch (cents)
                              </p>
                              <input
                                type="number"
                                min={0}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={edits.lunchPriceCents}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      lunchPriceCents: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Dinner (cents)
                              </p>
                              <input
                                type="number"
                                min={0}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={edits.dinnerPriceCents}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      dinnerPriceCents: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Daily (cents)
                              </p>
                              <input
                                type="number"
                                min={0}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={edits.dailyPriceCents}
                                onChange={(e) =>
                                  setParkingPassEdits({
                                    ...parkingPassEdits,
                                    [pass.id]: {
                                      ...edits,
                                      dailyPriceCents: e.target.value,
                                      weeklyPriceCents:
                                        Number(e.target.value || 0) * 7,
                                      monthlyPriceCents:
                                        Number(e.target.value || 0) * 30,
                                    },
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Weekly (cents)
                              </p>
                              <input
                                type="number"
                                min={0}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={
                                  Number(edits.dailyPriceCents || 0)
                                    ? Number(edits.dailyPriceCents || 0) * 7
                                    : edits.weeklyPriceCents
                                }
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                Monthly (cents)
                              </p>
                              <input
                                type="number"
                                min={0}
                                className="w-full px-2 py-1 border rounded-md text-sm"
                                value={
                                  Number(edits.dailyPriceCents || 0)
                                    ? Number(edits.dailyPriceCents || 0) * 30
                                    : edits.monthlyPriceCents
                                }
                                readOnly
                                disabled
                              />
                            </div>
                          </div>
                          <div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateParkingPass.mutate({
                                  eventId: pass.id,
                                  updates: edits,
                                })
                              }
                              disabled={updateParkingPass.isPending || isStaff}
                              data-testid={`button-save-parking-pass-${pass.id}`}
                            >
                              Save Parking Pass
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Danger Zone - Super Admin Only */}
              {adminUser?.userType === "super_admin" && (
                <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                  <h3 className="font-semibold mb-2 text-destructive flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Permanently delete this user account. This action cannot be
                    undone and will remove all associated data.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you absolutely sure you want to delete ${selectedUser.email}? This will permanently delete the account and all associated data. This action cannot be undone.`,
                        )
                      ) {
                        deleteUser.mutate(selectedUser.id);
                      }
                    }}
                    disabled={deleteUser.isPending}
                  >
                    <UserMinus className="w-4 h-4 mr-1" />
                    Delete User Permanently
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deal Details Dialog */}
      <Dialog open={dealDetailsOpen} onOpenChange={setDealDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Deal Details & Performance</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive information and analytics for this deal
            </DialogDescription>
          </DialogHeader>

          {selectedDeal && (
            <div className="space-y-6 mt-4">
              {/* Deal Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Package className="w-4 h-4 mr-2" />
                  DEAL INFORMATION
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Title</p>
                    <p className="font-medium text-lg">{selectedDeal.title}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm">{selectedDeal.description}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Restaurant</p>
                    <p className="font-medium">
                      {selectedDeal.restaurant?.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Discount</p>
                    <p className="font-medium">
                      {selectedDeal.discountValue}% off
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Validity Period
                    </p>
                    <p className="text-sm">
                      {new Date(selectedDeal.startDate).toLocaleDateString()} -{" "}
                      {new Date(selectedDeal.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Time Window</p>
                    <p className="text-sm">
                      {selectedDeal.startTime} - {selectedDeal.endTime}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={selectedDeal.isActive ? "default" : "secondary"}
                    >
                      {selectedDeal.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Featured</p>
                    <Badge
                      variant={selectedDeal.isFeatured ? "default" : "outline"}
                    >
                      {selectedDeal.isFeatured ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {selectedDeal.totalUsesLimit && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Total Uses Limit
                      </p>
                      <p className="text-sm">
                        {selectedDeal.currentUses} /{" "}
                        {selectedDeal.totalUsesLimit}
                      </p>
                    </div>
                  )}
                  {selectedDeal.perCustomerLimit && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Per Customer Limit
                      </p>
                      <p className="text-sm">{selectedDeal.perCustomerLimit}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              {dealStats && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    PERFORMANCE METRICS
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {dealStats.views || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Views
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {dealStats.claims || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total Claims
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          {dealStats.views > 0
                            ? (
                                (dealStats.claims / dealStats.views) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Conversion Rate
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {dealStats.averageRating > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium">Average Rating</p>
                        <Badge variant="outline">
                          {dealStats.averageRating.toFixed(1)} / 5.0
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Based on {dealStats.totalFeedback} reviews
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center text-sm text-muted-foreground">
                  <Settings className="w-4 h-4 mr-2" />
                  QUICK ACTIONS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Extend Deal Duration
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={extendDays}
                        onChange={(e) =>
                          setExtendDays(parseInt(e.target.value) || 1)
                        }
                        className="w-20 px-2 py-1 border rounded text-sm"
                        placeholder="Days"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          extendDeal.mutate({
                            dealId: selectedDeal.id,
                            days: extendDays,
                          })
                        }
                        disabled={extendDeal.isPending}
                      >
                        Extend by {extendDays} days
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Deal Actions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDealDetailsOpen(false);
                          window.location.href = `/deal-edit/${selectedDeal.id}`;
                        }}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Edit Deal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          cloneDeal.mutate(selectedDeal.id);
                          setDealDetailsOpen(false);
                        }}
                        disabled={cloneDeal.isPending}
                      >
                        <Package className="w-4 h-4 mr-1" />
                        Clone
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
                <h3 className="font-semibold mb-2 text-destructive flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete this deal. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you absolutely sure? This will permanently delete the deal and all associated data.",
                      )
                    ) {
                      deleteDeal.mutate(selectedDeal.id);
                    }
                  }}
                  disabled={deleteDeal.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Delete Deal Permanently
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
}
