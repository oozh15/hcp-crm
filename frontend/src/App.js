import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000";


const S = {
  bg: "#F7F8FA", surface: "#FFFFFF", border: "#E4E7EC",
  primary: "#1E5ECC", primaryLight: "#EBF1FB", primaryText: "#0C3D8A",
  text: "#111827", muted: "#6B7280", hint: "#9CA3AF",
  success: "#0F6E56", successBg: "#E1F5EE",
  warn: "#BA7517", warnBg: "#FAEEDA",
  danger: "#A32D2D", dangerBg: "#FCEBEB",
  aiAccent: "#534AB7", aiBg: "#EEEDFE",
};

export default function App() {
  const [page, setPage] = useState("log");
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: S.bg, minHeight: "100vh" }}>
      {/* NAV */}
      <div style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 8, height: 52, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: S.primary, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
          <span style={{ color: "#fff", fontSize: 14 }}>+</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, marginRight: 16 }}>HCP CRM</span>
        {[["log", "Log Interaction"], ["chat", "AI Chat"], ["history", "History"]].map(([id, label]) => (
          <button key={id} onClick={() => setPage(id)} style={{
            padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: page === id ? S.primaryLight : "transparent",
            color: page === id ? S.primary : S.muted
          }}>{label}</button>
        ))}
        <div style={{ marginLeft: "auto", padding: "3px 10px", background: S.aiBg, color: S.aiAccent, borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
          ✦ gemma2-9b-it
        </div>
      </div>

      {page === "log" && <LogPage />}
      {page === "chat" && <ChatPage />}
      {page === "history" && <HistoryPage />}
    </div>
  );
}

