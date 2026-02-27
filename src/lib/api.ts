const SPECIALISTS_URL = "https://functions.poehali.dev/3ee2e91f-dc8f-4bfb-a34c-41f506876d1a";
const APPOINTMENTS_URL = "https://functions.poehali.dev/f58ffb3c-073d-4c69-905d-9a512cbbbf8f";
const NOTIFICATIONS_URL = "https://functions.poehali.dev/b314289b-9d68-45a0-9df0-1f97c7a4cfea";
const AUTH_URL = "https://functions.poehali.dev/96e44448-2627-4b77-8881-330c61a8298d";

export interface Specialist {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  reviews: number;
  price: string;
  emoji: string;
  available: boolean;
}

export interface TimeSlot {
  time: string;
  status: "available" | "booked";
}

export interface Appointment {
  id: number;
  patient: string;
  phone: string;
  time: string;
  status: string;
  doctor: string;
  specialty: string;
  date: string;
  specialist_id?: number;
  comment?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  channel: string;
  read: boolean;
  time: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: "client" | "doctor";
  specialist_id: number | null;
  specialist?: { id: number; name: string; specialty: string; emoji: string };
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { "X-Auth-Token": token, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export const api = {
  // AUTH
  async register(data: { email: string; password: string; full_name: string; phone?: string; role?: string; specialist_id?: number }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("auth_token");
    if (token) await fetch(`${AUTH_URL}?action=logout`, { method: "POST", headers: { "X-Auth-Token": token } });
    localStorage.removeItem("auth_token");
  },

  async getMe(): Promise<{ user: User } | null> {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;
    const res = await fetch(AUTH_URL, { headers: { "X-Auth-Token": token } });
    if (res.status === 401) return null;
    return res.json();
  },

  // SPECIALISTS
  async getSpecialists(): Promise<Specialist[]> {
    const res = await fetch(SPECIALISTS_URL);
    const data = await res.json();
    return data.specialists ?? [];
  },

  async getSlots(specialistId: number, date: string): Promise<TimeSlot[]> {
    const res = await fetch(`${SPECIALISTS_URL}?specialist_id=${specialistId}&date=${date}`);
    const data = await res.json();
    return data.slots ?? [];
  },

  // APPOINTMENTS
  async getAppointments(date?: string): Promise<{ appointments: Appointment[] }> {
    const url = date ? `${APPOINTMENTS_URL}?date=${date}` : APPOINTMENTS_URL;
    const res = await fetch(url, { headers: authHeaders() });
    return res.json();
  },

  async createAppointment(payload: {
    specialist_id: number; patient_name: string; patient_phone: string;
    patient_comment?: string; date: string; time: string;
  }): Promise<{ id: number; ok: boolean }> {
    const res = await fetch(APPOINTMENTS_URL, {
      method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
    });
    return res.json();
  },

  async updateAppointmentStatus(id: number, status: string): Promise<void> {
    await fetch(`${APPOINTMENTS_URL}?id=${id}`, {
      method: "PUT", headers: authHeaders(), body: JSON.stringify({ status }),
    });
  },

  // NOTIFICATIONS
  async getNotifications(): Promise<{ notifications: Notification[]; unread: number }> {
    const res = await fetch(NOTIFICATIONS_URL);
    return res.json();
  },

  async markRead(id: number): Promise<void> {
    await fetch(`${NOTIFICATIONS_URL}?action=read&id=${id}`, { method: "POST" });
  },

  async markAllRead(): Promise<void> {
    await fetch(`${NOTIFICATIONS_URL}?action=read_all`, { method: "POST" });
  },
};
