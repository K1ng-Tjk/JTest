import { useEffect, useState, useRef } from "react";
import { useStore } from "../store/useStore";
import { useT } from "../lib/i18n";
import { api } from "../lib/api";
import { MessageCircle, Send, Trash2, ChevronLeft, Users, User, Shield } from "lucide-react";
import { toast } from "sonner";

type ChatTab = "general" | "private" | "admin";

export default function ChatPage() {
  const { user, lang, theme } = useStore();
  const tr = useT(lang);
  const [tab, setTab] = useState<ChatTab>("general");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    api.getUsers().then((res: any) => setUsers(res.users || []));
  }, []);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [tab, selectedUser]);

  async function loadMessages() {
    if (!user) return;
    let params: any = { chatType: tab };
    if (tab === "private" && selectedUser) {
      params.userId = user.id;
      params.otherUserId = selectedUser.id;
    } else if (tab === "admin") {
      params.userId = user.id;
    }
    const res: any = await api.getMessages(params);
    if (res.messages) {
      setMessages(res.messages);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }

  async function sendMessage() {
    if (!text.trim() || !user) return;
    setLoading(true);
    const data: any = { chatType: tab, senderId: user.id, text: text.trim() };
    if (tab === "private" && selectedUser) data.receiverId = selectedUser.id;
    if (tab === "admin") {
      const admin = users.find(u => u.role === "admin");
      if (admin && user.role !== "admin") data.receiverId = admin.id;
    }
    await api.sendMessage(data);
    setText("");
    await loadMessages();
    setLoading(false);
  }

  async function deleteMessage(id: string) {
    if (user?.role !== "admin" && user?.role !== "manager") return;
    await api.deleteMessage(id);
    await loadMessages();
    toast.success("Удалено");
  }

  function getUserName(id: string) {
    const u = users.find(u => u.id === id);
    if (!u) return "Пользователь";
    return `${u.lastName} ${u.firstName}`;
  }

  const canDelete = user?.role === "admin" || user?.role === "manager";

  if (tab === "private" && !selectedUser) {
    return (
      <div data-theme={theme}>
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle size={22} style={{ color: "var(--primary)" }} />
          <h1 className="text-lg font-black">{tr("nav.chat")}</h1>
        </div>
        <ChatTabs tab={tab} setTab={setTab} tr={tr} />
        <p className="text-xs mb-3 mt-4" style={{ color: "var(--muted-foreground)" }}>Выберите собеседника</p>
        <div className="flex flex-col gap-2">
          {users.filter(u => u.id !== user?.id).map(u => (
            <button key={u.id} onClick={() => setSelectedUser(u)}
              className="rounded-2xl p-3 flex items-center gap-3 text-left transition-all active:scale-98"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm"
                style={{ background: "var(--primary)20", color: "var(--primary)" }}>
                {u.firstName[0]}{u.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{u.lastName} {u.firstName}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{u.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} className="flex flex-col" style={{ height: "calc(100vh - 70px)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {tab === "private" && selectedUser ? (
          <button onClick={() => setSelectedUser(null)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--secondary)" }}>
            <ChevronLeft size={18} />
          </button>
        ) : (
          <MessageCircle size={22} style={{ color: "var(--primary)" }} />
        )}
        <div className="flex-1">
          {tab === "private" && selectedUser ? (
            <p className="text-sm font-bold">{selectedUser.lastName} {selectedUser.firstName}</p>
          ) : (
            <h1 className="text-lg font-black">{tr("nav.chat")}</h1>
          )}
        </div>
      </div>

      <ChatTabs tab={tab} setTab={t => { setTab(t); setSelectedUser(null); }} tr={tr} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2 mt-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Нет сообщений</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
              <div className="max-w-[75%]">
                {!isMe && tab === "general" && (
                  <p className="text-[10px] mb-0.5 px-1" style={{ color: "var(--primary)" }}>
                    {getUserName(msg.senderId)}
                  </p>
                )}
                <div className="rounded-2xl px-3 py-2 relative"
                  style={{
                    background: isMe ? "var(--primary)" : "var(--card)",
                    color: isMe ? "var(--primary-foreground)" : "var(--foreground)",
                    border: isMe ? "none" : "1px solid var(--border)",
                    borderBottomRightRadius: isMe ? "4px" : "16px",
                    borderBottomLeftRadius: isMe ? "16px" : "4px",
                  }}>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-[9px] mt-0.5 opacity-60">
                    {new Date(msg.createdAt * 1000).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {canDelete && (
                  <button onClick={() => deleteMessage(msg.id)}
                    className="hidden group-hover:flex items-center gap-1 text-[10px] mt-0.5 px-2 py-0.5 rounded-lg"
                    style={{ color: "#EF4444", background: "rgba(239,68,68,0.1)" }}>
                    <Trash2 size={9} /> {tr("chat.delete")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={tr("chat.message")}
          className="flex-1 rounded-xl px-4 py-3 text-sm border outline-none"
          style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }} />
        <button onClick={sendMessage} disabled={loading || !text.trim()}
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{
            background: text.trim() ? "linear-gradient(135deg, var(--primary), var(--accent))" : "var(--secondary)",
            color: text.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)"
          }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function ChatTabs({ tab, setTab, tr }: any) {
  const tabs = [
    { id: "general", icon: <Users size={13} />, label: tr("chat.general").split(" ")[0] },
    { id: "private", icon: <User size={13} />, label: tr("chat.private").split(" ")[0] },
    { id: "admin", icon: <Shield size={13} />, label: "Админ" },
  ];
  return (
    <div className="flex rounded-xl overflow-hidden" style={{ background: "var(--secondary)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
          style={{
            background: tab === t.id ? "var(--primary)" : "transparent",
            color: tab === t.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
            borderRadius: "10px"
          }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}
