import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import BookingPage from "@/pages/BookingPage";
import Icon from "@/components/ui/icon";

export default function ClientPortal() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<"booking" | "profile">("booking");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 nav-glow" style={{ background: "hsla(220,20%,7%,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Icon name="Stethoscope" size={18} className="text-primary-foreground" />
            </div>
            <span className="font-cormorant font-semibold text-lg hidden sm:block">МедиКлиник</span>
          </div>

          <nav className="flex gap-1">
            {[
              { v: "booking", label: "Записаться", icon: "CalendarPlus" },
              { v: "profile", label: "Профиль", icon: "User" },
            ].map(item => (
              <button key={item.v} onClick={() => setView(item.v as typeof view)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${view === item.v ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <Icon name={item.icon as "User"} size={15} />
                <span className="hidden sm:block">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-none">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Пациент</p>
            </div>
            <button onClick={logout}
              className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
              title="Выйти">
              <Icon name="LogOut" size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="animate-fade-in">
        {view === "booking" && <BookingPage />}
        {view === "profile" && (
          <div className="container max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
              <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Личный кабинет</p>
              <h1 className="text-3xl font-cormorant font-semibold">Мой профиль</h1>
            </div>
            <div className="gradient-card border border-border rounded-2xl p-6 max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground">
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user?.full_name}</p>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                {user?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Phone" size={14} className="text-primary" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="ShieldCheck" size={14} className="text-primary" />
                  <span className="text-muted-foreground">Роль:</span>
                  <span className="status-badge status-available text-xs">Пациент</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
