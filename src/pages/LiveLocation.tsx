import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Shield, Play, Square, Share2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase-temp";
import BottomNav from "@/components/BottomNav";

const LiveLocation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);
  const [duration, setDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const shareIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSharing && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isSharing) {
      stopSharing();
    }
    return () => clearInterval(interval);
  }, [isSharing, timeLeft]);

  const shareLocation = async (lat: number, lng: number) => {
    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user?.id);

    if (contacts && contacts.length > 0) {
      const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
      const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      const message = encodeURIComponent(
        `📍 LIVE LOCATION UPDATE\n\nI'm sharing my location with you.\n\nCurrent Location:\n${mapsLink}\n\nLat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}\n\nTime: ${new Date().toLocaleString()}`
      );
      
      // Open WhatsApp in new tab
      window.open(`https://wa.me/${primaryContact.phone}?text=${message}`, '_blank');
    }
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    setTimeLeft(duration * 60);

    // Get initial location and share it
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        shareLocation(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location Error",
          description: "Could not get your current location",
          variant: "destructive",
        });
      }
    );

    // Watch position and update every minute
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error watching location:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      }
    );

    // Share location every 2 minutes
    shareIntervalRef.current = setInterval(() => {
      if (currentLocation) {
        shareLocation(currentLocation.lat, currentLocation.lng);
      }
    }, 120000); // 2 minutes

    toast({
      title: "Location Sharing Started",
      description: `Sharing location for ${duration} minutes`,
    });
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (shareIntervalRef.current) {
      clearInterval(shareIntervalRef.current);
      shareIntervalRef.current = null;
    }

    setIsSharing(false);
    setTimeLeft(0);
    
    toast({
      title: "Sharing Stopped",
      description: "Location sharing has ended",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary pb-20">
      <header className="fixed top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-xl">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Live Location
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Share Live Location
              </CardTitle>
              <CardDescription>
                Share your real-time location with emergency contacts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isSharing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="240"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={startSharing} 
                    className="w-full"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Sharing Location
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4 animate-pulse">
                      <MapPin className="w-12 h-12 text-primary" />
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-muted-foreground mb-2">
                      Location sharing active
                    </p>
                    {currentLocation && (
                      <div className="text-xs text-muted-foreground">
                        <p>Lat: {currentLocation.lat.toFixed(6)}</p>
                        <p>Lng: {currentLocation.lng.toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => currentLocation && shareLocation(currentLocation.lat, currentLocation.lng)}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Share Now
                    </Button>
                    <Button 
                      onClick={stopSharing}
                      variant="destructive"
                      size="lg"
                      className="w-full"
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Location is shared immediately and updated every 2 minutes</span>
              </p>
              <p className="flex items-start gap-2">
                <Share2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Emergency contacts receive Google Maps links via WhatsApp</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>High-accuracy GPS tracking for precise location</span>
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Note: Keep your phone unlocked and this tab active for best results
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default LiveLocation;
