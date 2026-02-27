import { useState } from "react";
import Icon from "@/components/ui/icon";

const notifications = [
  {
    id: 1, type: "reminder", title: "Напоминание о приёме", 
    message: "Иванова М.С. — завтра в 09:30 у кардиолога Соколовой А.В.",
    time: "2 часа назад", channel: "SMS + Email", read: false
  },
  {
    id: 2, type: "confirm", title: "Запись подтверждена",
    message: "Петров А.И. подтвердил запись на 25 февраля в 11:00.",
    time: "5 часов назад", channel: "Email", read: false
  },
  {
    id: 3, type: "cancel", title: "Отмена записи",
    message: "Сидорова Е.П. отменила запись на 26 февраля в 14:00.",
    time: "Вчера, 18:42", channel: "SMS", read: true
  },
  {
    id: 4, type: "reminder", title: "Напоминание о приёме",
    message: "Козлов Н.В. — сегодня в 15:00 у хирурга Волкова Д.С.",
    time: "Вчера, 15:00", channel: "SMS + Email", read: true
  },
  {
    id: 5, type: "confirm", title: "Новая запись",
    message: "Морозова А.П. записалась на 28 февраля в 10:30 к терапевту.",
    time: "2 дня назад", channel: "Email", read: true
  },
];

const templates = [
  { name: "Напоминание за день", active: true, channel: "SMS + Email", desc: "Отправляется за 24 часа до приёма" },
  { name: "Напоминание за час", active: true, channel: "SMS", desc: "Отправляется за 60 минут до приёма" },
  { name: "Подтверждение записи", active: true, channel: "Email", desc: "Сразу после оформления записи" },
  { name: "Отмена записи", active: false, channel: "SMS + Email", desc: "При отмене пациентом или врачом" },
];

const typeIcons: Record<string, { icon: string; color: string }> = {
  reminder: { icon: "Bell", color: "text-yellow-400" },
  confirm: { icon: "CheckCircle", color: "text-emerald-400" },
  cancel: { icon: "XCircle", color: "text-red-400" },
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<"feed" | "settings">("feed");
  const [notifs, setNotifs] = useState(notifications);
  const [tmpl, setTmpl] = useState(templates);

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div className="min-h-screen px-4 md:px-6 py-8">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-in">
          <div>
            <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Система</p>
            <h1 className="text-3xl md:text-4xl font-cormorant font-semibold">Уведомления</h1>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-2"
            >
              <Icon name="CheckCheck" size={14} />
              Прочитать все ({unread})
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Отправлено сегодня", value: "24", icon: "Send", color: "text-primary" },
            { label: "Не прочитано", value: String(unread), icon: "Bell", color: "text-yellow-400" },
            { label: "Доставлено", value: "98.5%", icon: "TrendingUp", color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="gradient-card border border-border rounded-2xl p-4">
              <Icon name={s.icon as "Send"} size={18} className={`${s.color} mb-2`} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6 w-fit">
          {(["feed", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {tab === "feed" ? "Лента" : "Шаблоны"}
            </button>
          ))}
        </div>

        {/* Feed */}
        {activeTab === "feed" && (
          <div className="space-y-2 animate-scale-in">
            {notifs.map((n) => {
              const { icon, color } = typeIcons[n.type] || { icon: "Bell", color: "text-primary" };
              return (
                <div
                  key={n.id}
                  onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                  className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer
                    ${!n.read
                      ? 'border-primary/25 bg-primary/5 hover:bg-primary/8'
                      : 'border-border gradient-card hover:border-primary/15'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/15' : 'bg-muted'}`}>
                    <Icon name={icon as "Bell"} size={18} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${!n.read ? 'text-foreground' : 'text-foreground/80'}`}>
                        {n.title}
                        {!n.read && <span className="inline-block w-2 h-2 rounded-full bg-primary ml-2 align-middle" />}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">{n.time}</span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Icon name="Radio" size={11} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{n.channel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="animate-scale-in space-y-3">
            <p className="text-sm text-muted-foreground mb-4">Настройте автоматические уведомления пациентам</p>
            {tmpl.map((t, i) => (
              <div key={t.name} className="gradient-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold">{t.name}</p>
                    <span className="status-badge text-xs bg-muted text-muted-foreground border-border">
                      {t.channel}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{t.desc}</p>
                </div>
                <button
                  onClick={() => setTmpl((prev) => prev.map((x, j) => j === i ? { ...x, active: !x.active } : x))}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 shrink-0
                    ${t.active ? 'gradient-primary' : 'bg-muted'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${t.active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}

            <button className="w-full mt-2 py-3.5 rounded-xl gradient-primary text-primary-foreground font-semibold btn-glow transition-all duration-200 flex items-center justify-center gap-2">
              <Icon name="Save" size={16} />
              Сохранить настройки
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
