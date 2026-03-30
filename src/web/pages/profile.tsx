import { useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Camera, Edit2, LogOut, Save, X, Settings } from "lucide-react";

export default function ProfilePage() {
  const { user, lang, theme, setUser, logout } = useStore();
  const tr = useT(lang);
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Фото до 5 МБ"); return; }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res: any = await api.updateUser(user.id, { photo: base64 });
      if (res.error) { toast.error(res.error); }
      else { setUser(res.user); toast.success("Фото обновлено!"); }
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  }

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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-black">{tr("profile.title")}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--secondary)" }}>
            <Settings size={16} style={{ color: "var(--primary)" }} />
          </button>
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

      {/* Avatar with photo upload */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-20 h-20 mb-3">
          <button
            onClick={() => photoRef.current?.click()}
            className="w-20 h-20 rounded-3xl overflow-hidden relative"
            style={{ boxShadow: "0 4px 20px rgba(212,160,23,0.3)" }}>
            {user.photo ? (
              <img src={user.photo} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-black"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{ borderColor: "white", borderTopColor: "transparent" }} />
              </div>
            )}
          </button>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--primary)", border: "2px solid var(--background)" }}>
            <Camera size={13} color="white" />
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        <h2 className="text-lg font-black">{user.lastName} {user.firstName}</h2>
        {user.middleName && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{user.middleName}</p>}
        <span className="mt-1.5 text-xs px-3 py-1 rounded-full"
          style={{ background: "var(--primary)15", color: "var(--primary)", border: "1px solid var(--primary)30" }}>
          {roleLabel}
        </span>
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {lang === "ru" ? "Нажми на фото чтобы изменить" : "Акс насб кунед"}
        </p>
      </div>

      {/* Info */}
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
            <Field label="Email" value={form.email} onChange={set("email")} type="email" />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <InfoRow label="Телефон" value={user.phone} />
            <InfoRow label={tr("auth.gender")} value={user.gender === "male" ? tr("auth.male") : tr("auth.female")} />
            {user.birthDate && <InfoRow label={tr("auth.birthDate")} value={user.birthDate} />}
            {user.email && <InfoRow label="Email" value={user.email} />}
            <InfoRow label={lang === "ru" ? "Регистрация" : "Сабт"} value={new Date(user.createdAt * 1000).toLocaleDateString("ru")} />
          </div>
        )}
      </div>

      <button onClick={handleLogout}
        className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 mb-6"
        style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
        <LogOut size={16} /> {tr("profile.logout")}
      </button>

      <footer className="text-center py-4" style={{ borderTop: "1px solid var(--border)" }}>
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

function InfoRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
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
