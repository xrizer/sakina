import { useState, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   Taaruf Syar'i — MVP Frontend Demo
   Single-file React demo covering the full PRD flow:
   Landing → Register → CV → Verifikasi Admin →
   Kandidat → Pengajuan → Room Chat Mediator → Admin
   All state is in-memory (demo / prototype).
   ───────────────────────────────────────────── */

const C = {
  emerald: "#0E4A3B",
  emeraldDark: "#093528",
  ivory: "#FAF7F0",
  card: "#FFFFFF",
  gold: "#C29B40",
  goldSoft: "#F1E6CB",
  ink: "#1C2422",
  muted: "#6B7A72",
  line: "#E5DECE",
  danger: "#9C3D2E",
  dangerSoft: "#F6E3DE",
  okSoft: "#E2EFE7",
};

const Star8 = ({ size = 16, color = C.gold, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
    <path
      d="M12 1.5l2.2 6.3 6.3-2.2-2.2 6.3 6.2 2.1-6.2 2.1 2.2 6.3-6.3-2.2-2.2 6.3-2.2-6.3-6.3 2.2 2.2-6.3L-0.5 14l6.2-2.1L3.5 5.6l6.3 2.2L12 1.5z"
      fill={color}
      transform="scale(0.92) translate(1,1)"
    />
  </svg>
);

const STATUS_USER = {
  draft: { label: "Draft", bg: "#EFEAE0", fg: C.muted },
  pending_verification: { label: "Menunggu Verifikasi", bg: C.goldSoft, fg: "#8A6B1F" },
  revision_required: { label: "Perlu Revisi", bg: "#FBEAD9", fg: "#9A5B17" },
  verified: { label: "Terverifikasi", bg: C.okSoft, fg: C.emerald },
  rejected: { label: "Ditolak", bg: C.dangerSoft, fg: C.danger },
};

const STATUS_REQ = {
  pending: { label: "Menunggu Respons", bg: C.goldSoft, fg: "#8A6B1F" },
  accepted: { label: "Diterima", bg: C.okSoft, fg: C.emerald },
  rejected: { label: "Ditolak", bg: C.dangerSoft, fg: C.danger },
};

const STATUS_ROOM = {
  active: { label: "Aktif", bg: C.okSoft, fg: C.emerald },
  completed: { label: "Selesai", bg: "#EFEAE0", fg: C.muted },
  closed: { label: "Ditutup Admin", bg: C.dangerSoft, fg: C.danger },
};

const Pill = ({ map, value }) => {
  const s = map[value] || { label: value, bg: "#EEE", fg: "#555" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        padding: "3px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {s.label}
    </span>
  );
};

/* ── Seed data ───────────────────────────── */
const seedUsers = [
  {
    id: 1, name: "Ahmad Fauzi", gender: "male", status: "verified", role: "user",
    cv: { nickname: "Ahmad", age: 28, domicile: "Jakarta Selatan", education: "S1 Teknik Informatika", occupation: "Software Engineer", marital: "Belum Menikah", summary: "Tenang, suka belajar, aktif kajian pekanan.", religious: "Shalat 5 waktu, tilawah rutin, kajian Sabtu pagi.", goal: "Menikah untuk menyempurnakan separuh agama.", readiness: "Siap menikah dalam 6 bulan ke depan.", preference: "Akhwat 23–28 th, paham agama, domisili Jabodetabek." },
  },
  {
    id: 2, name: "Fatimah Azzahra", gender: "female", status: "verified", role: "user",
    cv: { nickname: "Fatimah", age: 25, domicile: "Depok", education: "S1 Pendidikan", occupation: "Guru SD", marital: "Belum Menikah", summary: "Sabar, senang mengajar anak-anak.", religious: "Aktif kajian muslimah, hafalan 3 juz.", goal: "Membangun keluarga sakinah.", readiness: "Siap menikah tahun ini.", preference: "Ikhwan 25–32 th, bertanggung jawab, shalat terjaga." },
  },
  {
    id: 3, name: "Aisyah Putri", gender: "female", status: "verified", role: "user",
    cv: { nickname: "Aisyah", age: 27, domicile: "Bekasi", education: "S1 Akuntansi", occupation: "Staff Keuangan", marital: "Belum Menikah", summary: "Rapi, terorganisir, suka memasak.", religious: "Kajian online rutin, puasa sunnah.", goal: "Menikah dan membina rumah tangga islami.", readiness: "Siap dalam 1 tahun.", preference: "Ikhwan mapan secara agama dan tanggung jawab." },
  },
  {
    id: 4, name: "Umar Said", gender: "male", status: "pending_verification", role: "user",
    cv: { nickname: "Umar", age: 30, domicile: "Tangerang", education: "S1 Manajemen", occupation: "Wiraswasta", marital: "Belum Menikah", summary: "Pekerja keras.", religious: "Shalat 5 waktu.", goal: "Menikah.", readiness: "Siap.", preference: "Akhwat shalihah." },
  },
  { id: 99, name: "Admin Mediator", gender: "male", status: "verified", role: "admin", cv: null },
];

export default function TaarufApp() {
  const [view, setView] = useState("landing"); // landing | auth | app
  const [users, setUsers] = useState(seedUsers);
  const [currentId, setCurrentId] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [requests, setRequests] = useState([]); // {id, requesterId, receiverId, reason, status}
  const [rooms, setRooms] = useState([]); // {id, requestId, maleId, femaleId, status, note}
  const [messages, setMessages] = useState([]); // {id, roomId, senderId, text, ts}
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [toast, setToast] = useState(null);

  const me = users.find((u) => u.id === currentId) || null;
  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const updateUser = (id, patch) =>
    setUsers((us) => us.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  /* ── Auth (simulated) ── */
  const loginAs = (id) => { setCurrentId(id); setView("app"); setTab(users.find(u=>u.id===id)?.role==="admin" ? "admin-verify" : "dashboard"); };

  const registerUser = (form) => {
    const id = Math.max(...users.map((u) => u.id)) + 1;
    setUsers((us) => [...us, { id, name: form.name, gender: form.gender, status: "draft", role: "user", cv: null }]);
    setCurrentId(id);
    setView("app");
    setTab("cv");
    notify("Akun dibuat. Lengkapi CV Taaruf Anda.");
  };

  /* ── CV ── */
  const saveCV = (cv) => {
    updateUser(me.id, { cv, status: "pending_verification" });
    setTab("dashboard");
    notify("CV dikirim. Menunggu verifikasi admin.");
  };

  /* ── Pengajuan ── */
  const sendRequest = (receiverId, reason) => {
    if (requests.some((r) => r.requesterId === me.id && r.receiverId === receiverId && r.status === "pending"))
      return notify("Pengajuan ke kandidat ini masih menunggu respons.");
    if (rooms.some((r) => r.status === "active" && [r.maleId, r.femaleId].includes(me.id) && [r.maleId, r.femaleId].includes(receiverId)))
      return notify("Sudah ada room aktif dengan kandidat ini.");
    const id = requests.length + 1;
    setRequests((rs) => [...rs, { id, requesterId: me.id, receiverId, reason, status: "pending" }]);
    setSelectedCandidate(null);
    setTab("requests");
    notify("Pengajuan taaruf terkirim.");
  };

  const respondRequest = (reqId, accept) => {
    setRequests((rs) => rs.map((r) => (r.id === reqId ? { ...r, status: accept ? "accepted" : "rejected" } : r)));
    if (accept) {
      const req = requests.find((r) => r.id === reqId);
      const a = users.find((u) => u.id === req.requesterId);
      const b = users.find((u) => u.id === req.receiverId);
      const roomId = rooms.length + 1;
      setRooms((rm) => [...rm, {
        id: roomId, requestId: reqId,
        maleId: a.gender === "male" ? a.id : b.id,
        femaleId: a.gender === "female" ? a.id : b.id,
        status: "active", note: "",
      }]);
      setMessages((ms) => [...ms, {
        id: ms.length + 1, roomId, senderId: 99,
        text: "Assalamu'alaikum. Saya admin/mediator yang akan mendampingi proses taaruf ini. Silakan saling memperkenalkan diri dengan adab yang baik.",
        ts: Date.now(),
      }]);
      notify("Pengajuan diterima — Room Chat Mediator dibuat.");
    } else notify("Pengajuan ditolak.");
  };

  /* ── Chat ── */
  const sendMessage = (roomId, text) => {
    if (!text.trim()) return;
    setMessages((ms) => [...ms, { id: ms.length + 1, roomId, senderId: me.id, text: text.trim(), ts: Date.now() }]);
  };

  const closeRoom = (roomId, status) => {
    setRooms((rm) => rm.map((r) => (r.id === roomId ? { ...r, status } : r)));
    notify("Room ditutup. Riwayat chat tetap tersimpan.");
  };

  /* ── derived ── */
  const myRooms = me ? rooms.filter((r) => me.role === "admin" || [r.maleId, r.femaleId].includes(me.id)) : [];
  const incoming = me ? requests.filter((r) => r.receiverId === me.id) : [];
  const outgoing = me ? requests.filter((r) => r.requesterId === me.id) : [];
  const pendingUsers = users.filter((u) => u.status === "pending_verification" && u.role === "user");

  /* ───────────────────────── render ───────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: C.ivory, color: C.ink, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input, textarea, select { font-family: 'DM Sans', sans-serif; font-size: 14px; padding: 10px 12px; border: 1px solid ${C.line}; border-radius: 8px; width: 100%; background: #fff; color: ${C.ink}; outline: none; }
        input:focus, textarea:focus, select:focus { border-color: ${C.emerald}; box-shadow: 0 0 0 3px ${C.okSoft}; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: C.emeraldDark, color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
          {toast}
        </div>
      )}

      {view === "landing" && <Landing onStart={() => setView("auth")} />}
      {view === "auth" && <Auth users={users} onLogin={loginAs} onRegister={registerUser} onBack={() => setView("landing")} />}
      {view === "app" && me && (
        <AppShell
          me={me} tab={tab} setTab={setTab}
          onLogout={() => { setCurrentId(null); setView("landing"); }}
          counts={{ incoming: incoming.filter((r) => r.status === "pending").length, pending: pendingUsers.length, rooms: myRooms.filter(r=>r.status==="active").length }}
        >
          {me.role === "user" && tab === "dashboard" && <Dashboard me={me} outgoing={outgoing} incoming={incoming} rooms={myRooms} setTab={setTab} />}
          {me.role === "user" && tab === "cv" && <CVForm me={me} onSave={saveCV} />}
          {me.role === "user" && tab === "candidates" && (
            me.status === "verified"
              ? <Candidates me={me} users={users} onOpen={setSelectedCandidate} />
              : <Locked status={me.status} />
          )}
          {me.role === "user" && tab === "requests" && (
            <Requests me={me} users={users} incoming={incoming} outgoing={outgoing} onRespond={respondRequest} verified={me.status === "verified"} />
          )}
          {tab === "rooms" && (
            <Rooms me={me} users={users} rooms={myRooms} messages={messages} activeRoomId={activeRoomId} setActiveRoomId={setActiveRoomId} onSend={sendMessage} onClose={closeRoom} />
          )}
          {me.role === "admin" && tab === "admin-verify" && (
            <AdminVerify pendingUsers={pendingUsers} onDecide={(id, status, note) => { updateUser(id, { status }); notify(status === "verified" ? "User disetujui." : status === "revision_required" ? "Revisi diminta." : "User ditolak."); }} />
          )}
          {me.role === "admin" && tab === "admin-users" && <AdminUsers users={users.filter(u=>u.role==="user")} />}
          {selectedCandidate && (
            <CandidateModal candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} onPropose={sendRequest} />
          )}
        </AppShell>
      )}
    </div>
  );
}

/* ───────────────────── Landing ───────────────────── */
function Landing({ onStart }) {
  return (
    <div>
      <div style={{ background: C.emerald, color: C.ivory, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: `radial-gradient(${C.gold} 1.2px, transparent 1.2px)`, backgroundSize: "26px 26px" }} />
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
          <Brand light />
          <button onClick={onStart} style={btnGhostLight}>Masuk</button>
        </div>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "64px 24px 88px", textAlign: "center", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
            <Star8 size={14} /><Star8 size={20} /><Star8 size={14} />
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 600, lineHeight: 1.1, margin: 0 }}>
            Perkenalan menuju pernikahan,<br />dengan adab dan pendampingan.
          </h1>
          <p style={{ color: "#CFE0D6", maxWidth: 540, margin: "20px auto 32px", fontSize: 16, lineHeight: 1.6 }}>
            Platform taaruf syar'i dengan verifikasi admin dan Room Chat Mediator —
            setiap komunikasi didampingi, terarah, dan terdokumentasi.
          </p>
          <button onClick={onStart} style={{ ...btnPrimary, background: C.gold, color: C.emeraldDark, fontSize: 15, padding: "13px 32px" }}>
            Daftar Sekarang
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "56px 24px" }}>
        <h2 style={h2}>Cara Kerja</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            ["Isi CV Taaruf", "Lengkapi biodata asli dan CV taaruf Anda sebagai dasar proses perkenalan."],
            ["Verifikasi Admin", "Admin memeriksa data Anda terlebih dahulu. Tanpa verifikasi, fitur kandidat terkunci."],
            ["Ajukan Taaruf", "Lihat kandidat lawan jenis yang juga terverifikasi, lalu ajukan taaruf dengan alasan yang jelas."],
            ["Room Mediator", "Jika diterima, komunikasi berlangsung dalam satu room bersama admin/mediator."],
          ].map(([t, d], i) => (
            <div key={t} style={{ ...cardStyle, padding: 20 }}>
              <Star8 size={14} style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.55 }}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 48 }}>
          Bukan aplikasi dating bebas — fondasi proses taaruf yang terarah dan dipantau mediator.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────── Auth ───────────────────── */
