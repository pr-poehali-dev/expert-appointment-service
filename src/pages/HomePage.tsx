import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { api, Specialist } from "@/lib/api";

const stats = [
  { value: "2 400+", label: "Пациентов", icon: "Users" },
  { value: "48", label: "Специалистов", icon: "Stethoscope" },
  { value: "15", label: "Лет работы", icon: "Award" },
  { value: "99%", label: "Довольны", icon: "Heart" },
];

interface HomePageProps {
  onBook?: () => void;
}

export default function HomePage({ onBook }: HomePageProps) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSpecialists().then((data) => {
      setSpecialists(data);
      setLoading(false);
    });
  }, []);

  const availableCount = specialists.filter((s) => s.available).length;

  return (
    <div className="min-h-screen">
      <section className="gradient-hero relative overflow-hidden px-6 py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl" />
        </div>

        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center gap-6 animate-fade-in">
            <div className="status-badge status-available text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot inline-block" />
              {loading ? "Загрузка..." : `Сейчас доступны ${availableCount} врача`}
            </div>

            <h1 className="text-5xl md:text-7xl font-cormorant font-semibold leading-tight max-w-3xl">
              Ваше здоровье —
              <br />
              <span className="text-gradient">наш приоритет</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed">
              Запишитесь к специалисту онлайн за 2 минуты. Удобное расписание, напоминания и все записи в одном месте.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={onBook}
                className="gradient-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-xl btn-glow transition-all duration-200 hover:opacity-90 flex items-center gap-2"
              >
                <Icon name="CalendarPlus" size={18} />
                Записаться сейчас
              </button>
              <button className="glass-card text-foreground font-medium px-8 py-3.5 rounded-xl hover:border-primary/30 transition-all duration-200 flex items-center gap-2">
                <Icon name="Play" size={16} />
                Как это работает
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {stats.map((s, i) => (
              <div key={s.label} className="glass-card rounded-2xl p-5 text-center card-hover" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                  <Icon name={s.icon as "Users"} size={18} className="text-primary-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="container max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-primary text-sm font-medium uppercase tracking-widest mb-2">Команда врачей</p>
              <h2 className="text-3xl md:text-4xl font-cormorant font-semibold">Наши специалисты</h2>
            </div>
            <button onClick={onBook} className="text-primary text-sm font-medium hover:opacity-80 transition-opacity flex items-center gap-1">
              Записаться <Icon name="ArrowRight" size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="gradient-card border border-border rounded-2xl p-5 animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-muted mb-4" />
                  <div className="h-4 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {specialists.map((sp, i) => (
                <div
                  key={sp.id}
                  className="gradient-card border border-border rounded-2xl p-5 card-hover cursor-pointer"
                  style={{ animationDelay: `${i * 0.08}s` }}
                  onClick={onBook}
                >
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl mb-4">
                    {sp.emoji}
                  </div>
                  <div className="mb-1">
                    <span className={`status-badge ${sp.available ? "status-available" : "status-busy"} text-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${sp.available ? "bg-emerald-400" : "bg-red-400"}`} />
                      {sp.available ? "Доступен" : "Занят"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mt-3 mb-0.5">{sp.name}</h3>
                  <p className="text-primary text-sm font-medium">{sp.specialty}</p>
                  <p className="text-muted-foreground text-xs mt-1">Опыт: {sp.experience}</p>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <Icon name="Star" size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{sp.rating}</span>
                    <span className="text-muted-foreground text-xs">({sp.reviews} отзывов)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16 bg-muted/30">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-medium uppercase tracking-widest mb-2">Просто и быстро</p>
            <h2 className="text-3xl md:text-4xl font-cormorant font-semibold">Как записаться</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: "Search", title: "Выберите врача", desc: "Найдите нужного специалиста по направлению или имени" },
              { step: "02", icon: "Calendar", title: "Выберите время", desc: "Укажите удобную дату и время приёма из доступных слотов" },
              { step: "03", icon: "CheckCircle", title: "Получите подтверждение", desc: "Придёт SMS и email с напоминанием за день до приёма" },
            ].map((item) => (
              <div key={item.step} className="gradient-card border border-border rounded-2xl p-6 relative overflow-hidden card-hover">
                <span className="absolute top-4 right-5 font-cormorant text-5xl font-bold text-border select-none">{item.step}</span>
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 relative z-10">
                  <Icon name={item.icon as "Search"} size={20} className="text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2 relative z-10">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
