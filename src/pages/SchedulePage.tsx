import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api, Appointment, TimeSlot } from "@/lib/api";

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getWeekDates(): { date: number; iso: string; dayIdx: number }[] {
  const today = new Date();
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      date: d.getDate(),
      iso: d.toISOString().slice(0, 10),
      dayIdx: (d.getDay() + 6) % 7,
    });
  }
  return result;
}

export default function SchedulePage() {
  const weekDates = getWeekDates();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState("Все врачи");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedDate = weekDates[selectedIdx]?.iso;

  useEffect(() => {
    setLoading(true);
    api.getAppointments(selectedDate).then((data) => {
      setAppointments(data.appointments);
      setLoading(false);
    });
  }, [selectedDate]);

  const doctors = ["Все врачи", ...Array.from(new Set(appointments.map((a) => a.doctor)))];

  const filtered = selectedDoctor === "Все врачи"
    ? appointments
    : appointments.filter((a) => a.doctor === selectedDoctor);

  const handleStatusChange = async (id: number, status: string) => {
    await api.updateAppointmentStatus(id, status);
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  return (
    <div className="min-h-screen px-4 md:px-6 py-8">
      <div className="container max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Управление</p>
          <h1 className="text-3xl md:text-4xl font-cormorant font-semibold">Расписание приёма</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Week */}
            <div className="gradient-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">
                  {new Date().toLocaleString("ru", { month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
                {weekDates.map((wd, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    className={`aspect-square rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center
                      ${selectedIdx === i
                        ? "gradient-primary text-primary-foreground shadow-lg"
                        : i === 0
                          ? "border border-primary text-primary"
                          : "hover:bg-muted text-foreground"
                      }`}
                    style={{ gridColumn: i === 0 ? wd.dayIdx + 1 : undefined }}
                  >
                    {wd.date}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor filter */}
            <div className="gradient-card border border-border rounded-2xl p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Фильтр по врачу</p>
              <div className="space-y-1">
                {doctors.map((doc) => (
                  <button
                    key={doc}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150
                      ${selectedDoctor === doc
                        ? "bg-primary/15 text-primary font-medium border border-primary/25"
                        : "hover:bg-muted text-foreground"
                      }`}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            </div>

            {/* Slots */}
            <div className="gradient-card border border-border rounded-2xl p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Слоты на день</p>
              {slots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Выберите врача для просмотра слотов</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={slot.status === "booked"}
                      className={`py-2 rounded-lg text-xs font-medium transition-all duration-150
                        ${slot.status === "available"
                          ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:scale-105"
                          : "bg-muted/50 text-muted-foreground cursor-not-allowed line-through"
                        }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Appointments */}
          <div className="lg:col-span-2">
            <div className="gradient-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">
                  Записи на {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("ru", { day: "numeric", month: "long" }) : "день"}
                </h2>
                {!loading && (
                  <span className="status-badge status-available">{filtered.length} записи</span>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Calendar" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Записей на этот день нет</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/20 transition-all duration-200 group"
                    >
                      <div className="text-center min-w-[52px]">
                        <div className="gradient-primary text-primary-foreground text-sm font-bold px-2 py-1.5 rounded-xl">
                          {apt.time}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{apt.patient}</p>
                            <p className="text-muted-foreground text-sm mt-0.5">{apt.specialty}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Icon name="User" size={12} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{apt.doctor}</span>
                            </div>
                          </div>
                          <span className={`status-badge text-xs shrink-0 ${apt.status === "confirmed" ? "status-available" : "status-pending"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${apt.status === "confirmed" ? "bg-emerald-400" : "bg-yellow-400"}`} />
                            {apt.status === "confirmed" ? "Подтверждён" : "Ожидает"}
                          </span>
                        </div>
                      </div>
                      {apt.status === "pending" && (
                        <button
                          onClick={() => handleStatusChange(apt.id, "confirmed")}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
