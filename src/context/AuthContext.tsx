import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: RegisterData) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
  specialist_id?: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then((res) => {
      setUser(res?.user ?? null);
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.error) return { error: res.error as unknown as string };
    localStorage.setItem("auth_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return {};
  };

  const register = async (data: RegisterData) => {
    const res = await api.register(data);
    if (res.error) return { error: res.error as unknown as string };
    localStorage.setItem("auth_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return {};
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
