import { Home, Shield, FileText, MapPin, Phone } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: MapPin, label: "Location", path: "/live-location" },
    { icon: FileText, label: "Report", path: "/incident-report" },
    { icon: Phone, label: "Call", path: "/fake-call" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
