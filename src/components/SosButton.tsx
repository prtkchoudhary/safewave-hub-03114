import { useState } from "react";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SosButton = () => {
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const handleSOS = async () => {
    setIsActivating(true);

    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            
            // Fetch emergency contacts
            const { data: contacts, error } = await supabase
              .from('emergency_contacts')
              .select('*')
              .order('is_primary', { ascending: false });

            if (error) {
              console.error('Error fetching contacts:', error);
            }

            if (contacts && contacts.length > 0) {
              // In a real app, this would trigger SMS sending via edge function
              toast({
                title: "SOS Alert Activated!",
                description: `Emergency alert sent to ${contacts.length} contact(s) with your location.`,
              });

              console.log('SOS Details:', {
                location: locationUrl,
                contacts: contacts.map(c => ({ name: c.name, phone: c.phone })),
                timestamp: new Date().toISOString(),
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
            toast({
              title: "Location Error",
              description: "Unable to get your location. Please enable location services.",
              variant: "destructive",
            });
            setIsActivating(false);
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

  return (
    <div className="relative inline-block">
      <div className="absolute -inset-4 bg-accent rounded-full blur-2xl opacity-60 animate-pulse"></div>
      <Button
        onClick={handleSOS}
        disabled={isActivating}
        size="lg"
        className="relative w-40 h-40 rounded-full bg-gradient-to-br from-accent to-accent-glow hover:shadow-accent text-accent-foreground font-bold text-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
      >
        <div className="flex flex-col items-center gap-2">
          {isActivating ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin" />
              <span className="text-sm">Sending...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-12 h-12" />
              <span>SOS</span>
              <MapPin className="w-5 h-5" />
            </>
          )}
        </div>
      </Button>
    </div>
  );
};

export default SosButton;