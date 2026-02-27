import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

type Mode = "login" | "register";

const DEMO_CLIENTS = [
  { full_name: "Иванова Мария Сергеевна", email: "ivanova@demo.ru", phone: "+7 999 111-22-33" },
  { full_name: "Петров Алексей Иванович", email: "petrov@demo.ru", phone: "+7 999 444-55-66" },
  { full_name: "Сидорова Елена Павловна", email: "sidorova@demo.ru", phone: "+7 999 777-88-99" },
];

const DEMO_PASSWORD = "demo123";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<"client" | "doctor">("client");
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErr(""); };

  const fillDemo = (client: typeof DEMO_CLIENTS[0]) => {
    setForm({ full_name: client.full_name, email: client.email, phone: client.phone, password: DEMO_PASSWORD });
    setShowDemo(false);
    setErr("");
  };

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
              <button key={m} onClick={() => { setMode(m); setErr(""); setShowDemo(false); }}
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
                    <button key={r.v} type="button" onClick={() => { setRole(r.v as "client" | "doctor"); setShowDemo(false); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200
                        ${role === r.v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                      <Icon name={r.icon as "User"} size={14} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Demo autofill (client register only) */}
            {mode === "register" && role === "client" && (
              <div className="relative">
                <button type="button" onClick={() => setShowDemo(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-dashed border-primary/30 text-sm text-primary hover:bg-primary/5 transition-all">
                  <span className="flex items-center gap-2">
                    <Icon name="Zap" size={14} />
                    Заполнить тестовыми данными
                  </span>
                  <Icon name={showDemo ? "ChevronUp" : "ChevronDown"} size={14} />
                </button>
                {showDemo && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 gradient-card border border-border rounded-xl shadow-xl overflow-hidden animate-scale-in">
                    {DEMO_CLIENTS.map(c => (
                      <button key={c.email} type="button" onClick={() => fillDemo(c)}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0">
                        <p className="text-sm font-medium">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.email} · пароль: {DEMO_PASSWORD}</p>
                      </button>
                    ))}
                  </div>
                )}
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

            {/* Phone (register client only) */}
            {mode === "register" && role === "client" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Телефон (необязательно)</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-sm placeholder:text-muted-foreground transition-colors" />
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
