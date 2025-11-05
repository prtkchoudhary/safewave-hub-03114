import { Phone, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

type QuickActionsProps = {
  onContactsClick: () => void;
};

const QuickActions = ({ onContactsClick }: QuickActionsProps) => {
  const [helplineDialogOpen, setHelplineDialogOpen] = useState(false);

  const helplines = [
    { name: "Police", number: "100", icon: "🚓" },
    { name: "Women Helpline", number: "1091", icon: "👩" },
    { name: "Child Helpline", number: "1098", icon: "👶" },
    { name: "Ambulance", number: "102", icon: "🚑" }
  ];

  const dialNumber = (number: string) => {
    window.location.href = `tel:${number}`;
    setHelplineDialogOpen(false);
  };

  const openSafeZones = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Search for police stations, hospitals, and fire stations within 5km radius
          const searchQuery = `police+station+hospital+fire+station+near+me`;
          const mapsUrl = `https://www.google.com/maps/search/${searchQuery}/@${latitude},${longitude},14z`;
          window.open(mapsUrl, '_blank');
        },
        (error) => {
          // Fallback - open generic search
          window.open('https://www.google.com/maps/search/police+station+hospital+near+me', '_blank');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      window.open('https://www.google.com/maps/search/police+station+hospital+near+me', '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* Featured Emergency Card */}
      <Dialog open={helplineDialogOpen} onOpenChange={setHelplineDialogOpen}>
        <DialogTrigger asChild>
          <Card className="p-6 bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-destructive/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Phone className="w-8 h-8 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground mb-1">Emergency Helplines</h3>
                <p className="text-sm text-muted-foreground">Tap to dial emergency services</p>
              </div>
            </div>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Emergency Services</DialogTitle>
            <DialogDescription>
              Choose a service to dial immediately
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {helplines.map((helpline) => (
              <Button
                key={helpline.number}
                onClick={() => dialNumber(helpline.number)}
                variant="outline"
                className="h-auto py-4 px-4 justify-start hover:bg-destructive/10 hover:border-destructive/50 transition-all group"
              >
                <span className="text-2xl mr-3 group-hover:scale-125 transition-transform">{helpline.icon}</span>
                <div className="text-left flex-1">
                  <div className="font-semibold text-base">{helpline.name}</div>
                  <div className="text-sm text-muted-foreground">{helpline.number}</div>
                </div>
                <Phone className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          onClick={onContactsClick}
          className="p-5 bg-gradient-to-br from-primary/10 to-background border-primary/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">My Contacts</h3>
          <p className="text-xs text-muted-foreground">Manage emergency contacts</p>
        </Card>

        <Card
          onClick={openSafeZones}
          className="p-5 bg-gradient-to-br from-accent/10 to-background border-accent/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MapPin className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Safe Zones</h3>
          <p className="text-xs text-muted-foreground">Find nearby help</p>
        </Card>
      </div>
    </div>
  );
};

export default QuickActions;