function Auth({ users, onLogin, onRegister, onBack }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", gender: "male", domicile: "", password: "" });
  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 20px" }}>
      <button onClick={onBack} style={{ ...btnGhost, marginBottom: 18 }}>← Kembali</button>
      <div style={{ ...cardStyle, padding: 28 }}>
        <Brand />
        <div style={{ display: "flex", gap: 8, margin: "22px 0" }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid " + (mode === m ? C.emerald : C.line), background: mode === m ? C.emerald : "#fff", color: mode === m ? "#fff" : C.ink, fontWeight: 600, fontSize: 13 }}>
              {m === "login" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <div>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 0 }}>Demo: pilih akun untuk masuk.</p>
            {users.map((u) => (
              <button key={u.id} onClick={() => onLogin(u.id)} style={{ width: "100%", textAlign: "left", padding: "12px 14px", marginBottom: 8, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <b style={{ fontSize: 14 }}>{u.name}</b>
                  <span style={{ color: C.muted, fontSize: 12, marginLeft: 8 }}>{u.role === "admin" ? "Admin/Mediator" : u.gender === "male" ? "Ikhwan" : "Akhwat"}</span>
                </span>
                {u.role === "user" && <Pill map={STATUS_USER} value={u.status} />}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Nama Lengkap"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sesuai identitas" /></Field>
            <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></Field>
            <Field label="Nomor WhatsApp"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></Field>
            <Field label="Jenis Kelamin">
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="male">Laki-laki (Ikhwan)</option>
                <option value="female">Perempuan (Akhwat)</option>
              </select>
            </Field>
            <Field label="Domisili"><input value={form.domicile} onChange={(e) => setForm({ ...form, domicile: e.target.value })} placeholder="Kota domisili" /></Field>
            <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <button
              disabled={!form.name || !form.email}
              onClick={() => onRegister(form)}
              style={{ ...btnPrimary, opacity: !form.name || !form.email ? 0.5 : 1 }}
            >
              Buat Akun
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── App shell ───────────────────── */
function AppShell({ me, tab, setTab, onLogout, counts, children }) {
  const navUser = [
    ["dashboard", "Dashboard"],
    ["cv", "CV Taaruf"],
    ["candidates", "Kandidat"],
    ["requests", `Pengajuan${counts.incoming ? ` (${counts.incoming})` : ""}`],
    ["rooms", `Room${counts.rooms ? ` (${counts.rooms})` : ""}`],
  ];
  const navAdmin = [
    ["admin-verify", `Verifikasi${counts.pending ? ` (${counts.pending})` : ""}`],
    ["admin-users", "Pengguna"],
    ["rooms", `Room${counts.rooms ? ` (${counts.rooms})` : ""}`],
  ];
  const nav = me.role === "admin" ? navAdmin : navUser;
  return (
    <div>
      <header style={{ background: C.emerald, color: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <Brand light small />
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ opacity: 0.85 }}>{me.name}</span>
            {me.role === "user" && <Pill map={STATUS_USER} value={me.status} />}
            <button onClick={onLogout} style={btnGhostLight}>Keluar</button>
          </div>
        </div>
        <nav style={{ maxWidth: 960, margin: "0 auto", padding: "0 12px", display: "flex", gap: 2, overflowX: "auto" }}>
          {nav.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "10px 14px", border: "none", background: "transparent", color: tab === k ? "#fff" : "#A8C4B6",
              fontWeight: 600, fontSize: 13.5, borderBottom: `2.5px solid ${tab === k ? C.gold : "transparent"}`, whiteSpace: "nowrap",
            }}>{label}</button>
          ))}
        </nav>
      </header>
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "28px 20px 64px" }}>{children}</main>
    </div>
  );
}

