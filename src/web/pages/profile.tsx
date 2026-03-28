import { useState } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Camera, Edit2, LogOut, Save, X } from "lucide-react";

export default function ProfilePage() {
  const { user, lang, theme, setUser, logout } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    middleName: user?.middleName || "",
    gender: user?.gender || "male",
    birthDate: user?.birthDate || "",
    email: user?.email || "",
  });

  if (!user) return null;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSave() {
    setLoading(true);
    const res: any = await api.updateUser(user.id, form);
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    setUser(res.user);
    setEditing(false);
    toast.success(tr("common.success"));
  }

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  const roleLabel = user.role === "admin" ? "👑 Администратор" :
                    user.role === "manager" ? "⚙️ Менеджер" :
                    user.role === "student" ? "🎓 Студент" : "👤 Пользователь";

  return (
    <div data-theme={theme}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-black">{tr("profile.title")}</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--secondary)" }}>
                <X size={16} />
              </button>
              <button onClick={handleSave} disabled={loading}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
                <Save size={16} style={{ color: "var(--primary-foreground)" }} />
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--secondary)" }}>
              <Edit2 size={16} style={{ color: "var(--primary)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-20 h-20 mb-3">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              color: "var(--primary-foreground)"
            }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "var(--card)", border: "2px solid var(--border)" }}>
            <Camera size={12} style={{ color: "var(--primary)" }} />
          </div>
        </div>
        <h2 className="text-lg font-black">{user.lastName} {user.firstName}</h2>
        {user.middleName && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{user.middleName}</p>}
        <span className="mt-1.5 text-xs px-3 py-1 rounded-full"
          style={{ background: "var(--primary)15", color: "var(--primary)", border: "1px solid var(--primary)30" }}>
          {roleLabel}
        </span>
      </div>

      {/* Info card */}
      <div className="rounded-2xl p-4 mb-4 card-glow" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={tr("auth.lastName")} value={form.lastName} onChange={set("lastName")} />
              <Field label={tr("auth.firstName")} value={form.firstName} onChange={set("firstName")} />
            </div>
            <Field label={tr("auth.middleName")} value={form.middleName} onChange={set("middleName")} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>{tr("auth.gender")}</label>
                <select value={form.gender} onChange={set("gender")}
                  className="w-full rounded-xl px-3 py-2.5 text-sm border"
                  style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                  <option value="male">{tr("auth.male")}</option>
                  <option value="female">{tr("auth.female")}</option>
                </select>
              </div>
              <Field label={tr("auth.birthDate")} value={form.birthDate} onChange={set("birthDate")} type="date" />
            </div>
            <Field label={tr("auth.email")} value={form.email} onChange={set("email")} type="email" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <InfoRow label="Телефон" value={user.phone} />
            <InfoRow label={tr("auth.gender")} value={user.gender === "male" ? tr("auth.male") : tr("auth.female")} />
            {user.birthDate && <InfoRow label={tr("auth.birthDate")} value={user.birthDate} />}
            {user.email && <InfoRow label="Email" value={user.email} />}
            <InfoRow label="Регистрация" value={new Date(user.createdAt * 1000).toLocaleDateString("ru")} />
          </div>
        )}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
        style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
        <LogOut size={16} /> {tr("profile.logout")}
      </button>

      {/* Footer */}
      <footer className="mt-6 text-center py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-center gap-4">
          <a href="https://instagram.com/Jov1d_0n" target="_blank" rel="noreferrer"
            className="text-xs font-medium" style={{ color: "var(--primary)" }}>📸 @Jov1d_0n</a>
          <a href="https://wa.me/992917971000" target="_blank" rel="noreferrer"
            className="text-xs font-medium" style={{ color: "#25D366" }}>💬 WhatsApp</a>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>+992 917 971 000</span>
        </div>
      </footer>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</label>
      <input type={type} value={value} onChange={onChange}
        className="w-full rounded-xl px-3 py-2.5 text-sm border outline-none"
        style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
    </div>
  );
}
