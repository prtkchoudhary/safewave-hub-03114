import { Phone, MapPin, AlertCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

type QuickActionsProps = {
  onContactsClick: () => void;
};

const QuickActions = ({ onContactsClick }: QuickActionsProps) => {
  const openEmergencyHelplines = () => {
    const helplines = [
      { name: "Police", number: "100" },
      { name: "Women Helpline", number: "1091" },
      { name: "Child Helpline", number: "1098" },
      { name: "Ambulance", number: "102" }
    ];
    
    const message = helplines.map(h => `${h.name}: ${h.number}`).join('\n');
    const choice = prompt(message + "\n\nEnter the number to dial (100, 1091, 1098, 102):");
    
    if (choice && helplines.some(h => h.number === choice)) {
      window.location.href = `tel:${choice}`;
    }
  };

  const openSafeZones = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const searchQuery = `(police+station+OR+hospital)+near+${latitude},${longitude}`;
          window.open(`https://www.google.com/maps/search/${searchQuery}`, '_blank');
        },
        () => {
          // Fallback if location not available
          window.open('https://www.google.com/maps/search/police+station+OR+hospital', '_blank');
        }
      );
    } else {
      window.open('https://www.google.com/maps/search/police+station+OR+hospital', '_blank');
    }
  };

  const actions = [
    {
      icon: Phone,
      label: "Emergency Helplines",
      subtitle: "100 • 1091 • 1098",
      onClick: openEmergencyHelplines,
      color: "from-accent/20 to-accent/10",
    },
    {
      icon: Users,
      label: "My Contacts",
      subtitle: "Manage contacts",
      onClick: onContactsClick,
      color: "from-primary/20 to-primary/10",
    },
    {
      icon: MapPin,
      label: "Find Safe Zones",
      subtitle: "Police • Hospital",
      onClick: openSafeZones,
      color: "from-primary/20 to-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Card
            key={index}
            onClick={action.onClick}
            className="p-4 bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-95"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm text-foreground mb-1">{action.label}</h3>
            <p className="text-xs text-muted-foreground">{action.subtitle}</p>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickActions;