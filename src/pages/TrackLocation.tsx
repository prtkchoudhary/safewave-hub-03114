import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Shield, Clock, Navigation, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase-temp";

type LocationData = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  expires_at: string;
  is_active: boolean;
  updated_at: string;
  created_at: string;
};

const TrackLocation = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setError("No share token provided");
      setIsLoading(false);
      return;
    }

    fetchLocation();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`location-${shareToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'location_shares',
          filter: `share_token=eq.${shareToken}`,
        },
        (payload) => {
          setLocation(payload.new as LocationData);
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchLocation, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [shareToken]);

  const fetchLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('location_shares')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (!data) {
        setError("Location sharing has ended or the link is invalid");
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setError("This location share has expired");
        setIsLoading(false);
        return;
      }

      setLocation(data);
      setLastUpdated(new Date());
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching location:", err);
      setError("Unable to load location. The link may be invalid or expired.");
      setIsLoading(false);
    }
  };

  const formatTimeRemaining = () => {
    if (!location) return "";
    const expiresAt = new Date(location.expires_at);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff < 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const formatLastUpdate = () => {
    if (!lastUpdated) return "";
    const diff = new Date().getTime() - lastUpdated.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  const openInMaps = () => {
    if (!location) return;
    const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(mapsUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <MapPin className="w-12 h-12 text-primary animate-pulse" />
              <p className="text-muted-foreground">Loading location...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <h2 className="text-xl font-semibold">Unable to Track Location</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!location) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-xl">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Live Location Tracker
            </h1>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Map Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative">
            {/* Embedded Google Maps */}
            <iframe
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&center=${location.latitude},${location.longitude}&zoom=16&maptype=roadmap`}
              className="w-full"
            />
            {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
              <div className="absolute inset-0 bg-card/95 flex items-center justify-center">
                <div className="text-center p-6">
                  <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Location Available</h3>
                  <p className="text-muted-foreground mb-4">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                  <button
                    onClick={openInMaps}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Google Maps
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Location Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Latitude</p>
                <p className="font-mono text-lg">{location.latitude.toFixed(6)}°</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longitude</p>
                <p className="font-mono text-lg">{location.longitude.toFixed(6)}°</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="font-mono">± {location.accuracy?.toFixed(0) || 'N/A'} meters</p>
              </div>
              <button
                onClick={openInMaps}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                <Badge variant="outline" className="text-base">
                  {formatTimeRemaining()}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Last Updated</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm">{formatLastUpdate()}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Location updates automatically every 2 minutes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Notice */}
        <Card className="mt-6 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Safety Information</h4>
                <p className="text-sm text-muted-foreground">
                  This location is being shared for safety purposes. The share will automatically
                  expire after the designated time. Location updates are sent every 2 minutes with
                  high accuracy GPS positioning.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TrackLocation;
