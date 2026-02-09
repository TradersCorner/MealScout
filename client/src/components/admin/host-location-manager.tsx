import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type HostLocationManagerProps = {
  canEdit?: boolean;
};

const normalize = (value?: string | null) => (value ?? "").trim();

const includesLoose = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle.toLowerCase());

const buildGeocodeQuery = (host: any) => {
  const address = normalize(host?.address);
  const city = normalize(host?.city);
  const state = normalize(host?.state);
  if (!address) return "";

  const parts: string[] = [address];
  if (city && !includesLoose(address, city)) parts.push(city);
  if (state && !includesLoose(address, state)) parts.push(state);
  parts.push("USA");
  return parts.join(", ");
};

export default function HostLocationManager({
  canEdit = true,
}: HostLocationManagerProps) {
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
    const query = buildGeocodeQuery(host);
    if (!query) {
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
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&countrycodes=us&q=${encodeURIComponent(
          query,
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
      {!canEdit && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          View-only access. Ask an admin to update coordinates.
        </div>
      )}
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
                <p className="text-sm text-muted-foreground">
                  {normalize(host.address)}
                  {host.city &&
                  !includesLoose(normalize(host.address), host.city)
                    ? `, ${host.city}`
                    : ""}
                  {host.state &&
                  !includesLoose(normalize(host.address), host.state)
                    ? `, ${host.state}`
                    : ""}
                </p>
                {host.latitude && host.longitude && (
                  <p className="text-xs text-[color:var(--status-success)] mt-1">
                    📍 {host.latitude}, {host.longitude}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => geocodeHost(host)}
                disabled={geocoding || !canEdit}
              >
                {geocoding ? "..." : "Geocode"}
              </Button>
            </div>

            {editingHostId === host.id && canEdit && (
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

