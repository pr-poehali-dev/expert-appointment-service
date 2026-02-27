import Icon from "@/components/ui/icon";

type Page = "home" | "schedule" | "booking" | "notifications";

interface NavigationProps {
  current: Page;
  onChange: (page: Page) => void;
  notifCount?: number;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "schedule", label: "Расписание", icon: "CalendarDays" },
  { id: "booking", label: "Запись", icon: "CalendarPlus" },
  { id: "notifications", label: "Уведомления", icon: "Bell" },
];

export default function Navigation({ current, onChange, notifCount = 0 }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 nav-glow" style={{ background: 'hsla(220, 20%, 7%, 0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="container max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => onChange("home")} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <Icon name="Stethoscope" size={18} className="text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="font-cormorant font-semibold text-lg leading-none block">МедиКлиник</span>
              <span className="text-muted-foreground text-xs">Запись к специалистам</span>
            </div>
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = current === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChange(item.id)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <Icon name={item.icon as "Home"} size={16} />
                  <span className="hidden md:block">{item.label}</span>
                  {item.id === "notifications" && notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full gradient-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow">
                      {notifCount}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl hover:bg-muted transition-colors flex items-center justify-center">
              <Icon name="Search" size={16} className="text-muted-foreground" />
            </button>
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
              <span className="text-primary-foreground text-xs font-bold">АД</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
