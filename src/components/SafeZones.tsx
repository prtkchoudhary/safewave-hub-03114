import { useState } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type SafePlace = {
  name: string;
  type: string;
  distance: string;
};

const SafeZones = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const { toast } = useToast();

  const findNearbyPlaces = () => {
    setIsLocating(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simulate nearby safe places (will be replaced with actual API)
          const mockPlaces: SafePlace[] = [
            { name: "Central Police Station", type: "Police Station", distance: "0.5 km" },
            { name: "City Hospital", type: "Hospital", distance: "0.8 km" },
            { name: "Women's Safety Center", type: "Safety Center", distance: "1.2 km" },
            { name: "North Police Post", type: "Police Post", distance: "1.5 km" },
          ];

          setSafePlaces(mockPlaces);
          toast({
            title: "Safe Places Found",
            description: `Found ${mockPlaces.length} safe places nearby`,
          });
          setIsLocating(false);
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enable location services.",
            variant: "destructive",
          });
          setIsLocating(false);
        }
      );
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-foreground">Safe Zones Nearby</h2>
          <p className="text-muted-foreground">Find police stations and safe places around you</p>
        </div>
        <Button
          onClick={findNearbyPlaces}
          disabled={isLocating}
          className="bg-primary hover:bg-primary-glow text-primary-foreground"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <Navigation className="w-5 h-5 mr-2" />
              Find Nearby
            </>
          )}
        </Button>
      </div>

      {safePlaces.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border border-dashed">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">No Places Found Yet</h3>
          <p className="text-muted-foreground">Click "Find Nearby" to locate safe places around you</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {safePlaces.map((place, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 bg-card border-border">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-card-foreground">{place.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{place.type}</p>
                    <p className="text-sm font-medium text-primary">{place.distance} away</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => window.open(`https://www.google.com/maps/search/${place.name}`, "_blank")}
                >
                  Directions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default SafeZones;