// ─── LOG PAGE ────────────────────────────────────────────────────────────────
function LogPage() {
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState({
    hcp_name: "", interaction_type: "Meeting", date: today,
    time: nowTime, topics: "", sentiment: "Neutral",
    outcomes: "", follow_up: "", ai_suggestions: []
  });
  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiReply, setAiReply] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const autoFill = async () => {
    if (!aiInput.trim()) return;
    setLoading(true);
    setAiReply("");
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiInput })
      });
      const data = await res.json();
      console.log("AI response:", data);

      setForm(f => ({
        ...f,
        hcp_name: data.hcp_name || f.hcp_name,
        date: data.date || f.date,
        interaction_type: data.interaction_type || f.interaction_type,
        topics: data.topics || f.topics,
        sentiment: data.sentiment || f.sentiment,
        outcomes: data.outcomes || f.outcomes,
        follow_up: data.follow_up || f.follow_up,
        ai_suggestions: data.suggestions || []
      }));

      setAiReply(data.reply || "Form filled successfully!");
      setAiInput("");
    } catch (err) {
      console.error(err);
      setAiReply("Error connecting to backend. Check if server is running.");
    } finally {
      setLoading(false);
    }
  };

  const saveInteraction = async () => {
    try {
      const res = await fetch(`${API}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      console.log("Saved:", data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Could not save. Is backend running?");
    }
  };

  const clearForm = () => setForm({
    hcp_name: "", interaction_type: "Meeting", date: today,
    time: nowTime, topics: "", sentiment: "Neutral",
    outcomes: "", follow_up: "", ai_suggestions: []
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, padding: 20, maxWidth: 1100, margin: "0 auto" }}>

      {/* LEFT FORM */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: S.text }}>Log HCP Interaction</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          <div>
            <div style={labelStyle}>HCP Name</div>
            <input
              style={inputStyle}
              placeholder="Search or select HCP..."
              value={form.hcp_name}
              onChange={e => set("hcp_name", e.target.value)}
            />
          </div>

          <div>
            <div style={labelStyle}>Interaction Type</div>
            <select style={inputStyle} value={form.interaction_type} onChange={e => set("interaction_type", e.target.value)}>
              {["Meeting", "Call", "Visit", "Conference", "Email", "Advisory Board"].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={labelStyle}>Date</div>
            <input style={inputStyle} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>

          <div>
            <div style={labelStyle}>Time</div>
            <input style={inputStyle} type="time" value={form.time} onChange={e => set("time", e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / 3" }}>
            <div style={labelStyle}>Topics Discussed</div>
            <textarea
              style={{ ...inputStyle, height: 90, resize: "vertical" }}
              placeholder="Enter key discussion points..."
              value={form.topics}
              onChange={e => set("topics", e.target.value)}
            />
          </div>

        </div>

        {/* SENTIMENT */}
        <div style={{ marginTop: 14 }}>
          <div style={labelStyle}>Observed HCP Sentiment</div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            {[
              { v: "Positive", bg: S.successBg, color: S.success },
              { v: "Neutral", bg: S.warnBg, color: S.warn },
              { v: "Negative", bg: S.dangerBg, color: S.danger }
            ].map(o => (
              <button key={o.v} onClick={() => set("sentiment", o.v)} style={{
                padding: "6px 18px", borderRadius: 20, border: form.sentiment === o.v ? `2px solid ${o.color}` : `1px solid ${S.border}`,
                background: form.sentiment === o.v ? o.bg : S.surface,
                color: form.sentiment === o.v ? o.color : S.muted,
                cursor: "pointer", fontWeight: 500, fontSize: 13
              }}>{o.v}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
          <div>
            <div style={labelStyle}>Outcomes</div>
            <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Key outcomes or agreements..." value={form.outcomes} onChange={e => set("outcomes", e.target.value)} />
          </div>
          <div>
            <div style={labelStyle}>Follow-up Actions</div>
            <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} placeholder="Enter next steps or tasks..." value={form.follow_up} onChange={e => set("follow_up", e.target.value)} />
          </div>
        </div>

        {/* AI SUGGESTIONS */}
        {form.ai_suggestions.length > 0 && (
          <div style={{ marginTop: 16, padding: 14, background: S.aiBg, borderRadius: 9, border: `1px solid #C9C5F1` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.aiAccent, marginBottom: 8 }}>✦ AI Suggested Follow-ups</div>
            {form.ai_suggestions.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: S.aiAccent, marginBottom: 5 }}>→ {s}</div>
            ))}
          </div>
        )}

        {/* BUTTONS */}
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={clearForm} style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${S.border}`, background: S.surface, color: S.muted, cursor: "pointer", fontSize: 13 }}>
            Clear
          </button>
          <button onClick={saveInteraction} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: saved ? S.success : S.primary, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {saved ? "✓ Saved!" : "Save Interaction"}
          </button>
        </div>
      </div>

      {/* RIGHT AI PANEL */}
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20, position: "sticky", top: 72, height: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ background: S.aiBg, color: S.aiAccent, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✦ AI Assistant</span>
        </div>
        <div style={{ fontSize: 12, color: S.muted, marginBottom: 12 }}>Log interaction via chat</div>

        <div style={{ fontSize: 12, color: S.hint, background: S.bg, borderRadius: 7, padding: 10, marginBottom: 12, lineHeight: 1.6 }}>
          Example: "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure"
        </div>

        <textarea
          style={{ ...inputStyle, height: 110, resize: "none" }}
          placeholder="Describe interaction..."
          value={aiInput}
          onChange={e => setAiInput(e.target.value)}
        />

        {aiReply && (
          <div style={{ padding: "8px 12px", background: S.aiBg, borderRadius: 7, fontSize: 12, color: S.aiAccent, marginBottom: 10 }}>
            {aiReply}
          </div>
        )}

        <button
          onClick={autoFill}
          disabled={loading || !aiInput.trim()}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            background: loading ? S.hint : (!aiInput.trim() ? S.border : S.primary),
            color: "#fff", cursor: loading ? "wait" : "pointer", fontSize: 13, fontWeight: 600
          }}>
          {loading ? "⏳ Processing..." : "⚡ Auto Fill Form"}
        </button>

        <div style={{ marginTop: 16, padding: "10px 12px", background: S.bg, borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.muted, marginBottom: 8 }}>LANGGRAPH TOOLS</div>
          {["Log Interaction", "Edit Interaction", "Sentiment Analysis", "Follow-up Scheduler", "Material Recommender", "Compliance Check", "Entity Extractor", "History Retrieval", "Summarizer", "Rep Report"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.success, flexShrink: 0 }}></span>
              <span style={{ fontSize: 11, color: S.muted }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I'm your HCP AI assistant. Ask me to log interactions, retrieve history, suggest follow-ups, or analyze sentiment." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      const reply = data.reply || data.topics || JSON.stringify(data, null, 2);
      setMessages(m => [...m, { role: "ai", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "⚠️ Could not reach backend." }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = ["Summarize today's interactions", "Who did I meet last week?", "Suggest follow-ups for Dr. Sharma", "Show sentiment trend"];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 20, display: "flex", flexDirection: "column", height: "calc(100vh - 92px)" }}>
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px 12px 0 0", padding: "14px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>HCP AI Assistant</div>
        <div style={{ fontSize: 12, color: S.muted }}>LangGraph Agent · 10 tools connected</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: S.bg, padding: 16, display: "flex", flexDirection: "column", gap: 12, border: `1px solid ${S.border}`, borderTop: "none" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "75%", padding: "10px 14px",
              borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
              background: m.role === "user" ? S.primary : S.surface,
              color: m.role === "user" ? "#fff" : S.text,
              border: m.role === "ai" ? `1px solid ${S.border}` : "none",
              fontSize: 13.5, lineHeight: 1.6, whiteSpace: "pre-wrap"
            }}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px 12px 12px 4px", padding: "10px 16px", fontSize: 13, color: S.muted }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderTop: "none", padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => setInput(q)} style={{ fontSize: 11, padding: "4px 10px", border: `1px solid ${S.border}`, borderRadius: 20, background: S.surface, color: S.muted, cursor: "pointer" }}>
            {q}
          </button>
        ))}
      </div>

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "10px 14px", display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder="Ask AI or describe an interaction..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={send} disabled={!input.trim() || loading} style={{
          width: 42, height: 38, borderRadius: 8, border: "none",
          background: input.trim() ? S.primary : S.border, color: "#fff", cursor: "pointer", fontSize: 16
        }}>➤</button>
      </div>
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/history`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sentimentColor = s => s === "Positive" ? S.success : s === "Negative" ? S.danger : S.warn;
  const sentimentBg = s => s === "Positive" ? S.successBg : s === "Negative" ? S.dangerBg : S.warnBg;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Interaction History</h2>
      {loading && <div style={{ color: S.muted }}>Loading...</div>}
      {!loading && data.length === 0 && <div style={{ color: S.muted, padding: 20 }}>No interactions saved yet. Go to Log Interaction to add one.</div>}
      {data.map(item => (
        <div key={item.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{item.hcp_name || "Unknown HCP"}</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: sentimentBg(item.sentiment), color: sentimentColor(item.sentiment), fontWeight: 600 }}>
                {item.sentiment}
              </span>
              <span style={{ fontSize: 11, color: S.muted }}>{item.date}</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: S.primaryLight, color: S.primaryText, fontWeight: 600 }}>
                {item.interaction_type}
              </span>
            </div>
          </div>
          {item.topics && <div style={{ fontSize: 13, color: S.text, marginBottom: 6 }}><b>Topics:</b> {item.topics}</div>}
          {item.outcomes && <div style={{ fontSize: 13, color: S.muted }}><b>Outcomes:</b> {item.outcomes}</div>}
          {item.follow_up && <div style={{ fontSize: 13, color: S.muted }}><b>Follow-up:</b> {item.follow_up}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "9px 12px", border: `1px solid #E4E7EC`,
  borderRadius: 8, fontSize: 13, outline: "none",
  fontFamily: "'Segoe UI', sans-serif", color: "#111827",
  background: "#fff", boxSizing: "border-box", display: "block"
};

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: "#6B7280",
  letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 5
};