/* ───────────────────── User: Dashboard ───────────────────── */
function Dashboard({ me, outgoing, incoming, rooms, setTab }) {
  const steps = [
    { done: true, label: "Akun terdaftar" },
    { done: !!me.cv, label: "CV Taaruf terisi" },
    { done: me.status === "verified", label: "Diverifikasi admin" },
  ];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...cardStyle, padding: 24, background: C.emeraldDark, color: "#fff", border: "none" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600 }}>
          Assalamu'alaikum, {me.cv?.nickname || me.name.split(" ")[0]}
        </div>
        <div style={{ fontSize: 13.5, color: "#BBD4C7", marginTop: 6 }}>
          {me.status === "verified"
            ? "Akun Anda terverifikasi. Anda dapat melihat kandidat dan mengajukan taaruf."
            : me.status === "pending_verification"
            ? "Data Anda sedang diperiksa admin. Fitur kandidat masih terkunci."
            : me.status === "revision_required"
            ? "Admin meminta revisi data. Silakan perbaiki CV dan kirim ulang."
            : "Lengkapi CV Taaruf untuk memulai proses verifikasi."}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 20 }}>
        <SectionTitle>Progres Akun</SectionTitle>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {steps.map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
              <span style={{ width: 20, height: 20, borderRadius: 999, display: "grid", placeItems: "center", background: s.done ? C.emerald : "#E8E2D4", color: "#fff", fontSize: 12 }}>{s.done ? "✓" : ""}</span>
              <span style={{ color: s.done ? C.ink : C.muted }}>{s.label}</span>
            </div>
          ))}
        </div>
        {!me.cv && <button onClick={() => setTab("cv")} style={{ ...btnPrimary, marginTop: 16 }}>Isi CV Taaruf</button>}
        {me.status === "revision_required" && <button onClick={() => setTab("cv")} style={{ ...btnPrimary, marginTop: 16 }}>Revisi CV</button>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Stat n={outgoing.length} label="Pengajuan terkirim" onClick={() => setTab("requests")} />
        <Stat n={incoming.filter((r) => r.status === "pending").length} label="Pengajuan masuk" onClick={() => setTab("requests")} />
        <Stat n={rooms.filter((r) => r.status === "active").length} label="Room aktif" onClick={() => setTab("rooms")} />
      </div>
    </div>
  );
}

