import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, Specialist } from "@/lib/api";
import Icon from "@/components/ui/icon";

type Mode = "login" | "register";

interface AuthPageProps {
  defaultMode?: Mode;
}

export default function AuthPage({ defaultMode = "login" }: AuthPageProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [role, setRole] = useState<"client" | "doctor">("client");
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", specialist_id: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (mode === "register" && role === "doctor") {
      api.getSpecialists().then(setSpecialists);
    }
  }, [mode, role]);

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    let result: { error?: string };

    if (mode === "login") {
      result = await login(form.email, form.password);
    } else {
      result = await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone || undefined,
        role,
        specialist_id: role === "doctor" && form.specialist_id ? Number(form.specialist_id) : undefined,
      });
    }

    if (result.error) setErr(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-xl mb-4">
            <Icon name="Stethoscope" size={28} className="text-primary-foreground" />
          </div>
          <h1 className="font-cormorant text-3xl font-semibold">МедиКлиник</h1>
          <p className="text-muted-foreground text-sm mt-1">Запись к специалистам</p>
        </div>

        <div className="gradient-card border border-border rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
            {(["login", "register"] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role toggle (only register) */}
            {mode === "register" && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Я регистрируюсь как</p>
                <div className="flex gap-2">
                  {[{ v: "client", label: "Пациент", icon: "User" }, { v: "doctor", label: "Врач", icon: "Stethoscope" }].map(r => (
                    <button key={r.v} type="button" onClick={() => setRole(r.v as "client" | "doctor")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
                        ${role === r.v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      <Icon name={r.icon as "User"} size={14} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full name (register only) */}
            {mode === "register" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Имя и фамилия</label>
                <input required value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  placeholder="Иванова Мария Сергеевна"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm placeholder:text-muted-foreground transition-colors" />
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
              <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="example@mail.ru"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm placeholder:text-muted-foreground transition-colors" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Пароль</label>
              <input required type="password" value={form.password} onChange={e => set("password", e.target.value)}
                placeholder={mode === "register" ? "Минимум 6 символов" : "••••••••"}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm placeholder:text-muted-foreground transition-colors" />
            </div>

            {/* Phone (register only) */}
            {mode === "register" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Телефон (необязательно)</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm placeholder:text-muted-foreground transition-colors" />
              </div>
            )}

            {/* Specialist select for doctor */}
            {mode === "register" && role === "doctor" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Выберите вашего специалиста</label>
                <select required value={form.specialist_id} onChange={e => set("specialist_id", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm transition-colors">
                  <option value="">— выберите —</option>
                  {specialists.map(s => (
                    <option key={s.id} value={s.id}>{s.emoji} {s.name} · {s.specialty}</option>
                  ))}
                </select>
              </div>
            )}

            {err && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-red-400">
                <Icon name="AlertCircle" size={14} />
                {err}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-semibold py-3.5 rounded-xl btn-glow transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Icon name="Loader" size={16} className="animate-spin" /> Загрузка...</>
                : mode === "login" ? "Войти" : "Создать аккаунт"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
