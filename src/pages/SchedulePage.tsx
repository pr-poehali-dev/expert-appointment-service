import { useState } from "react";
import Icon from "@/components/ui/icon";

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const dates = [24, 25, 26, 27, 28, 1, 2];
const today = 3;

const timeSlots = [
  { time: "09:00", status: "available" },
  { time: "09:30", status: "booked" },
  { time: "10:00", status: "available" },
  { time: "10:30", status: "available" },
  { time: "11:00", status: "booked" },
  { time: "11:30", status: "booked" },
  { time: "12:00", status: "available" },
  { time: "14:00", status: "available" },
  { time: "14:30", status: "available" },
  { time: "15:00", status: "booked" },
  { time: "15:30", status: "available" },
  { time: "16:00", status: "available" },
];

const appointments = [
  { time: "09:30", patient: "Иванова М.С.", type: "Первичный приём", doctor: "Соколова А.В.", status: "confirmed" },
  { time: "11:00", patient: "Петров А.И.", type: "Повторный приём", doctor: "Громов М.Д.", status: "confirmed" },
  { time: "11:30", patient: "Сидорова Е.П.", type: "Консультация", doctor: "Соколова А.В.", status: "pending" },
  { time: "15:00", patient: "Козлов Н.В.", type: "Диагностика", doctor: "Волков Д.С.", status: "confirmed" },
];

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(3);
  const [selectedDoctor, setSelectedDoctor] = useState("Все врачи");

  const doctors = ["Все врачи", "Соколова А.В.", "Громов М.Д.", "Петрова Е.О.", "Волков Д.С."];

  return (
    <div className="min-h-screen px-4 md:px-6 py-8">
      <div className="container max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Управление</p>
          <h1 className="text-3xl md:text-4xl font-cormorant font-semibold">Расписание приёма</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — calendar & slots */}
          <div className="lg:col-span-1 space-y-4">
            {/* Week */}
            <div className="gradient-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Февраль 2026</span>
                <div className="flex gap-1">
                  <button className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                    <Icon name="ChevronLeft" size={14} />
                  </button>
                  <button className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                    <Icon name="ChevronRight" size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
                ))}
                {dates.map((date, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`aspect-square rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-center
                      ${selectedDay === i
                        ? 'gradient-primary text-primary-foreground shadow-lg'
                        : i === today
                          ? 'border border-primary text-primary'
                          : 'hover:bg-muted text-foreground'
                      }`}
                  >
                    {date}
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
                        ? 'bg-primary/15 text-primary font-medium border border-primary/25'
                        : 'hover:bg-muted text-foreground'
                      }`}
                  >
                    {doc}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div className="gradient-card border border-border rounded-2xl p-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">Доступные слоты</p>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={slot.status === 'booked'}
                    className={`py-2 rounded-lg text-xs font-medium transition-all duration-150
                      ${slot.status === 'available'
                        ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:scale-105'
                        : 'bg-muted/50 text-muted-foreground cursor-not-allowed line-through'
                      }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — appointments */}
          <div className="lg:col-span-2">
            <div className="gradient-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg">Записи на день</h2>
                <span className="status-badge status-available">{appointments.length} записи</span>
              </div>

              <div className="space-y-3">
                {appointments.map((apt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/20 transition-all duration-200 cursor-pointer group"
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
                          <p className="text-muted-foreground text-sm mt-0.5">{apt.type}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Icon name="User" size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{apt.doctor}</span>
                          </div>
                        </div>
                        <span className={`status-badge text-xs shrink-0 ${apt.status === 'confirmed' ? 'status-available' : 'status-pending'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${apt.status === 'confirmed' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                          {apt.status === 'confirmed' ? 'Подтверждён' : 'Ожидает'}
                        </span>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center">
                      <Icon name="MoreHorizontal" size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-border text-muted-foreground text-sm hover:border-primary/40 hover:text-primary transition-all duration-200 flex items-center justify-center gap-2">
                <Icon name="Plus" size={14} />
                Добавить запись
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