const Stat = ({ n, label, onClick }) => (
  <button onClick={onClick} style={{ ...cardStyle, padding: 18, textAlign: "left", border: `1px solid ${C.line}`, background: "#fff" }}>
    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: C.emerald }}>{n}</div>
    <div style={{ fontSize: 12.5, color: C.muted }}>{label}</div>
  </button>
);

/* ───────────────────── User: CV Form ───────────────────── */
function CVForm({ me, onSave }) {
  const [cv, setCv] = useState(me.cv || { nickname: "", age: "", domicile: "", education: "", occupation: "", marital: "Belum Menikah", summary: "", religious: "", goal: "", readiness: "", preference: "" });
  const set = (k) => (e) => setCv({ ...cv, [k]: e.target.value });
  const required = ["nickname", "age", "domicile", "education", "occupation", "summary", "religious", "goal"];
  const complete = required.every((k) => String(cv[k]).trim());
  const pct = Math.round((required.filter((k) => String(cv[k]).trim()).length / required.length) * 100);

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={h2}>CV Taaruf Digital</h2>
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.muted, marginBottom: 6 }}>
            <span>Kelengkapan CV</span><span>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "#EFE9DB", borderRadius: 999 }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? C.emerald : C.gold, borderRadius: 999, transition: "width .3s" }} />
          </div>
        </div>

        <GroupLabel>Data Pribadi</GroupLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Nama Panggilan / Inisial"><input value={cv.nickname} onChange={set("nickname")} /></Field>
          <Field label="Usia"><input type="number" value={cv.age} onChange={set("age")} /></Field>
          <Field label="Domisili"><input value={cv.domicile} onChange={set("domicile")} /></Field>
          <Field label="Status Pernikahan">
            <select value={cv.marital} onChange={set("marital")}>
              <option>Belum Menikah</option><option>Duda</option><option>Janda</option>
            </select>
          </Field>
          <Field label="Pendidikan Terakhir"><input value={cv.education} onChange={set("education")} /></Field>
          <Field label="Pekerjaan"><input value={cv.occupation} onChange={set("occupation")} /></Field>
        </div>

        <GroupLabel>Kepribadian & Keagamaan</GroupLabel>
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Ringkasan Kepribadian"><textarea rows={2} value={cv.summary} onChange={set("summary")} /></Field>
          <Field label="Aktivitas Ibadah & Kajian"><textarea rows={2} value={cv.religious} onChange={set("religious")} /></Field>
        </div>

        <GroupLabel>Visi Pernikahan</GroupLabel>
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Tujuan Menikah"><textarea rows={2} value={cv.goal} onChange={set("goal")} /></Field>
          <Field label="Kesiapan Menikah"><input value={cv.readiness} onChange={set("readiness")} placeholder="Contoh: siap dalam 6 bulan" /></Field>
          <Field label="Preferensi Pasangan"><textarea rows={2} value={cv.preference} onChange={set("preference")} /></Field>
        </div>

        <button disabled={!complete} onClick={() => onSave(cv)} style={{ ...btnPrimary, marginTop: 22, width: "100%", opacity: complete ? 1 : 0.5 }}>
          {me.status === "revision_required" ? "Kirim Ulang untuk Verifikasi" : "Ajukan Verifikasi"}
        </button>
        <p style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10 }}>
          Setelah dikirim, admin akan memeriksa data Anda sebelum fitur kandidat dibuka.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────── Locked gate ───────────────────── */
