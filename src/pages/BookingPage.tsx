import { useState } from "react";
import Icon from "@/components/ui/icon";

const specialists = [
  { id: 1, name: "Анна Соколова", specialty: "Кардиолог", price: "2 500 ₽", emoji: "🫀", slots: 4 },
  { id: 2, name: "Михаил Громов", specialty: "Невролог", price: "2 200 ₽", emoji: "🧠", slots: 7 },
  { id: 3, name: "Елена Петрова", specialty: "Терапевт", price: "1 800 ₽", emoji: "🩺", slots: 0 },
  { id: 4, name: "Дмитрий Волков", specialty: "Хирург", price: "3 000 ₽", emoji: "🔬", slots: 2 },
];

const timeOptions = ["09:00", "10:00", "10:30", "12:00", "14:30", "15:30", "16:00"];

type Step = 1 | 2 | 3;

export default function BookingPage() {
  const [step, setStep] = useState<Step>(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", comment: "" });

  const selectedSpec = specialists.find((s) => s.id === selected);

  const steps = [
    { n: 1, label: "Специалист" },
    { n: 2, label: "Дата и время" },
    { n: 3, label: "Ваши данные" },
  ];

  return (
    <div className="min-h-screen px-4 md:px-6 py-8">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Онлайн-запись</p>
          <h1 className="text-3xl md:text-4xl font-cormorant font-semibold">Записаться к врачу</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <button
                onClick={() => step > s.n && setStep(s.n as Step)}
                className={`flex items-center gap-2 transition-all duration-200 ${step > s.n ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
                  ${step === s.n
                    ? 'gradient-primary text-primary-foreground'
                    : step > s.n
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                  {step > s.n ? <Icon name="Check" size={14} /> : s.n}
                </div>
                <span className={`text-sm font-medium hidden sm:block transition-colors ${step === s.n ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-px w-8 md:w-16 transition-colors ${step > s.n ? 'bg-primary/40' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Choose specialist */}
        {step === 1 && (
          <div className="animate-scale-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {specialists.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => sp.slots > 0 && setSelected(sp.id)}
                  disabled={sp.slots === 0}
                  className={`text-left p-5 rounded-2xl border transition-all duration-200 card-hover
                    ${selected === sp.id
                      ? 'border-primary bg-primary/8 shadow-lg shadow-primary/10'
                      : sp.slots === 0
                        ? 'border-border bg-muted/20 opacity-50 cursor-not-allowed'
                        : 'border-border gradient-card hover:border-primary/30'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{sp.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{sp.name}</p>
                      <p className="text-primary text-sm">{sp.specialty}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-muted-foreground text-sm">{sp.price}</span>
                        {sp.slots > 0 ? (
                          <span className="status-badge status-available text-xs">{sp.slots} слотов</span>
                        ) : (
                          <span className="status-badge status-busy text-xs">Занят</span>
                        )}
                      </div>
                    </div>
                    {selected === sp.id && (
                      <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center shrink-0">
                        <Icon name="Check" size={11} className="text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => selected && setStep(2)}
              disabled={!selected}
              className="w-full gradient-primary text-primary-foreground font-semibold py-3.5 rounded-xl btn-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Далее — выбрать время
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}

        {/* Step 2 — Date & Time */}
        {step === 2 && (
          <div className="animate-scale-in space-y-5">
            {selectedSpec && (
              <div className="gradient-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">{selectedSpec.emoji}</span>
                <div>
                  <p className="font-semibold">{selectedSpec.name}</p>
                  <p className="text-primary text-sm">{selectedSpec.specialty} · {selectedSpec.price}</p>
                </div>
              </div>
            )}

            <div className="gradient-card border border-border rounded-2xl p-5">
              <p className="font-medium mb-4">Выберите дату</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[27, 28, 1, 2, 3, 4, 5].map((d, i) => (
                  <button
                    key={i}
                    className={`py-3 rounded-xl text-sm font-medium transition-all duration-150 flex flex-col items-center gap-0.5
                      ${i === 1 ? 'gradient-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
                  >
                    <span className="text-xs opacity-70">
                      {["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][i]}
                    </span>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="gradient-card border border-border rounded-2xl p-5">
              <p className="font-medium mb-4">Выберите время</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {timeOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                      ${selectedTime === t
                        ? 'gradient-primary text-primary-foreground shadow-md'
                        : 'bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 hover:scale-105'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => selectedTime && setStep(3)}
                disabled={!selectedTime}
                className="flex-[2] gradient-primary text-primary-foreground font-semibold py-3.5 rounded-xl btn-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Далее — ваши данные
                <Icon name="ArrowRight" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Personal info */}
        {step === 3 && (
          <div className="animate-scale-in space-y-5">
            {selectedSpec && (
              <div className="gradient-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{selectedSpec.emoji}</span>
                  <div>
                    <p className="font-semibold">{selectedSpec.name}</p>
                    <p className="text-primary text-sm">{selectedSpec.specialty}</p>
                  </div>
                </div>
                <div className="flex gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="Calendar" size={13} />
                    28 февраля 2026
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="Clock" size={13} />
                    {selectedTime}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="Banknote" size={13} />
                    {selectedSpec.price}
                  </div>
                </div>
              </div>
            )}

            <div className="gradient-card border border-border rounded-2xl p-5 space-y-4">
              <p className="font-medium">Ваши контакты</p>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Имя и фамилия</label>
                <input
                  type="text"
                  placeholder="Иванова Мария Сергеевна"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Номер телефона</label>
                <input
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Комментарий (необязательно)</label>
                <textarea
                  placeholder="Опишите жалобы или цель визита..."
                  rows={3}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 text-sm transition-colors placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
              >
                Назад
              </button>
              <button
                disabled={!form.name || !form.phone}
                className="flex-[2] gradient-primary text-primary-foreground font-semibold py-3.5 rounded-xl btn-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Icon name="CheckCircle" size={16} />
                Подтвердить запись
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
