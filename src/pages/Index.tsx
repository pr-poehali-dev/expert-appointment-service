import { useState } from "react";
import Navigation from "@/components/Navigation";
import HomePage from "@/pages/HomePage";
import SchedulePage from "@/pages/SchedulePage";
import BookingPage from "@/pages/BookingPage";
import NotificationsPage from "@/pages/NotificationsPage";

type Page = "home" | "schedule" | "booking" | "notifications";

export default function Index() {
  const [page, setPage] = useState<Page>("home");

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage />;
      case "schedule": return <SchedulePage />;
      case "booking": return <BookingPage />;
      case "notifications": return <NotificationsPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background font-golos">
      <Navigation current={page} onChange={setPage} notifCount={2} />
      <main key={page} className="animate-fade-in">
        {renderPage()}
      </main>

      <footer className="border-t border-border mt-16 py-8 px-6">
        <div className="container max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">© 2026 МедиКлиник. Все права защищены.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button className="hover:text-primary transition-colors">Политика конфиденциальности</button>
            <button className="hover:text-primary transition-colors">Контакты</button>
            <button className="hover:text-primary transition-colors">Поддержка</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