function Locked({ status }) {
  return (
    <div style={{ ...cardStyle, padding: 40, textAlign: "center", maxWidth: 520, margin: "40px auto" }}>
      <Star8 size={26} style={{ marginBottom: 14 }} />
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, margin: "0 0 8px" }}>Fitur Kandidat Terkunci</h3>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>
        Akun Anda {status === "pending_verification" ? "sedang menunggu verifikasi admin" : status === "rejected" ? "tidak disetujui untuk fitur taaruf" : "belum diverifikasi"}.
        Daftar kandidat, pengajuan taaruf, dan room hanya tersedia untuk akun terverifikasi.
      </p>
    </div>
  );
}

/* ───────────────────── Candidates ───────────────────── */
function Candidates({ me, users, onOpen }) {
  const [fDom, setFDom] = useState("");
  const [fAge, setFAge] = useState("");
  const list = users.filter((u) =>
    u.role === "user" && u.status === "verified" && u.gender !== me.gender && u.cv &&
    (!fDom || u.cv.domicile.toLowerCase().includes(fDom.toLowerCase())) &&
    (!fAge || Number(u.cv.age) <= Number(fAge))
  );
  return (
    <div>
      <h2 style={h2}>Kandidat {me.gender === "male" ? "Akhwat" : "Ikhwan"}</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input style={{ maxWidth: 220 }} placeholder="Filter domisili…" value={fDom} onChange={(e) => setFDom(e.target.value)} />
        <input style={{ maxWidth: 160 }} type="number" placeholder="Usia maks." value={fAge} onChange={(e) => setFAge(e.target.value)} />
      </div>
      {list.length === 0 && <p style={{ color: C.muted, fontSize: 14 }}>Belum ada kandidat yang cocok dengan filter. Coba longgarkan kriteria.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {list.map((u) => (
          <div key={u.id} style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: C.goldSoft, display: "grid", placeItems: "center", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: C.emerald }}>
                {u.cv.nickname[0]}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{u.cv.nickname}, {u.cv.age}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}>{u.cv.domicile}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 14 }}>
              {u.cv.education} · {u.cv.occupation} · {u.cv.marital}
            </div>
            <button onClick={() => onOpen(u)} style={{ ...btnOutline, width: "100%" }}>Lihat Profil Terbatas</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CandidateModal({ candidate, onClose, onPropose }) {
  const [reason, setReason] = useState("");
  const [proposing, setProposing] = useState(false);
  const cv = candidate.cv;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,30,26,.55)", zIndex: 80, display: "grid", placeItems: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...cardStyle, padding: 26, maxWidth: 520, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700 }}>{cv.nickname}, {cv.age}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{cv.domicile} · {cv.marital}</div>
          </div>
          <button onClick={onClose} style={btnGhost}>✕</button>
        </div>
        <Divider />
        {[
          ["Pendidikan & Pekerjaan", `${cv.education} — ${cv.occupation}`],
          ["Kepribadian", cv.summary],
          ["Ibadah & Kajian", cv.religious],
          ["Tujuan Menikah", cv.goal],
          ["Kesiapan", cv.readiness],
          ["Preferensi Pasangan", cv.preference],
        ].map(([t, v]) => (
          <div key={t} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: C.gold }}>{t}</div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{v}</div>
          </div>
        ))}
        <Divider />
        {!proposing ? (
          <button onClick={() => setProposing(true)} style={{ ...btnPrimary, width: "100%" }}>Ajukan Taaruf</button>
        ) : (
          <div>
            <Field label="Alasan Pengajuan (wajib)">
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sampaikan alasan Anda mengajukan taaruf dengan sopan…" />
            </Field>
            <button disabled={!reason.trim()} onClick={() => onPropose(candidate.id, reason.trim())} style={{ ...btnPrimary, width: "100%", marginTop: 12, opacity: reason.trim() ? 1 : 0.5 }}>
              Kirim Pengajuan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Requests ───────────────────── */
function Requests({ me, users, incoming, outgoing, onRespond, verified }) {
  const nameOf = (id) => users.find((u) => u.id === id)?.cv?.nickname || users.find((u) => u.id === id)?.name || "—";
  if (!verified) return <Locked status={me.status} />;
  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 680 }}>
      <div>
        <h2 style={h2}>Pengajuan Masuk</h2>
        {incoming.length === 0 && <Empty>Belum ada pengajuan masuk.</Empty>}
        {incoming.map((r) => (
          <div key={r.id} style={{ ...cardStyle, padding: 18, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <b>Dari: {nameOf(r.requesterId)}</b>
              <Pill map={STATUS_REQ} value={r.status} />
            </div>
            <p style={{ fontSize: 13.5, color: C.muted, margin: "8px 0 12px", fontStyle: "italic" }}>"{r.reason}"</p>
            {r.status === "pending" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => onRespond(r.id, true)} style={btnPrimary}>Terima</button>
                <button onClick={() => onRespond(r.id, false)} style={btnDangerOutline}>Tolak</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div>
        <h2 style={h2}>Pengajuan Terkirim</h2>
        {outgoing.length === 0 && <Empty>Anda belum mengirim pengajuan. Buka halaman Kandidat untuk memulai.</Empty>}
        {outgoing.map((r) => (
          <div key={r.id} style={{ ...cardStyle, padding: 18, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <b>Kepada: {nameOf(r.receiverId)}</b>
            <Pill map={STATUS_REQ} value={r.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────── Rooms ───────────────────── */
function Rooms({ me, users, rooms, messages, activeRoomId, setActiveRoomId, onSend, onClose }) {
  const room = rooms.find((r) => r.id === activeRoomId);
  if (room) return <ChatRoom me={me} users={users} room={room} messages={messages.filter((m) => m.roomId === room.id)} onSend={onSend} onClose={onClose} onBack={() => setActiveRoomId(null)} />;
  const nameOf = (id) => users.find((u) => u.id === id)?.cv?.nickname || users.find((u) => u.id === id)?.name;
  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={h2}>Room Chat Mediator</h2>
      {rooms.length === 0 && <Empty>Belum ada room. Room dibuat otomatis setelah pengajuan taaruf diterima.</Empty>}
      {rooms.map((r) => (
        <button key={r.id} onClick={() => setActiveRoomId(r.id)} style={{ ...cardStyle, padding: 18, marginBottom: 10, width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", flexWrap: "wrap", gap: 8 }}>
          <span>
            <b>Room #{r.id}</b>
            <span style={{ color: C.muted, fontSize: 13, marginLeft: 8 }}>{nameOf(r.maleId)} × {nameOf(r.femaleId)} + Mediator</span>
          </span>
          <Pill map={STATUS_ROOM} value={r.status} />
        </button>
      ))}
    </div>
  );
}

function ChatRoom({ me, users, room, messages, onSend, onClose, onBack }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages.length]);
  const senderOf = (id) => users.find((u) => u.id === id);
  const active = room.status === "active";
  const isAdmin = me.role === "admin";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <button onClick={onBack} style={btnGhost}>← Daftar Room</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill map={STATUS_ROOM} value={room.status} />
          {isAdmin && active && (
            <>
              <button onClick={() => onClose(room.id, "completed")} style={btnOutline}>Tandai Selesai</button>
              <button onClick={() => onClose(room.id, "closed")} style={btnDangerOutline}>Tutup Room</button>
            </>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
        <div style={{ background: C.emerald, color: "#fff", padding: "12px 18px", fontSize: 13.5 }}>
          <b>Room Taaruf #{room.id}</b> — komunikasi didampingi admin/mediator. Jaga adab dan fokus pada tujuan taaruf.
        </div>
        <div style={{ height: 380, overflowY: "auto", padding: 18, background: "#FCFAF5", display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((m) => {
            const s = senderOf(m.senderId);
            const mine = m.senderId === me.id;
            const adminMsg = s?.role === "admin";
            return (
              <div key={m.id} style={{ alignSelf: adminMsg ? "center" : mine ? "flex-end" : "flex-start", maxWidth: adminMsg ? "92%" : "78%" }}>
                {adminMsg ? (
                  <div style={{ background: C.goldSoft, border: `1px solid ${C.gold}40`, borderRadius: 10, padding: "10px 14px", fontSize: 13, textAlign: "center", color: "#6B541E" }}>
                    <b style={{ display: "block", fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Mediator</b>
                    {m.text}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, margin: mine ? "0 4px 3px auto" : "0 0 3px 4px", textAlign: mine ? "right" : "left" }}>
                      {s?.cv?.nickname || s?.name}
                    </div>
                    <div style={{ background: mine ? C.emerald : "#fff", color: mine ? "#fff" : C.ink, border: mine ? "none" : `1px solid ${C.line}`, padding: "9px 13px", borderRadius: mine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: 14, lineHeight: 1.5 }}>
                      {m.text}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, padding: 12, display: "flex", gap: 8, background: "#fff" }}>
          {active ? (
            <>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { onSend(room.id, text); setText(""); } }}
                placeholder={isAdmin ? "Kirim arahan sebagai mediator…" : "Tulis pesan…"}
              />
              <button onClick={() => { onSend(room.id, text); setText(""); }} style={btnPrimary}>Kirim</button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: C.muted, padding: "8px 4px", width: "100%", textAlign: "center" }}>
              Room sudah ditutup — riwayat chat tersimpan dan hanya dapat dibaca.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Admin ───────────────────── */
function AdminVerify({ pendingUsers, onDecide }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={h2}>Verifikasi Pengguna</h2>
      {pendingUsers.length === 0 && <Empty>Tidak ada pengguna yang menunggu verifikasi.</Empty>}
      {pendingUsers.map((u) => (
        <div key={u.id} style={{ ...cardStyle, padding: 18, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <b>{u.name}</b>
              <span style={{ fontSize: 12.5, color: C.muted, marginLeft: 8 }}>{u.gender === "male" ? "Ikhwan" : "Akhwat"}</span>
            </div>
            <button onClick={() => setOpen(open === u.id ? null : u.id)} style={btnOutline}>
              {open === u.id ? "Tutup Detail" : "Review Biodata & CV"}
            </button>
          </div>
          {open === u.id && u.cv && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${C.line}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 10, fontSize: 13.5, marginBottom: 16 }}>
                {Object.entries({ Panggilan: u.cv.nickname, Usia: u.cv.age, Domisili: u.cv.domicile, Pendidikan: u.cv.education, Pekerjaan: u.cv.occupation, Status: u.cv.marital, Kepribadian: u.cv.summary, Ibadah: u.cv.religious, Tujuan: u.cv.goal }).map(([k, v]) => (
                  <div key={k}><span style={{ color: C.muted, fontSize: 11.5, display: "block" }}>{k}</span>{v}</div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => onDecide(u.id, "verified")} style={btnPrimary}>Setujui</button>
                <button onClick={() => onDecide(u.id, "revision_required")} style={btnOutline}>Minta Revisi</button>
                <button onClick={() => onDecide(u.id, "rejected")} style={btnDangerOutline}>Tolak</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminUsers({ users }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={h2}>Daftar Pengguna</h2>
      <div style={{ ...cardStyle, overflow: "hidden" }}>
        {users.map((u, i) => (
          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i ? `1px solid ${C.line}` : "none", flexWrap: "wrap", gap: 8 }}>
            <div>
              <b style={{ fontSize: 14 }}>{u.name}</b>
              <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{u.gender === "male" ? "Ikhwan" : "Akhwat"}{u.cv ? ` · ${u.cv.domicile}` : ""}</span>
            </div>
            <Pill map={STATUS_USER} value={u.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────── shared bits ───────────────────── */
const Brand = ({ light, small }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
    <Star8 size={small ? 18 : 22} color={C.gold} />
    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: small ? 19 : 22, color: light ? "#fff" : C.emerald, letterSpacing: 0.3 }}>
      Taaruf Syar'i
    </span>
  </div>
);

const Field = ({ label, children }) => (
  <label style={{ display: "block" }}>
    <span style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, display: "block", marginBottom: 5 }}>{label}</span>
    {children}
  </label>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold }}>{children}</div>
);
const GroupLabel = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.gold, margin: "20px 0 10px" }}>{children}</div>
);
const Divider = () => <hr style={{ border: "none", borderTop: `1px solid ${C.line}`, margin: "16px 0" }} />;
const Empty = ({ children }) => (
  <div style={{ ...cardStyle, padding: 24, textAlign: "center", color: C.muted, fontSize: 13.5 }}>{children}</div>
);

const h2 = { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, margin: "0 0 16px", color: C.emeraldDark };
const cardStyle = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, boxShadow: "0 1px 3px rgba(28,36,34,.05)" };
const btnPrimary = { background: C.emerald, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 9, fontWeight: 600, fontSize: 13.5 };
const btnOutline = { background: "#fff", color: C.emerald, border: `1.5px solid ${C.emerald}`, padding: "9px 18px", borderRadius: 9, fontWeight: 600, fontSize: 13 };
const btnDangerOutline = { background: "#fff", color: C.danger, border: `1.5px solid ${C.danger}`, padding: "9px 18px", borderRadius: 9, fontWeight: 600, fontSize: 13 };
const btnGhost = { background: "transparent", border: "none", color: C.muted, fontSize: 13.5, fontWeight: 600, padding: "6px 8px" };
const btnGhostLight = { background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 8 };
