import { Phone, MapPin, AlertCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

type QuickActionsProps = {
  onContactsClick: () => void;
};

const QuickActions = ({ onContactsClick }: QuickActionsProps) => {
  const actions = [
    {
      icon: Phone,
      label: "Emergency Helplines",
      subtitle: "100 • 1091",
      onClick: () => window.location.href = "tel:100",
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
      onClick: () => {},
      color: "from-primary/20 to-primary/10",
    },
    {
      icon: AlertCircle,
      label: "Safety Tips",
      subtitle: "Stay informed",
      onClick: () => {},
      color: "from-muted/40 to-muted/20",
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