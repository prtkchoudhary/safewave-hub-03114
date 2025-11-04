import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const SosButton = () => {
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const handleSOS = async () => {
    setIsActivating(true);

    try {
      // Get user's location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            
            toast({
              title: "SOS Alert Activated",
              description: `Your location has been captured. In a real scenario, this would be sent to your emergency contacts.`,
            });

            console.log("SOS Location:", locationUrl);
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
      <div className="absolute inset-0 bg-accent rounded-full blur-xl opacity-50 animate-pulse"></div>
      <Button
        onClick={handleSOS}
        disabled={isActivating}
        size="lg"
        className="relative bg-gradient-to-r from-accent to-accent-glow hover:shadow-accent text-accent-foreground font-bold text-lg px-8 py-6 rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isActivating ? (
          <>
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
            Activating SOS...
          </>
        ) : (
          <>
            <AlertTriangle className="w-6 h-6 mr-2" />
            Emergency SOS
          </>
        )}
      </Button>
    </div>
  );
};

export default SosButton;
