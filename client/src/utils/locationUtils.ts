// Shared location utility functions

export async function getReverseGeocodedLocationName(
  latitude: number,
  longitude: number,
  onLocationNameUpdate: (name: string) => void
): Promise<void> {
  // Don't show coordinates - try to get city name immediately
  try {
    console.log("🌍 Attempting reverse geocoding for:", {
      latitude,
      longitude,
    });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&extratags=1`,
      {
        headers: {
          "User-Agent": "MealScout/1.0",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data && data.address) {
        const address = data.address;

        // Build location name prioritizing actual cities/towns over administrative divisions
        let locationName = "";

        // Try multiple city-level fields first
        if (address.city) {
          locationName = address.city;
        } else if (address.town) {
          locationName = address.town;
        } else if (address.village) {
          locationName = address.village;
        } else if (address.suburb) {
          locationName = address.suburb;
        } else if (address.neighbourhood) {
          locationName = address.neighbourhood;
        } else if (address.hamlet) {
          locationName = address.hamlet;
        }

        // If no city-level name found, try extracting from display_name
        if (!locationName && data.display_name) {
          const parts = data.display_name
            .split(",")
            .map((p: string) => p.trim());
          // Look for a recognizable city/town in the display name
          // Skip house numbers, roads, and administrative divisions
          for (const part of parts) {
            if (
              part &&
              !part.match(/^\d/) && // Skip house numbers
              !part.includes("Lane") &&
              !part.includes("Road") &&
              !part.includes("Street") &&
              !part.includes("Parish") &&
              !part.includes("County") &&
              !part.includes("Louisiana") &&
              !part.includes("United States") &&
              !part.includes("US-LA") &&
              part.length > 2
            ) {
              locationName = part;
              break;
            }
          }
        }

        // If still no city found, try ZIP code lookup for nearest city
        if (!locationName && address.postcode) {
          try {
            console.log(
              `🏘️ No city found, trying ZIP code lookup for ${address.postcode}`
            );
            const zipResponse = await fetch(
              `https://api.zippopotam.us/us/${address.postcode}`
            );
            if (zipResponse.ok) {
              const zipData = await zipResponse.json();
              if (zipData.places && zipData.places.length > 0) {
                locationName = zipData.places[0]["place name"];
                console.log(`✅ Found city from ZIP code: ${locationName}`);
              }
            }
          } catch (zipError) {
            console.warn("ZIP code lookup failed:", zipError);
          }
        }

        // Last resort: try administrative areas but exclude "Parish"
        if (!locationName) {
          if (address.county && !address.county.includes("Parish")) {
            locationName = address.county;
          }
        }

        // Add state if we have a city/town and it's not already included
        if (
          locationName &&
          address.state &&
          !locationName.includes(address.state)
        ) {
          locationName += `, ${address.state}`;
        }

        if (locationName) {
          console.log("✅ Reverse geocoding successful:", locationName);
          onLocationNameUpdate(locationName);
          return;
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Reverse geocoding failed:", error);
  }

  // Fallback: show generic location name instead of coordinates
  onLocationNameUpdate("Location");
  console.log("📍 Using generic location fallback (no coordinates shown)");
}
