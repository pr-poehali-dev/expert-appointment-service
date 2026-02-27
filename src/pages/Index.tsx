import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/AuthPage";
import ClientPortal from "@/pages/ClientPortal";
import AdminPanel from "@/pages/AdminPanel";
import HomePage from "@/pages/HomePage";
import Icon from "@/components/ui/icon";

export default function Index() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Icon name="Stethoscope" size={28} className="text-primary-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (user?.role === "doctor") return <AdminPanel />;
  if (user) return <ClientPortal />;
  if (showAuth) return <AuthPage />;
  return <HomePage onBook={() => setShowAuth(true)} />;
}