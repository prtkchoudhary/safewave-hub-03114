import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Shield, Play, Square, Share2, Clock, Copy, MessageSquare } from "lucide-react";
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
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const shareIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const shareIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentLocationRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (shareIntervalRef.current) {
        clearInterval(shareIntervalRef.current);
      }
    };
  }, []);

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

  const shareLocation = async (lat: number, lng: number, accuracy?: number) => {
    try {
      // If this is the first share, create a new record; otherwise update existing
      if (!shareIdRef.current) {
        const { data, error: dbError } = await supabase
          .from('location_shares')
          .insert({
            user_id: user?.id,
            latitude: lat,
            longitude: lng,
            accuracy: accuracy || 10,
            expires_at: new Date(Date.now() + duration * 60 * 1000).toISOString(),
            is_active: true
          })
          .select('id, share_token')
          .single();

        if (dbError) {
          console.error('Error saving location:', dbError);
          return;
        }

        if (data) {
          shareIdRef.current = data.id;
          setShareToken(data.share_token);
          const url = `${window.location.origin}/track/${data.share_token}`;
          setShareUrl(url);
        }
      } else {
        // Update existing location
        const { error: updateError } = await supabase
          .from('location_shares')
          .update({
            latitude: lat,
            longitude: lng,
            accuracy: accuracy || 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', shareIdRef.current);

        if (updateError) {
          console.error('Error updating location:', updateError);
        }
      }

      // Send Twilio SMS via edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await supabase.functions.invoke('emergency-notifications', {
          body: {
            type: 'sos', // We can reuse SOS type for location sharing
            user_id: session.user.id,
            location: {
              latitude: lat,
              longitude: lng
            },
            message: "Live location update - I'm sharing my location with you"
          }
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        console.log('Location SMS sent successfully');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      toast({
        title: "Warning",
        description: "Could not send automatic SMS. Location is still being tracked.",
        variant: "destructive",
      });
    }
  };

  const startSharing = () => {
    if (duration < 5 || duration > 240) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a duration between 5-240 minutes",
        variant: "destructive",
      });
      return;
    }

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

    // Get initial location with high accuracy
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        shareLocation(latitude, longitude, accuracy).catch(err => {
          console.error("Error sharing location:", err);
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location Error",
          description: "Could not get your current location. Make sure location services are enabled.",
          variant: "destructive",
        });
        setIsSharing(false);
      },
      {
        timeout: 15000,
        enableHighAccuracy: true,
        maximumAge: 0
      }
    );

    // Watch position with high accuracy for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        // Only update if accuracy is good (< 50 meters)
        if (accuracy < 50) {
          shareLocation(latitude, longitude, accuracy).catch(err => {
            console.error("Error updating location:", err);
          });
        }
      },
      (error) => {
        console.error("Error watching location:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000, // Accept cached position up to 5 seconds old
        timeout: 10000,
      }
    );

    toast({
      title: "Location Sharing Started",
      description: `Sharing location for ${duration} minutes. Share link will appear shortly.`,
    });
  };

  const stopSharing = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (shareIntervalRef.current) {
      clearInterval(shareIntervalRef.current);
      shareIntervalRef.current = null;
    }

    // Update location shares to inactive in database
    try {
      if (shareIdRef.current) {
        const { error } = await supabase
          .from('location_shares')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', shareIdRef.current);

        if (error) {
          console.error('Error updating location shares:', error);
        }
      }
    } catch (error) {
      console.error('Database error:', error);
    }

    setIsSharing(false);
    setTimeLeft(0);
    setShareToken(null);
    setShareUrl(null);
    shareIdRef.current = null;

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

      <main className="pt-20 px-4 md:pt-32 lg:pt-20 lg:pl-60">
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
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setDuration(0);
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 5 && numValue <= 240) {
                            setDuration(numValue);
                          }
                        }
                      }}
                      placeholder="30"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter duration between 5-240 minutes
                    </p>
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

                  {/* Share Link Section */}
                  {shareUrl && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Shareable Link</Label>
                        <div className="flex gap-2">
                          <Input
                            value={shareUrl}
                            readOnly
                            className="font-mono text-xs bg-background"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              toast({
                                title: "Copied!",
                                description: "Link copied to clipboard",
                              });
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                          onClick={() => {
                            const message = encodeURIComponent(
                              `🔴 Live Location Sharing Active\n\nI'm sharing my live location with you for safety purposes.\n\nTrack me here: ${shareUrl}\n\nUpdates automatically every 2 minutes.`
                            );
                            window.open(`https://wa.me/?text=${message}`, '_blank');
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const message = encodeURIComponent(
                              `🔴 Live Location: ${shareUrl}`
                            );
                            window.location.href = `sms:?body=${message}`;
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          SMS
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Recipients can track your location in real-time without logging in
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        if (shareUrl) {
                          navigator.clipboard.writeText(shareUrl);
                          toast({
                            title: "Link Copied!",
                            description: "Share link copied to clipboard",
                          });
                        }
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={!shareUrl}
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Copy Link
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
