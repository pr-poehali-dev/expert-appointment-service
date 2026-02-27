import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, Appointment } from "@/lib/api";
import Icon from "@/components/ui/icon";

function getNextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { iso: d.toISOString().slice(0, 10), label: d.toLocaleDateString("ru", { day: "numeric", month: "short", weekday: "short" }) };
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  cancelled: "Отменён",
  completed: "Завершён",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "status-pending",
  confirmed: "status-available",
  cancelled: "status-busy",
  completed: "bg-muted/30 text-muted-foreground border-border",
};

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<"schedule" | "notifications" | "profile">("schedule");
  const [days] = useState(getNextDays(7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (view !== "schedule") return;
    setLoading(true);
    api.getAppointments(selectedDate).then(data => {
      const myAppointments = user?.specialist_id
        ? data.appointments.filter(a => a.specialist_id === user.specialist_id)
        : data.appointments;
      setAppointments(myAppointments);
      setLoading(false);
    });
  }, [selectedDate, view, user]);

  const changeStatus = async (id: number, status: string) => {
    setUpdating(id);
    await api.updateAppointmentStatus(id, status);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setUpdating(null);
  };

  const pending = appointments.filter(a => a.status === "pending").length;
  const confirmed = appointments.filter(a => a.status === "confirmed").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 nav-glow" style={{ background: "hsla(220,20%,7%,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Icon name="Stethoscope" size={18} className="text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-sm leading-none">МедиКлиник</p>
              <p className="text-xs text-primary mt-0.5">Панель врача</p>
            </div>
          </div>

          <nav className="flex gap-1">
            {[
              { v: "schedule", label: "Расписание", icon: "CalendarDays" },
              { v: "notifications", label: "Уведомления", icon: "Bell" },
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
              <p className="text-sm font-medium leading-none">{user?.specialist?.name ?? user?.full_name}</p>
              <p className="text-xs text-primary mt-0.5">{user?.specialist?.specialty ?? "Врач"}</p>
            </div>
            <button onClick={logout} title="Выйти"
              className="w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
              <Icon name="LogOut" size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 animate-fade-in">

        {/* SCHEDULE */}
        {view === "schedule" && (
          <>
            <div className="mb-6">
              <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Врач: {user?.specialist?.name ?? user?.full_name}</p>
              <h1 className="text-3xl font-cormorant font-semibold">Мои записи</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Всего на день", value: appointments.length, icon: "Calendar", color: "text-primary" },
                { label: "Ожидают", value: pending, icon: "Clock", color: "text-yellow-400" },
                { label: "Подтверждено", value: confirmed, icon: "CheckCircle", color: "text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="gradient-card border border-border rounded-2xl p-4">
                  <Icon name={s.icon as "Calendar"} size={18} className={`${s.color} mb-2`} />
                  <div className="text-2xl font-bold">{loading ? "—" : s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Date tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
              {days.map(d => (
                <button key={d.iso} onClick={() => setSelectedDate(d.iso)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${selectedDate === d.iso ? "gradient-primary text-primary-foreground shadow-md" : "gradient-card border border-border hover:border-primary/30"}`}>
                  {d.label}
                </button>
              ))}
            </div>

            {/* Appointments list */}
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Icon name="CalendarX" size={40} className="mx-auto mb-3 opacity-30" />
                <p>Записей на этот день нет</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(apt => (
                  <div key={apt.id}
                    className="gradient-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/20 transition-all">
                    <div className="gradient-primary text-primary-foreground text-center rounded-xl px-4 py-3 font-bold text-lg min-w-[70px]">
                      {apt.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{apt.patient}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Icon name="Phone" size={11} />{apt.phone}
                            </span>
                            {apt.comment && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[200px]">
                                <Icon name="MessageSquare" size={11} />{apt.comment}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`status-badge text-xs shrink-0 ${STATUS_STYLES[apt.status] ?? ""}`}>
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 shrink-0">
                      {apt.status === "pending" && (
                        <>
                          <button
                            onClick={() => changeStatus(apt.id, "confirmed")}
                            disabled={updating === apt.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50">
                            {updating === apt.id ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Check" size={13} />}
                            Подтвердить
                          </button>
                          <button
                            onClick={() => changeStatus(apt.id, "cancelled")}
                            disabled={updating === apt.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-destructive/10 text-red-400 border border-destructive/20 hover:bg-destructive/15 transition-all disabled:opacity-50">
                            <Icon name="X" size={13} />
                            Отклонить
                          </button>
                        </>
                      )}
                      {apt.status === "confirmed" && (
                        <button
                          onClick={() => changeStatus(apt.id, "completed")}
                          disabled={updating === apt.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-muted text-muted-foreground hover:text-foreground border border-border transition-all disabled:opacity-50">
                          <Icon name="CheckCheck" size={13} />
                          Завершить
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* NOTIFICATIONS */}
        {view === "notifications" && (
          <NotificationsView />
        )}

        {/* PROFILE */}
        {view === "profile" && (
          <>
            <div className="mb-6">
              <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Настройки</p>
              <h1 className="text-3xl font-cormorant font-semibold">Мой профиль</h1>
            </div>
            <div className="gradient-card border border-border rounded-2xl p-6 max-w-md">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {user?.specialist?.emoji ?? user?.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user?.specialist?.name ?? user?.full_name}</p>
                  <p className="text-primary text-sm">{user?.specialist?.specialty ?? "Врач"}</p>
                  <p className="text-muted-foreground text-xs">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2 pt-4 border-t border-border text-sm">
                <div className="flex items-center gap-2">
                  <Icon name="ShieldCheck" size={14} className="text-primary" />
                  <span className="text-muted-foreground">Роль:</span>
                  <span className="status-badge status-available text-xs">Врач</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Icon name="Phone" size={14} className="text-primary" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function NotificationsView() {
  const [notifs, setNotifs] = useState<import("@/lib/api").Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(data => {
      setNotifs(data.notifications);
      setLoading(false);
    });
  }, []);

  const markRead = async (id: number) => {
    await api.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const typeIcons: Record<string, { icon: string; color: string }> = {
    reminder: { icon: "Bell", color: "text-yellow-400" },
    confirm: { icon: "CheckCircle", color: "text-emerald-400" },
    cancel: { icon: "XCircle", color: "text-red-400" },
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Система</p>
        <h1 className="text-3xl font-cormorant font-semibold">Уведомления</h1>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Bell" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Уведомлений нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => {
            const { icon, color } = typeIcons[n.type] ?? { icon: "Bell", color: "text-primary" };
            return (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all
                  ${!n.read ? "border-primary/25 bg-primary/5 hover:bg-primary/8" : "border-border gradient-card"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/15" : "bg-muted"}`}>
                  <Icon name={icon as "Bell"} size={18} className={color} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium text-sm">{n.title}
                      {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-primary ml-2 align-middle" />}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(n.time).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}