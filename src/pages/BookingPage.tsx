import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api, Specialist, TimeSlot } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Step = 1 | 2 | 3 | 4;

const todayIso = new Date().toISOString().slice(0, 10);

function getNextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("ru", { day: "numeric", month: "short" }),
      dayName: d.toLocaleDateString("ru", { weekday: "short" }),
    };
  });
}

export default function BookingPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: user?.full_name ?? "", phone: user?.phone ?? "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const days = getNextDays(7);
  const selectedSpec = specialists.find((s) => s.id === selected);

  useEffect(() => {
    api.getSpecialists().then((data) => {
      setSpecialists(data);
      setLoadingSpecs(false);
    });
  }, []);

  useEffect(() => {
    if (selected && selectedDate) {
      setLoadingSlots(true);
      setSelectedTime(null);
      api.getSlots(selected, selectedDate).then((data) => {
        setSlots(data);
        setLoadingSlots(false);
      });
    }
  }, [selected, selectedDate]);

  const handleSubmit = async () => {
    if (!selected || !selectedTime) return;
    setSubmitting(true);
    await api.createAppointment({
      specialist_id: selected,
      patient_name: form.name,
      patient_phone: form.phone,
      patient_comment: form.comment,
      date: selectedDate,
      time: selectedTime,
    });
    setSubmitting(false);
    setDone(true);
  };

  const stepLabels = [
    { n: 1, label: "Специалист" },
    { n: 2, label: "Дата и время" },
    { n: 3, label: "Ваши данные" },
  ];

  if (done) {
    return (
      <div className="min-h-screen px-4 md:px-6 py-8 flex items-center justify-center">
        <div className="text-center max-w-md animate-scale-in">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Icon name="CheckCircle" size={40} className="text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-cormorant font-semibold mb-3">Запись подтверждена!</h2>
          <p className="text-muted-foreground mb-2">
            {form.name}, вы записаны к {selectedSpec?.specialty.toLowerCase()} {selectedSpec?.name}
          </p>
          <p className="text-primary font-medium mb-8">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("ru", { day: "numeric", month: "long" })} в {selectedTime}
          </p>
          <button
            onClick={() => { setDone(false); setStep(1); setSelected(null); setSelectedTime(null); setForm({ name: "", phone: "", comment: "" }); }}
            className="gradient-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl btn-glow"
          >
            Записаться ещё раз
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-8">
      <div className="container max-w-3xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <p className="text-primary text-sm font-medium uppercase tracking-widest mb-1">Онлайн-запись</p>
          <h1 className="text-3xl md:text-4xl font-cormorant font-semibold">Записаться к врачу</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {stepLabels.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <button
                onClick={() => step > s.n && setStep(s.n as Step)}
                className={`flex items-center gap-2 ${step > s.n ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
                  ${step === s.n ? "gradient-primary text-primary-foreground" : step > s.n ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {step > s.n ? <Icon name="Check" size={14} /> : s.n}
                </div>
                <span className={`text-sm font-medium hidden sm:block transition-colors ${step === s.n ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </button>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-px w-8 md:w-16 transition-colors ${step > s.n ? "bg-primary/40" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-scale-in">
            {loadingSpecs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {specialists.map((sp) => (
                  <button
                    key={sp.id}
                    onClick={() => sp.available && setSelected(sp.id)}
                    disabled={!sp.available}
                    className={`text-left p-5 rounded-2xl border transition-all duration-200 card-hover
                      ${selected === sp.id
                        ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                        : !sp.available
                          ? "border-border bg-muted/20 opacity-50 cursor-not-allowed"
                          : "border-border gradient-card hover:border-primary/30"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{sp.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{sp.name}</p>
                        <p className="text-primary text-sm">{sp.specialty}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-muted-foreground text-sm">{sp.price}</span>
                          <span className={`status-badge text-xs ${sp.available ? "status-available" : "status-busy"}`}>
                            {sp.available ? "Доступен" : "Занят"}
                          </span>
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
            )}
            <button
              onClick={() => selected && setStep(2)}
              disabled={!selected}
              className="w-full gradient-primary text-primary-foreground font-semibold py-3.5 rounded-xl btn-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Далее — выбрать время <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        )}

        {/* Step 2 */}
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
                {days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => setSelectedDate(d.iso)}
                    className={`py-3 rounded-xl text-sm font-medium transition-all duration-150 flex flex-col items-center gap-0.5
                      ${selectedDate === d.iso ? "gradient-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`}
                  >
                    <span className="text-xs opacity-70">{d.dayName}</span>
                    {d.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="gradient-card border border-border rounded-2xl p-5">
              <p className="font-medium mb-4">Выберите время</p>
              {loadingSlots ? (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-9 rounded-xl bg-muted animate-pulse" />)}
                </div>
              ) : slots.filter((s) => s.status === "available").length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">На эту дату нет свободных слотов</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={slot.status === "booked"}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                        ${selectedTime === slot.time
                          ? "gradient-primary text-primary-foreground shadow-md"
                          : slot.status === "available"
                            ? "bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 hover:scale-105"
                            : "bg-muted/50 text-muted-foreground cursor-not-allowed line-through"
                        }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors">Назад</button>
              <button
                onClick={() => selectedTime && setStep(3)}
                disabled={!selectedTime}
                className="flex-[2] gradient-primary text-primary-foreground font-semibold py-3.5 rounded-xl btn-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Далее — ваши данные <Icon name="ArrowRight" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
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
                <div className="flex flex-wrap gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Icon name="Calendar" size={13} />
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("ru", { day: "numeric", month: "long" })}
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
              <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors">Назад</button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.phone || submitting}
                className="flex-[2] gradient-primary text-primary-foreground font-semibold py-3.5 rounded-xl btn-glow transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Icon name="Loader" size={16} className="animate-spin" /> Сохранение...</>
                ) : (
                  <><Icon name="CheckCircle" size={16} /> Подтвердить запись</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}