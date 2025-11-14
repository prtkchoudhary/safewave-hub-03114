import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Loader2, MapPin, MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-temp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

const SosButton = () => {
  const [isActivating, setIsActivating] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<{latitude: number, longitude: number, locationUrl: string, message: string} | null>(null);
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showCountdown && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && showCountdown) {
      // Auto-proceed with SOS after countdown
      proceedWithSOS();
    }
    return () => clearInterval(interval);
  }, [showCountdown, countdown]);

  const handleSOS = async () => {
    // Start countdown confirmation
    setShowCountdown(true);
    setCountdown(5);
    
    toast({
      title: "SOS Countdown Started",
      description: "Emergency alert will send in 5 seconds. Tap cancel to stop.",
      variant: "destructive",
    });
  };

  const cancelSOS = () => {
    setShowCountdown(false);
    setCountdown(5);
    setIsActivating(false);
    
    toast({
      title: "SOS Cancelled",
      description: "Emergency alert has been cancelled.",
    });
  };

  const proceedWithSOS = async () => {
    setShowCountdown(false);
    setIsActivating(true);

    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // Check if component is still mounted
            if (!isMountedRef.current) return;

            const { latitude, longitude } = position.coords;
            const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

            // Fetch emergency contacts
            // @ts-ignore - Database types will regenerate after migration deploys
            const { data: contacts, error } = await supabase
              .from('emergency_contacts')
              .select('*')
              .order('is_primary', { ascending: false });

            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;

            if (error) {
              console.error('Error fetching contacts:', error);
              toast({
                title: "Error",
                description: "Failed to fetch emergency contacts.",
                variant: "destructive",
              });
              setIsActivating(false);
              return;
            }

            if (contacts && contacts.length > 0) {
              // Create emergency message
              const message = `🚨 EMERGENCY SOS ALERT 🚨\n\nI need help! My current location:\n${locationUrl}\n\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nTime: ${new Date().toLocaleString()}`;

              // Store data and show dialog with contacts
              setEmergencyContacts(contacts);
              setLocationData({ latitude, longitude, locationUrl, message });
              setShowContactsDialog(true);

              toast({
                title: "SOS Alert Ready!",
                description: `Choose WhatsApp or SMS to send alerts.`,
              });
            } else {
              toast({
                title: "No Emergency Contacts",
                description: "Please add emergency contacts first.",
                variant: "destructive",
              });
            }

            setIsActivating(false);
          },
          (error) => {
            // Check if component is still mounted
            if (!isMountedRef.current) return;

            toast({
              title: "Location Error",
              description: "Unable to get your location. Please enable location services.",
              variant: "destructive",
            });
            setIsActivating(false);
          },
          {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 0
          }
        );
      } else {
        toast({
          title: "Not Supported",
          description: "Geolocation is not supported by your browser.",
          variant: "destructive",
        });
        setIsActivating(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsActivating(false);
    }
  };

  const sendWhatsApp = (contact: any) => {
    if (locationData) {
      const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(locationData.message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const sendTwilioSMS = async () => {
    if (!locationData) return;
    
    setIsActivating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "Please log in to send SMS alerts.",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('emergency-notifications', {
        body: {
          type: 'sos',
          user_id: session.user.id,
          location: {
            latitude: locationData.latitude,
            longitude: locationData.longitude
          },
          message: "Emergency SOS Alert - I need immediate help!"
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const notificationsSent = response.data?.notifications_sent ?? 0;

      toast({
        title: "✅ SOS Alerts Sent!",
        description: `Emergency SMS sent to ${notificationsSent} contact${notificationsSent !== 1 ? 's' : ''}.`,
      });

      setShowContactsDialog(false);
    } catch (error) {
      console.error('Error sending Twilio SMS:', error);
      toast({
        title: "SMS Error",
        description: "Failed to send SMS alerts. Please try manual methods.",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const sendSMS = (contact: any) => {
    if (locationData) {
      const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
      const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(locationData.message)}`;
      window.location.href = smsUrl;
    }
  };

  return (
    <>
      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-accent/30">
          <DialogHeader>
            <DialogTitle className="text-accent font-bold uppercase tracking-wider text-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Emergency Dispatch
              </div>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select alert transmission method
            </DialogDescription>
          </DialogHeader>
          
          {/* Automatic SMS Button */}
          <div className="mb-4">
            <Button
              onClick={sendTwilioSMS}
              disabled={isActivating}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
              size="lg"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending SMS Alerts...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Automatic SMS to All Contacts
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Sends professional emergency SMS via our secure service
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or send manually
              </span>
            </div>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            {emergencyContacts.map((contact: any) => (
              <Card key={contact.id} className="p-4 bg-card border-border">
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-foreground">{contact.name}</div>
                    <div className="text-sm text-muted-foreground">{contact.phone}</div>
                    {contact.relationship && (
                      <div className="text-xs text-muted-foreground">{contact.relationship}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => sendWhatsApp(contact)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      onClick={() => sendSMS(contact)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      SMS
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative flex items-center justify-center">
        {/* Outer Ripple Rings */}
        <div className={`absolute inset-0 ${showCountdown ? '' : 'animate-sentinel-ripple'}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-accent/30" />
        </div>
        <div className={`absolute inset-0 ${showCountdown ? '' : 'animate-sentinel-ripple'} [animation-delay:0.5s]`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-accent/20" />
        </div>

        {/* Glow Effect */}
        <div className={`absolute -inset-8 rounded-full blur-3xl transition-all duration-300 ${
          showCountdown
            ? 'bg-destructive/40 animate-sentinel-beacon'
            : 'bg-accent/30 animate-sentinel-pulse'
        }`} />

        {/* Main Button */}
        <div className="relative">
          {/* Hexagonal Background */}
          <div className={`absolute inset-0 hexagon-clip transition-all duration-300 ${
            showCountdown
              ? 'bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80 scale-105'
              : 'bg-gradient-to-br from-accent via-accent/95 to-accent/90'
          }`} />

          <Button
            onClick={showCountdown ? cancelSOS : handleSOS}
            disabled={isActivating}
            size="lg"
            className={`relative w-44 h-44 rounded-full font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-4 overflow-hidden group ${
              showCountdown
                ? 'bg-gradient-to-br from-destructive to-destructive/90 border-destructive/50 hover:scale-105 shadow-[0_0_60px_rgba(239,68,68,0.6)]'
                : 'bg-gradient-to-br from-accent to-accent/90 border-accent/40 hover:scale-110 shadow-[0_0_40px_rgba(255,107,53,0.5)]'
            }`}
          >
            {/* Inner Glow */}
            <div className={`absolute inset-0 rounded-full transition-opacity ${
              showCountdown ? 'bg-destructive/20' : 'bg-accent/20'
            } group-hover:opacity-0`} />

            {/* Content */}
            <div className="relative flex flex-col items-center gap-2 text-white">
              {isActivating ? (
                <>
                  <Loader2 className="w-14 h-14 animate-spin" />
                  <span className="text-xs uppercase tracking-widest font-bold">Activating</span>
                </>
              ) : showCountdown ? (
                <>
                  <div className="text-6xl font-black tabular-nums leading-none">{countdown}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <X className="w-5 h-5" />
                    <span className="text-xs uppercase tracking-widest font-bold">Cancel</span>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 drop-shadow-lg" />
                  <div className="text-3xl font-black tracking-widest">SOS</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-widest font-semibold">Emergency</span>
                  </div>
                </>
              )}
            </div>

            {/* Animated Border Pulse */}
            <div className={`absolute inset-0 rounded-full border-2 ${
              showCountdown ? 'border-white/40' : 'border-white/30'
            } ${showCountdown ? 'animate-ping' : ''}`} />
          </Button>
        </div>
      </div>
    </>
  );
};

export default SosButton;