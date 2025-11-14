import { Home, Shield, FileText, MapPin, Phone, Timer } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNav = () => {
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Timer, label: "Timer", path: "/safety-timer" },
    { icon: MapPin, label: "Location", path: "/live-location" },
    { icon: FileText, label: "Report", path: "/incident-report" },
    { icon: Phone, label: "Call", path: "/fake-call" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation - Tactical HUD */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/40 backdrop-blur-xl border-t border-primary/20 md:hidden">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {/* Glow Effect on Active */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 group ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
                  )}
                  <div className={`relative p-2 rounded-lg transition-all ${
                    isActive ? 'bg-primary/10' : 'group-hover:bg-primary/5'
                  }`}>
                    <item.icon className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`} />
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                    isActive ? 'text-primary' : ''
                  }`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop Side Navigation - Command Panel */}
      <nav className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl blur-xl" />
          <div className="relative bg-card/40 backdrop-blur-xl border border-primary/20 rounded-2xl p-4 shadow-2xl">
            {/* Panel Header */}
            <div className="mb-4 pb-3 border-b border-primary/20">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest font-bold">Navigation</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 min-w-[220px] group overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/60 border border-transparent hover:border-primary/20"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                      )}
                      <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform ${
                        isActive ? 'text-primary' : 'group-hover:scale-110'
                      }`} />
                      <span className="font-semibold uppercase tracking-wide text-sm">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Tablet Top Navigation */}
      <nav className="hidden md:block lg:hidden fixed top-20 left-0 right-0 z-40 bg-card/40 backdrop-blur-xl border-b border-primary/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 border ${
                    isActive
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/60 border-transparent hover:border-primary/20"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wide">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
