import { useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AuthPage() {
  const { lang, theme, setUser } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    phone: "+992",
    password: "",
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "male",
    birthDate: "",
    email: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let res: any;
      if (mode === "login") {
        res = await api.login(form.phone, form.password);
      } else {
        if (!form.phone.startsWith("+992")) {
          toast.error(tr("auth.phoneHint"));
          setLoading(false);
          return;
        }
        res = await api.register(form);
      }
      if (res.error) {
        toast.error(res.error);
      } else {
        setUser(res.user);
        navigate("/");
      }
    } catch (e) {
      toast.error(tr("common.error"));
    }
    setLoading(false);
  }

  return (
    <div data-theme={theme} style={{ minHeight: "100vh", background: "var(--background)" }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg"
            style={{ boxShadow: "0 8px 32px rgba(212,160,23,0.3)" }}>
            <img src="/logo.png" alt="JTest" className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }} />
            <div className="w-full h-full flex items-center justify-center text-3xl font-black"
              style={{ background: "linear-gradient(135deg, #D4A017, #FFD700)", color: "#0A0E1A" }}>
              J
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black" style={{ color: "var(--primary)" }}>JTest</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {lang === "ru" ? "Тренажёр тестов" : lang === "tj" ? "Машқи тестҳо" : "Test Trainer"}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-2xl p-6 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden mb-6" style={{ background: "var(--secondary)" }}>
            <button onClick={() => setMode("login")}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: mode === "login" ? "var(--primary)" : "transparent",
                color: mode === "login" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                borderRadius: "10px"
              }}>
              {tr("auth.login")}
            </button>
            <button onClick={() => setMode("register")}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: mode === "register" ? "var(--primary)" : "transparent",
                color: mode === "register" ? "var(--primary-foreground)" : "var(--muted-foreground)",
                borderRadius: "10px"
              }}>
              {tr("auth.register")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tr("auth.lastName")} value={form.lastName} onChange={set("lastName")} required />
                  <Field label={tr("auth.firstName")} value={form.firstName} onChange={set("firstName")} required />
                </div>
                <Field label={tr("auth.middleName")} value={form.middleName} onChange={set("middleName")} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{tr("auth.gender")}</label>
                    <select value={form.gender} onChange={set("gender")}
                      className="rounded-xl px-3 py-2.5 text-sm border"
                      style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                      <option value="male">{tr("auth.male")}</option>
                      <option value="female">{tr("auth.female")}</option>
                    </select>
                  </div>
                  <Field label={tr("auth.birthDate")} value={form.birthDate} onChange={set("birthDate")} placeholder="ДД.ММ.ГГГГ" />
                </div>
                <Field label={tr("auth.email")} value={form.email} onChange={set("email")} type="email" />
              </>
            )}

            <Field label={tr("auth.phone")} value={form.phone} onChange={set("phone")} required
              hint={tr("auth.phoneHint")} />
            <Field label={tr("auth.password")} value={form.password} onChange={set("password")} type="password" required />

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm mt-2 transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--accent))",
                color: "var(--primary-foreground)",
                opacity: loading ? 0.7 : 1
              }}>
              {loading ? tr("common.loading") : mode === "login" ? tr("auth.login") : tr("auth.register")}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center" style={{ color: "var(--muted-foreground)" }}>
          <p className="text-xs">© 2025 JTest</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <a href="https://instagram.com/Jov1d_0n" target="_blank" rel="noreferrer"
              className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
              @Jov1d_0n
            </a>
            <a href="https://wa.me/992917971000" target="_blank" rel="noreferrer"
              className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
              WhatsApp
            </a>
            <span className="text-xs">+992 917 971 000</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, hint }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="rounded-xl px-3 py-2.5 text-sm border outline-none focus:ring-2"
        style={{
          background: "var(--input)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
          ringColor: "var(--primary)"
        }}
      />
      {hint && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{hint}</p>}
    </div>
  );
}
