import { useState } from "react";
import { AlertTriangle, Loader2, MapPin } from "lucide-react";
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

const SosButton = () => {
  const [isActivating, setIsActivating] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<{latitude: number, longitude: number, locationUrl: string, message: string} | null>(null);
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
            // @ts-ignore - Database types will regenerate after migration deploys
            const { data: contacts, error } = await supabase
              .from('emergency_contacts')
              .select('*')
              .order('is_primary', { ascending: false });

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
                description: `Tap each contact to send alert via WhatsApp.`,
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

  const sendWhatsApp = (contact: any) => {
    if (locationData) {
      const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(locationData.message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <>
      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-accent">🚨 Send SOS Alert</DialogTitle>
            <DialogDescription>
              Tap each contact to send emergency alert via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {emergencyContacts.map((contact: any) => (
              <Button
                key={contact.id}
                onClick={() => sendWhatsApp(contact)}
                className="w-full justify-start text-left h-auto py-3"
                variant="outline"
              >
                <div className="flex flex-col items-start">
                  <div className="font-semibold">{contact.name}</div>
                  <div className="text-sm text-muted-foreground">{contact.phone}</div>
                  <div className="text-xs text-muted-foreground">{contact.relationship}</div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
};

export default SosButton;