import dynamic from 'next/dynamic'
import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const APP_PW = "Galvany_Pro_2026";
const LOGO = "https://a.storyblok.com/f/288501411354765/100x16/c83867ff16/galvany-logo.svg";
const G = { bg:"#0a0a0a", cd:"#141414", cd2:"#1c1c1c", ac:"#5bffa0", t1:"#ffffff", t2:"#888888", red:"#ff4d4d", amber:"#f59e0b", ft:"'Inter',system-ui,sans-serif" };

const SCENARIOS = {
  einwand:  { title:"Einwandbehandlung",  icon:"🛡️", desc:"Kundeneinwände souverän entkräften",    sys:`Du bist ein skeptischer Kunde (Einkaufsleiter, Maschinenbau, 200 MA). Deutsch, max 2-3 Sätze. Einwände: "Zu teuer","Haben Anbieter","Muss Chef fragen","Kein Budget","Schicken Sie Unterlagen". Gute Argumente=offener. Schlechte=abweisender. Starte mit Begrüßung+Einwand.`, crit:["Einwand-Umwandlung","Nutzenargumentation","Empathie","Fragetechnik","Lösungsorientierung"], tips:["Bestätige erst den Einwand: 'Ich verstehe...'","Gegenfrage statt Widerspruch","Bumerang: 'Gerade weil...'","Frage nach dem wahren Grund","Umwandeln: 'Was wäre wenn...?'"] },
  abschluss:{ title:"Abschlusstechniken", icon:"🎯", desc:"Abschlüsse gezielt herbeiführen",         sys:`Du bist interessierter aber unentschlossener Kunde (GF, IT, 80 MA). Deutsch, max 2-3 Sätze. Du zögerst. Gib Kaufsignale. Bei guten Abschlusstechniken=kaufbereit. Starte: "Ihr Angebot ist interessant, aber..."`, crit:["Kaufsignale erkennen","Alternativtechnik","Zusammenfassung","Verbindlichkeit","Timing"], tips:["Alternativfrage: 'Variante A oder B?'","Vorteile zusammenfassen","Sanfte Dringlichkeit","Probeabschluss","Zukunft visualisieren"] },
  bedarf:   { title:"Bedarfsanalyse",     icon:"🔍", desc:"Bedürfnisse systematisch ermitteln",     sys:`Du bist GF (Handel, 50 MA). Deutsch, max 2-3 Sätze. Situation (nur bei gezielter Frage preisgeben): Excel-Chaos, 2 MA gekündigt, Umsatz 8Mio (Ziel 12), Budget 50-80k, Audit in 6M. Offene Fragen=ausführlich. Geschlossene=knapp. Starte: "Man sagte mir Sie könnten helfen. Wir haben Herausforderungen..."`, crit:["Offene Fragen","Aktives Zuhören","Bedarfstiefe","Strukturierung","Zusammenfassung"], tips:["W-Fragen: Was, Wie, Warum","Spiegeln was Kunde sagte","Nach Zahlen fragen","Vertiefen: 'Was bedeutet das?'","'Wenn ich richtig verstehe...'"] }
};

const EVAL_P = `Bewerte den VERKÄUFER. Szenario: {s}. Kriterien: {c}.
Gespräch:
{conv}
NUR JSON (kein Markdown):
{"gesamtpunktzahl":65,"kriterien":[{"name":"...","punkte":70,"feedback":"1 konkreter Satz","deficit":false}],"staerken":["..."],"verbesserungen":["..."],"handlungsempfehlungen":["Konkrete Übung 1","Konkrete Übung 2"],"gesamtfeedback":"2-3 Sätze","level":"Fortgeschritten"}`;

const COMPARE_P = `Vergleiche zwei Gespräche desselben Verkäufers.
GESPRÄCH 1: {conv1}
BEWERTUNG 1: {eval1}
GESPRÄCH 2: {conv2}
BEWERTUNG 2: {eval2}
NUR JSON:
{"verbesserungen":["..."],"verschlechtert":["..."],"neueDefizite":["..."],"gelosteDefizite":["..."],"gesamtentwicklung":"2-3 Sätze","empfehlungen":["...", "..."]}`;

const scoreColor = s => s >= 70 ? G.ac : s >= 50 ? G.amber : G.red;

function BarFill({ val, prev }) {
  const c = scoreColor(val);
  const diff = prev !== undefined ? val - prev : null;
  return (
    <div>
      <div style={{ background:"#111", borderRadius:2, height:8, overflow:"hidden", position:"relative" }}>
        {prev !== undefined && <div style={{ position:"absolute", height:"100%", width:prev+"%", background:"#2a2a2a", borderRadius:2 }} />}
        <div style={{ position:"absolute", height:"100%", width:val+"%", background:c, borderRadius:2, transition:"width 1.2s ease" }} />
      </div>
      {diff !== null && <span style={{ fontSize:11, color: diff > 0 ? G.ac : diff < 0 ? G.red : G.t2, fontWeight:700, marginLeft:4 }}>{diff > 0 ? "+"+diff : diff === 0 ? "±0" : diff}</span>}
    </div>
  );
}

function SimpleBars({ val }) {
  const c = scoreColor(val);
  return <div style={{ background:"#111", borderRadius:2, height:8, overflow:"hidden" }}><div style={{ height:"100%", width:val+"%", background:c, borderRadius:2, transition:"width 1.2s" }} /></div>;
}

function Logo() {
  return <img src={LOGO} alt="GALVANY" style={{ height:16, filter:"brightness(0) invert(1)" }} />;
}

function Divider() {
  return <span style={{ width:1, height:14, background:"#333", display:"inline-block" }} />;
}

function App() {
  const [scr, setScr] = useState("login");
  const [sc, setSc] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState("");
  const [ld, setLd] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [hasMic, setHasMic] = useState(true);
  const [ev, setEv] = useState(null);
  const [evLd, setEvLd] = useState(false);
  const [turns, setTurns] = useState(0);
  const [tip, setTip] = useState(null);
  const [name, setName] = useState("");
  const [hist, setHist] = useState([]);
  const [pw, setPw] = useState("");
  const [pwE, setPwE] = useState(false);
  const [emailInp, setEmailInp] = useState("");
  const [emailE, setEmailE] = useState("");
  const [key, setKey] = useState("");
  const [keyInp, setKeyInp] = useState("");
  const [keyE, setKeyE] = useState("");
  const [dashTab, setDashTab] = useState("overview");
  const [dashPeriod, setDashPeriod] = useState("all");
  const [quota, setQuota] = useState({ daily:1, weekly:3, monthly:10, targetScore:70 });
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("all");
  const endRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    const S = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!S) { setHasMic(false); return; }
    const r = new S(); r.lang = "de-DE"; r.continuous = false; r.interimResults = false;
    r.onresult = e => setInp(p => (p ? p + " " : "") + e.results[0][0].transcript);
    r.onend = () => setMicOn(false); r.onerror = () => setMicOn(false);
    recRef.current = r;
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs, ld]);

  const togMic = () => { if (!recRef.current) return; micOn ? recRef.current.stop() : (recRef.current.start(), setMicOn(true)); };

  const gem = async (contents, sys) => {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + key, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ system_instruction:{ parts:[{ text:sys }] }, contents, generationConfig:{ temperature:0.85, maxOutputTokens:600 } })
      });
      const d = await r.json();
      if (d.error) return "⚠️ " + d.error.message;
      return d.candidates?.[0]?.content?.parts?.[0]?.text || "Keine Antwort.";
    } catch { return "⚠️ Verbindungsfehler."; }
  };

  const handleLogin = () => {
    const trimmed = emailInp.trim().toLowerCase();
    const eOk = /^[^\s@]+@galvany-expert\.de$/.test(trimmed);
    const pOk = pw === APP_PW;
    setEmailE(eOk ? "" : "Nur @galvany-expert.de E-Mail-Adressen sind erlaubt.");
    setPwE(!pOk);
    if (eOk && pOk) {
      const local = trimmed.split("@")[0];
      const n = local.split(".").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      setName(n);
      setScr(key ? "home" : "setup");
    }
  };

  const testKey = async () => {
    setKeyE("");
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + keyInp, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ contents:[{ role:"user", parts:[{ text:"OK" }] }], generationConfig:{ maxOutputTokens:5 } })
      });
      const d = await r.json();
      if (d.error) { setKeyE("Ungültiger Key: " + d.error.message); return; }
      setKey(keyInp); setScr("home");
    } catch { setKeyE("Verbindungsfehler."); }
  };

  const startSc = async (k) => {
    setSc(k); setMsgs([]); setTurns(0); setEv(null); setTip(null); setScr("chat"); setLd(true);
    const reply = await gem([{ role:"user", parts:[{ text:"Starte das Gespräch." }] }], SCENARIOS[k].sys);
    setMsgs([{ role:"a", text:reply }]); setLd(false);
  };

  const send = async () => {
    const t = inp.trim(); if (!t || ld) return; setInp("");
    const nm = [...msgs, { role:"u", text:t }]; setMsgs(nm);
    const nt = turns + 1; setTurns(nt); setLd(true); setTip(null);
    const contents = nm.map(m => ({ role: m.role === "u" ? "user" : "model", parts:[{ text:m.text }] }));
    const reply = await gem(contents, SCENARIOS[sc].sys);
    setMsgs([...nm, { role:"a", text:reply }]); setLd(false);
    const tips = SCENARIOS[sc].tips;
    setTip(tips[Math.min(nt - 1, tips.length - 1)]);
  };

  const endEval = async () => {
    setEvLd(true); setScr("eval");
    const s = SCENARIOS[sc];
    const conv = msgs.map(m => (m.role === "u" ? "VERKÄUFER" : "KUNDE") + ": " + m.text).join("\n");
    const p = EVAL_P.replace("{s}", s.title).replace("{c}", s.crit.join(", ")).replace("{conv}", conv);
    const raw = await gem([{ role:"user", parts:[{ text:p }] }], "Antworte NUR mit validem JSON.");
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setEv(parsed);
      setHist(h => [...h, {
        id: Date.now(), date: new Date().toISOString(), dateStr: new Date().toLocaleString("de-DE"),
        scenario: s.title, scKey: sc, score: parsed.gesamtpunktzahl, level: parsed.level,
        turns, name, kriterien: parsed.kriterien, staerken: parsed.staerken,
        verbesserungen: parsed.verbesserungen, handlungsempfehlungen: parsed.handlungsempfehlungen || [],
        gesamtfeedback: parsed.gesamtfeedback, conv, evalRaw: JSON.stringify(parsed)
      }]);
    } catch {
      setEv({ gesamtpunktzahl:0, kriterien: s.crit.map(c => ({ name:c, punkte:0, feedback:"Fehler", deficit:true })), staerken:["—"], verbesserungen:["Erneut versuchen"], handlungsempfehlungen:[], gesamtfeedback:"Auswertung fehlgeschlagen.", level:"N/A" });
    }
    setEvLd(false);
  };

  const runCompare = async () => {
    if (!compareA || !compareB) return;
    setCompareLoading(true);
    const a = hist.find(h => h.id === compareA);
    const b = hist.find(h => h.id === compareB);
    if (!a || !b) { setCompareLoading(false); return; }
    const p = COMPARE_P.replace("{conv1}", a.conv).replace("{eval1}", a.evalRaw).replace("{conv2}", b.conv).replace("{eval2}", b.evalRaw);
    const raw = await gem([{ role:"user", parts:[{ text:p }] }], "Antworte NUR mit validem JSON.");
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      setCompareResult({ a, b, analysis: parsed });
    } catch {
      setCompareResult({ a, b, analysis:{ verbesserungen:[], verschlechtert:[], neueDefizite:[], gelosteDefizite:[], gesamtentwicklung:"Vergleich fehlgeschlagen.", empfehlungen:[] } });
    }
    setCompareLoading(false);
  };

  const filtHist = (period, user) => {
    const now = new Date();
    return hist.filter(h => {
      const d = new Date(h.date);
      let pOk = true;
      if (period === "today") pOk = d.toDateString() === now.toDateString();
      else if (period === "week") { const w = new Date(now); w.setDate(now.getDate() - 7); pOk = d >= w; }
      else if (period === "month") { const m = new Date(now); m.setMonth(now.getMonth() - 1); pOk = d >= m; }
      return pOk && (user === "all" || h.name === user);
    });
  };

  const allUsers = [...new Set(hist.map(h => h.name))];

  const getEmpStats = () => {
    const fh = filtHist(dashPeriod, selectedUser);
    const byName = {};
    fh.forEach(h => {
      if (!byName[h.name]) byName[h.name] = { scores:[], count:0, all:[] };
      byName[h.name].scores.push(h.score);
      byName[h.name].count++;
      byName[h.name].all.push(h);
    });
    return Object.entries(byName).map(([n, d]) => ({
      name: n,
      avg: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length),
      count: d.count,
      best: Math.max(...d.scores),
      worst: Math.min(...d.scores),
      trend: d.all.length >= 2 ? d.all[d.all.length - 1].score - d.all[0].score : null,
      all: d.all
    }));
  };

  const getUserProgress = (userName) => {
    return hist.filter(h => h.name === userName).sort((a, b) => new Date(a.date) - new Date(b.date)).map((h, i) => ({ ...h, run: i + 1 }));
  };

  const empStats = getEmpStats();
  const inputStyle = { width:"100%", background:"#0a0a0a", border:"1px solid #2a2a2a", borderRadius:2, padding:"11px 14px", color:G.t1, fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:G.ft };
  const card = (extra) => ({ border:"1px solid #1a1a1a", borderRadius:4, background:G.cd, ...extra });
  const gBtn = (active) => ({ background: active ? G.ac : "transparent", color: active ? "#000" : G.t2, border: "1px solid " + (active ? G.ac : "#2a2a2a"), borderRadius:2, padding:"5px 12px", fontSize:11, fontWeight:600, cursor:"pointer" });

  // LOGIN
  if (scr === "login") return (
    <div style={{ background:G.bg, minHeight:"100vh", color:G.t1, fontFamily:G.ft, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ maxWidth:420, width:"100%", padding:"0 24px" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <Logo />
          <div style={{ width:40, height:1, background:"#222", margin:"20px auto 20px" }} />
          <p style={{ color:G.t2, fontSize:12, margin:0, letterSpacing:2, textTransform:"uppercase" }}>Verkaufstrainer</p>
        </div>
        <div style={{ ...card({ padding:32 }) }}>
          <label style={{ fontSize:11, color:G.t2, fontWeight:600, display:"block", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Firmen-E-Mail</label>
          <input type="email" value={emailInp} onChange={e => setEmailInp(e.target.value)} placeholder="vorname@galvany-expert.de" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {emailE && <div style={{ color:G.red, fontSize:12, marginTop:6 }}>{emailE}</div>}
          <label style={{ fontSize:11, color:G.t2, fontWeight:600, display:"block", margin:"20px 0 8px", letterSpacing:1, textTransform:"uppercase" }}>Passwort</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {pwE && <div style={{ color:G.red, fontSize:12, marginTop:6 }}>Falsches Passwort.</div>}
          <button onClick={handleLogin} style={{ background:G.ac, color:"#000", border:"none", borderRadius:2, padding:"14px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%", marginTop:24 }}>Einloggen</button>
        </div>
        <p style={{ textAlign:"center", color:"#333", fontSize:11, marginTop:16 }}>Nur @galvany-expert.de Adressen</p>
      </div>
    </div>
  );

  // SETUP
  if (scr === "setup") return (
    <div style={{ background:G.bg, minHeight:"100vh", color:G.t1, fontFamily:G.ft, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ maxWidth:460, width:"100%", padding:"0 24px" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <Logo />
          <h2 style={{ fontWeight:700, margin:"16px 0 4px", fontSize:18 }}>Einmalige Einrichtung</h2>
          <p style={{ color:G.t2, fontSize:13, margin:0 }}>Kostenloser Google Gemini API-Key</p>
        </div>
        <div style={{ ...card({ padding:28 }) }}>
          <div style={{ border:"1px solid #222", borderRadius:2, padding:14, marginBottom:20, fontSize:12, color:G.t2, lineHeight:1.8 }}>
            <span style={{ color:G.ac, fontWeight:700 }}>Key holen (2 Min):</span><br />
            1 · <b style={{ color:G.t1 }}>aistudio.google.com/apikey</b><br />
            2 · Mit Gmail anmelden<br />
            3 · "API-Schlüssel erstellen"<br />
            4 · Key kopieren und einfügen
          </div>
          <input value={keyInp} onChange={e => setKeyInp(e.target.value)} placeholder="AIzaSy..." style={inputStyle} />
          {keyE && <div style={{ color:G.red, fontSize:12, marginTop:6 }}>{keyE}</div>}
          <button onClick={testKey} style={{ background:G.ac, color:"#000", border:"none", borderRadius:2, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%", marginTop:20 }}>Key bestätigen →</button>
        </div>
      </div>
    </div>
  );

  // HOME
  if (scr === "home") return (
    <div style={{ background:G.bg, minHeight:"100vh", color:G.t1, fontFamily:G.ft }}>
      <div style={{ borderBottom:"1px solid #1a1a1a", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:G.bg, zIndex:10 }}>
        <Logo />
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ color:G.t2, fontSize:12 }}>{name}</span>
          <Divider />
          <button onClick={() => setScr("dashboard")} style={{ background:"none", border:"1px solid #2a2a2a", color:G.t1, borderRadius:2, padding:"6px 14px", fontSize:12, cursor:"pointer" }}>Dashboard</button>
        </div>
      </div>
      <div style={{ maxWidth:640, margin:"0 auto", padding:"40px 24px" }}>
        <p style={{ color:G.t2, fontSize:11, letterSpacing:2, textTransform:"uppercase", margin:"0 0 8px" }}>Training</p>
        <h1 style={{ fontSize:26, fontWeight:700, margin:"0 0 32px" }}>Wähle dein Modul</h1>
        {Object.entries(SCENARIOS).map(([k, s]) => {
          const myRuns = hist.filter(h => h.name === name && h.scKey === k);
          const lastScore = myRuns.length ? myRuns[myRuns.length - 1].score : null;
          return (
            <div key={k} onClick={() => startSc(k)}
              style={{ border:"1px solid #1e1e1e", borderRadius:4, padding:"20px 22px", marginBottom:10, cursor:"pointer", background:G.cd, transition:"all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="#5bffa044"; e.currentTarget.style.background=G.cd2; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="#1e1e1e"; e.currentTarget.style.background=G.cd; }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:24 }}>{s.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:15 }}>{s.title}</div>
                  <div style={{ color:G.t2, fontSize:12, marginTop:2 }}>{s.desc}</div>
                </div>
                {lastScore !== null && (
                  <div style={{ textAlign:"right", marginRight:8 }}>
                    <div style={{ fontSize:10, color:G.t2 }}>Letzter Score</div>
                    <div style={{ fontSize:20, fontWeight:700, color:scoreColor(lastScore) }}>{lastScore}</div>
                  </div>
                )}
                <span style={{ color:"#333", fontSize:18 }}>→</span>
              </div>
              {myRuns.length > 0 && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #1a1a1a", display:"flex", gap:4, flexWrap:"wrap" }}>
                  {myRuns.slice(-5).map((r, i) => (
                    <span key={i} style={{ fontSize:10, color:scoreColor(r.score), border:"1px solid "+scoreColor(r.score)+"44", borderRadius:2, padding:"1px 8px", fontWeight:600 }}>
                      Run {i+1}: {r.score}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {hist.filter(h => h.name === name).length > 0 && (
          <>
            <p style={{ color:G.t2, fontSize:11, letterSpacing:2, textTransform:"uppercase", margin:"36px 0 12px" }}>Letzte Trainings</p>
            <div style={{ border:"1px solid #1a1a1a", borderRadius:4, overflow:"hidden" }}>
              {hist.filter(h => h.name === name).slice(-4).reverse().map((h, i, arr) => (
                <div key={i} style={{ padding:"12px 18px", borderBottom: i < arr.length-1 ? "1px solid #111" : "none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:13 }}>{SCENARIOS[h.scKey]?.icon} {h.scenario}</div>
                    <div style={{ fontSize:11, color:G.t2, marginTop:2 }}>{h.dateStr}</div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:11, color:G.t2, border:"1px solid #222", borderRadius:2, padding:"2px 8px" }}>{h.level}</span>
                    <span style={{ fontWeight:700, fontSize:15, color:scoreColor(h.score) }}>{h.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // CHAT
  if (scr === "chat") return (
    <div style={{ background:G.bg, height:"100vh", display:"flex", flexDirection:"column", fontFamily:G.ft, color:G.t1 }}>
      <div style={{ borderBottom:"1px solid #1a1a1a", padding:"12px 20px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={() => setScr("home")} style={{ background:"none", border:"none", color:G.t2, fontSize:18, cursor:"pointer" }}>←</button>
        <Logo /><Divider />
        <div style={{ flex:1 }}>
          <span style={{ fontWeight:600, fontSize:13 }}>{SCENARIOS[sc].icon} {SCENARIOS[sc].title}</span>
          <span style={{ color:G.t2, fontSize:11, marginLeft:8 }}>Runde {turns}</span>
        </div>
        <button onClick={endEval} disabled={turns < 2} style={{ background: turns < 2 ? "#1a1a1a" : G.ac, color: turns < 2 ? G.t2 : "#000", border:"none", borderRadius:2, padding:"8px 16px", fontWeight:700, fontSize:12, cursor: turns < 2 ? "not-allowed" : "pointer" }}>Auswerten</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role === "u" ? "flex-end" : "flex-start", marginBottom:12 }}>
            <div style={{ maxWidth:"78%", padding:"12px 16px", borderRadius:2, background: m.role === "u" ? "#1a1a1a" : G.cd2, border: m.role === "u" ? "1px solid #5bffa033" : "1px solid #222" }}>
              <div style={{ fontSize:10, fontWeight:600, color: m.role === "u" ? G.ac : "#555", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{m.role === "u" ? name+" (Verkäufer)" : "Kunde (KI)"}</div>
              <div style={{ fontSize:14, lineHeight:1.6 }}>{m.text}</div>
            </div>
          </div>
        ))}
        {ld && (
          <div style={{ display:"flex", gap:4, padding:8 }}>
            {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#333", animation:"b 1s "+(i*0.2)+"s infinite" }} />)}
            <style>{`@keyframes b{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {tip && <div style={{ margin:"0 16px", padding:"10px 14px", background:"#0d1a0d", border:"1px solid #5bffa033", borderRadius:2, fontSize:12, color:G.ac }}>→ {tip}</div>}
      <div style={{ padding:"14px 16px", borderTop:"1px solid #1a1a1a", background:G.bg, flexShrink:0 }}>
        {micOn && (
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:G.ac, animation:"p 1s infinite" }} />
            <span style={{ fontSize:11, color:G.ac, fontWeight:600, letterSpacing:1 }}>AUFNAHME</span>
            <style>{`@keyframes p{0%,100%{opacity:1}50%{opacity:.2}}`}</style>
          </div>
        )}
        <div style={{ display:"flex", gap:8 }}>
          {hasMic && <button onClick={togMic} style={{ width:42, height:42, borderRadius:2, border:"1px solid "+(micOn ? G.ac : "#333"), fontSize:16, cursor:"pointer", background: micOn ? "#0d1a0d" : "#111", color: micOn ? G.ac : G.t2 }}>🎤</button>}
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Deine Antwort als Verkäufer..."
            style={{ flex:1, background:"#111", border:"1px solid #2a2a2a", borderRadius:2, padding:"0 14px", color:G.t1, fontSize:14, height:42, outline:"none" }} />
          <button onClick={send} disabled={!inp.trim() || ld} style={{ width:42, height:42, borderRadius:2, border:"none", background: !inp.trim() || ld ? "#1a1a1a" : G.ac, color: !inp.trim() || ld ? "#444" : "#000", fontSize:16, cursor:"pointer", fontWeight:700 }}>→</button>
        </div>
      </div>
    </div>
  );

  // EVAL
  if (scr === "eval") return (
    <div style={{ background:G.bg, minHeight:"100vh", color:G.t1, fontFamily:G.ft }}>
      <div style={{ borderBottom:"1px solid #1a1a1a", padding:"14px 24px", display:"flex", alignItems:"center", gap:12 }}>
        <Logo /><Divider />
        <span style={{ color:G.t2, fontSize:12 }}>Auswertung</span>
      </div>
      <div style={{ maxWidth:660, margin:"0 auto", padding:"36px 24px" }}>
        {evLd ? (
          <div style={{ textAlign:"center", paddingTop:80 }}>
            <div style={{ width:48, height:48, border:"2px solid "+G.ac, borderTopColor:"transparent", borderRadius:"50%", margin:"0 auto 24px", animation:"sp 1s linear infinite" }} />
            <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
            <h2 style={{ fontWeight:600, margin:"0 0 8px" }}>Analyse läuft</h2>
            <p style={{ color:G.t2, fontSize:13, margin:0 }}>KI wertet dein Gespräch aus...</p>
          </div>
        ) : ev && (
          <>
            <div style={{ ...card({ padding:28, textAlign:"center", marginBottom:16 }) }}>
              <p style={{ color:G.t2, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>{SCENARIOS[sc]?.title} · {name} · {turns} Runden</p>
              <div style={{ fontSize:64, fontWeight:700, color:scoreColor(ev.gesamtpunktzahl), lineHeight:1 }}>{ev.gesamtpunktzahl}</div>
              <div style={{ fontSize:12, color:G.t2, marginTop:4 }}>von 100 Punkten</div>
              <span style={{ display:"inline-block", marginTop:12, border:"1px solid "+scoreColor(ev.gesamtpunktzahl)+"44", color:scoreColor(ev.gesamtpunktzahl), borderRadius:2, padding:"4px 16px", fontSize:11, fontWeight:600, letterSpacing:1, textTransform:"uppercase" }}>{ev.level}</span>
              {(() => {
                const prev = hist.filter(h => h.name === name && h.scKey === sc);
                const p = prev.length >= 2 ? prev[prev.length - 2] : null;
                if (!p) return null;
                const diff = ev.gesamtpunktzahl - p.score;
                return <div style={{ marginTop:10, fontSize:14, fontWeight:600, color: diff > 0 ? G.ac : diff < 0 ? G.red : G.t2 }}>{diff > 0 ? "▲ +"+diff : diff < 0 ? "▼ "+diff : "▬ ±0"} zum letzten Run</div>;
              })()}
            </div>
            <div style={{ ...card({ padding:22, marginBottom:14 }) }}>
              <p style={{ color:G.t2, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 18px" }}>Bewertung</p>
              {ev.kriterien?.map((k, i) => {
                const prevRun = hist.filter(h => h.name === name && h.scKey === sc);
                const prevScore = prevRun.length >= 2 ? prevRun[prevRun.length-2].kriterien?.find(c => c.name === k.name)?.punkte : undefined;
                return (
                  <div key={i} style={{ marginBottom:16, padding: k.deficit ? 10 : 0, borderRadius:2, background: k.deficit ? "#1a0a0a" : "transparent", border: k.deficit ? "1px solid #ff4d4d22" : "1px solid transparent" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontWeight:500, fontSize:13, color: k.deficit ? G.red : G.t1 }}>{k.name}{k.deficit ? " ⚠" : ""}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        {prevScore !== undefined && <span style={{ fontSize:11, color:"#555" }}>{prevScore} →</span>}
                        <span style={{ fontWeight:700, fontSize:14, color:scoreColor(k.punkte) }}>{k.punkte}</span>
                      </div>
                    </div>
                    <BarFill val={k.punkte} prev={prevScore} />
                    <div style={{ fontSize:12, color:G.t2, marginTop:6 }}>{k.feedback}</div>
                  </div>
                );
              })}
            </div>
            {ev.handlungsempfehlungen?.length > 0 && (
              <div style={{ border:"1px solid #5bffa022", borderRadius:4, padding:18, marginBottom:14, background:"#0a0f0a" }}>
                <p style={{ color:G.ac, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Handlungsempfehlungen</p>
                {ev.handlungsempfehlungen.map((h, i) => <div key={i} style={{ fontSize:13, color:"#ccc", marginBottom:8, paddingLeft:12, borderLeft:"2px solid #5bffa044" }}>→ {h}</div>)}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div style={{ border:"1px solid #1a2e1a", borderRadius:4, padding:16, background:"#0a0f0a" }}>
                <p style={{ color:G.ac, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 10px" }}>Stärken</p>
                {ev.staerken?.map((s, i) => <div key={i} style={{ fontSize:12, color:"#aaa", marginBottom:6, paddingLeft:8, borderLeft:"1px solid #2a4a2a" }}>{s}</div>)}
              </div>
              <div style={{ border:"1px solid #2e1a1a", borderRadius:4, padding:16, background:"#0f0a0a" }}>
                <p style={{ color:G.red, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 10px" }}>Defizite</p>
                {ev.verbesserungen?.map((v, i) => <div key={i} style={{ fontSize:12, color:"#aaa", marginBottom:6, paddingLeft:8, borderLeft:"1px solid #4a2a2a" }}>{v}</div>)}
              </div>
            </div>
            <div style={{ ...card({ padding:18, marginBottom:24 }) }}>
              <p style={{ color:G.t2, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 8px" }}>Gesamtfeedback</p>
              <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"#bbb" }}>{ev.gesamtfeedback}</p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => startSc(sc)} style={{ flex:1, background:G.ac, color:"#000", border:"none", borderRadius:2, padding:"14px", fontWeight:700, fontSize:14, cursor:"pointer" }}>Nochmal trainieren</button>
              <button onClick={() => setScr("home")} style={{ flex:1, background:"transparent", color:G.t1, border:"1px solid #333", borderRadius:2, padding:"14px", fontWeight:600, fontSize:14, cursor:"pointer" }}>Zurück</button>
              <button onClick={() => { setScr("dashboard"); setDashTab("compare"); }} style={{ flex:1, background:"transparent", color:G.ac, border:"1px solid #5bffa044", borderRadius:2, padding:"14px", fontWeight:600, fontSize:14, cursor:"pointer" }}>Vergleich →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // DASHBOARD
  if (scr === "dashboard") {
    const fh = filtHist(dashPeriod, selectedUser);
    const totalT = fh.length;
    const avgS = totalT ? Math.round(fh.reduce((a, h) => a + h.score, 0) / totalT) : 0;
    const best = empStats.length ? empStats.reduce((a, b) => a.avg > b.avg ? a : b) : null;

    return (
      <div style={{ background:G.bg, minHeight:"100vh", color:G.t1, fontFamily:G.ft }}>
        <div style={{ borderBottom:"1px solid #1a1a1a", padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={() => setScr("home")} style={{ background:"none", border:"none", color:G.t2, fontSize:16, cursor:"pointer" }}>←</button>
            <Logo /><Divider />
            <span style={{ color:G.t2, fontSize:11, letterSpacing:2, textTransform:"uppercase" }}>Dashboard</span>
          </div>
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
            style={{ background:"#111", color:G.t1, border:"1px solid #2a2a2a", borderRadius:2, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>
            <option value="all">Alle Mitarbeiter</option>
            {allUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div style={{ borderBottom:"1px solid #1a1a1a", padding:"10px 24px", display:"flex", gap:6 }}>
          {[["all","Gesamt"],["today","Heute"],["week","Woche"],["month","Monat"]].map(([k, l]) => (
            <button key={k} onClick={() => setDashPeriod(k)} style={gBtn(dashPeriod === k)}>{l}</button>
          ))}
        </div>
        <div style={{ padding:"24px 24px 0" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, maxWidth:800, margin:"0 auto" }}>
            {[["Trainings", totalT, G.t1],["Ø Score", avgS||"—", scoreColor(avgS)],["Top Performer", best?.name?.split(" ")[0]||"—", G.t1]].map(([l, v, c], i) => (
              <div key={i} style={{ ...card({ padding:"16px 20px" }) }}>
                <div style={{ fontSize:11, color:G.t2, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:24, fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderBottom:"1px solid #1a1a1a", padding:"0 24px", display:"flex", maxWidth:800, margin:"16px auto 0" }}>
          {[["overview","Team"],["progress","Entwicklung"],["compare","Vergleich"],["quota","Quoten"],["history","Historie"]].map(([id, label]) => (
            <button key={id} onClick={() => setDashTab(id)} style={{ background:"none", border:"none", borderBottom: dashTab===id ? "2px solid "+G.ac : "2px solid transparent", color: dashTab===id ? G.t1 : G.t2, padding:"10px 16px", fontSize:13, fontWeight: dashTab===id ? 600 : 400, cursor:"pointer" }}>{label}</button>
          ))}
        </div>
        <div style={{ maxWidth:800, margin:"0 auto", padding:"20px 24px" }}>

          {dashTab === "overview" && (
            empStats.length === 0
              ? <div style={{ ...card({ padding:40, textAlign:"center" }), color:G.t2 }}>Noch keine Daten. Training starten!</div>
              : <>
                <div style={{ ...card({ padding:20, marginBottom:14 }) }}>
                  <p style={{ color:G.t2, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 16px" }}>Score-Vergleich</p>
                  <ResponsiveContainer width="100%" height={Math.max(140, empStats.length*42)}>
                    <BarChart data={empStats} layout="vertical" margin={{ left:70, right:40, top:5, bottom:5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis type="number" domain={[0,100]} stroke="#333" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="#333" fontSize={11} tick={{ fill:G.t2 }} />
                      <Tooltip contentStyle={{ background:"#111", border:"1px solid #222", borderRadius:2, fontSize:12 }} formatter={v => [v+"/100","Score"]} />
                      <Bar dataKey="avg" radius={[0,2,2,0]} fill={G.ac} name="Ø Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ border:"1px solid #1a1a1a", borderRadius:4, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #1a1a1a" }}>
                        {["#","Name","Runs","Ø Score","Best","Worst","Trend","Level"].map(h => (
                          <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:G.t2, fontWeight:500, fontSize:10, letterSpacing:1, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {empStats.sort((a, b) => b.avg - a.avg).map((s, i) => {
                        const lastEv = hist.filter(h => h.name === s.name).slice(-1)[0];
                        return (
                          <tr key={i} style={{ borderBottom:"1px solid #111" }}>
                            <td style={{ padding:"11px 12px", color:G.t2 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
                            <td style={{ padding:"11px 12px", fontWeight:500 }}>{s.name}</td>
                            <td style={{ padding:"11px 12px", color:G.t2 }}>{s.count}</td>
                            <td style={{ padding:"11px 12px" }}><span style={{ color:scoreColor(s.avg), fontWeight:700 }}>{s.avg}</span></td>
                            <td style={{ padding:"11px 12px", color:G.ac, fontWeight:600 }}>{s.best}</td>
                            <td style={{ padding:"11px 12px", color:G.red, fontWeight:600 }}>{s.worst}</td>
                            <td style={{ padding:"11px 12px", color: s.trend===null?G.t2:s.trend>0?G.ac:s.trend<0?G.red:G.t2, fontWeight:600 }}>
                              {s.trend===null?"—":s.trend>0?"▲ +"+s.trend:s.trend<0?"▼ "+s.trend:"▬"}
                            </td>
                            <td style={{ padding:"11px 12px", color:G.t2, fontSize:11 }}>{lastEv?.level||"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
          )}

          {dashTab === "progress" && (
            <div>
              {allUsers.length === 0
                ? <div style={{ ...card({ padding:40, textAlign:"center" }), color:G.t2 }}>Keine Daten.</div>
                : allUsers.map(u => {
                  const runs = getUserProgress(u);
                  if (runs.length < 2) return null;
                  const chartData = runs.map((r, i) => ({ name:"Run "+(i+1), score:r.score }));
                  return (
                    <div key={u} style={{ ...card({ padding:20, marginBottom:14 }) }}>
                      <p style={{ fontWeight:600, fontSize:14, margin:"0 0 16px" }}>{u}</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData} margin={{ left:10, right:20, top:5, bottom:5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                          <XAxis dataKey="name" stroke="#333" fontSize={10} tick={{ fill:G.t2 }} />
                          <YAxis domain={[0,100]} stroke="#333" fontSize={10} tick={{ fill:G.t2 }} />
                          <Tooltip contentStyle={{ background:"#111", border:"1px solid #222", borderRadius:2, fontSize:12 }} />
                          <Line type="monotone" dataKey="score" stroke={G.ac} strokeWidth={2} dot={{ fill:G.ac, r:4 }} name="Score" />
                        </LineChart>
                      </ResponsiveContainer>
                      {Object.keys(SCENARIOS).map(sk => {
                        const skRuns = runs.filter(r => r.scKey === sk);
                        const latest = skRuns[skRuns.length-1];
                        const first = skRuns[0];
                        if (!latest || !first || latest.id === first.id) return null;
                        return (
                          <div key={sk} style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #1a1a1a" }}>
                            <p style={{ fontSize:12, color:G.t2, margin:"0 0 10px" }}>{SCENARIOS[sk].icon} {SCENARIOS[sk].title}</p>
                            {latest.kriterien?.map((k, i) => {
                              const f = first.kriterien?.find(c => c.name === k.name);
                              if (!f) return null;
                              const diff = k.punkte - f.punkte;
                              return (
                                <div key={i} style={{ marginBottom:8 }}>
                                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                                    <span style={{ color:G.t2 }}>{k.name}</span>
                                    <span style={{ color: diff>0?G.ac:diff<0?G.red:G.t2, fontWeight:600 }}>{f.punkte} → {k.punkte} ({diff>0?"+":""}{diff})</span>
                                  </div>
                                  <SimpleBars val={k.punkte} />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          )}

          {dashTab === "compare" && (
            <div>
              <div style={{ ...card({ padding:20, marginBottom:14 }) }}>
                <p style={{ color:G.t2, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 14px" }}>Zwei Trainings vergleichen</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                  <div>
                    <label style={{ fontSize:11, color:G.t2, display:"block", marginBottom:5 }}>Run A (Vorher)</label>
                    <select value={compareA||""} onChange={e => setCompareA(Number(e.target.value)||null)}
                      style={{ width:"100%", background:"#0a0a0a", border:"1px solid #2a2a2a", borderRadius:2, padding:"9px 12px", color:G.t1, fontSize:11 }}>
                      <option value="">-- Wählen --</option>
                      {hist.map(h => <option key={h.id} value={h.id}>{h.name} | {h.scenario} | {h.score}Pkt | {h.dateStr}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:G.t2, display:"block", marginBottom:5 }}>Run B (Nachher)</label>
                    <select value={compareB||""} onChange={e => setCompareB(Number(e.target.value)||null)}
                      style={{ width:"100%", background:"#0a0a0a", border:"1px solid #2a2a2a", borderRadius:2, padding:"9px 12px", color:G.t1, fontSize:11 }}>
                      <option value="">-- Wählen --</option>
                      {hist.filter(h => h.id !== compareA).map(h => <option key={h.id} value={h.id}>{h.name} | {h.scenario} | {h.score}Pkt | {h.dateStr}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={runCompare} disabled={!compareA||!compareB||compareLoading}
                  style={{ background: !compareA||!compareB?"#1a1a1a":G.ac, color: !compareA||!compareB?G.t2:"#000", border:"none", borderRadius:2, padding:"11px 20px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  {compareLoading ? "Analysiere..." : "Vergleich starten →"}
                </button>
              </div>
              {compareResult && (() => {
                const { a, b, analysis } = compareResult;
                const scoreDiff = b.score - a.score;
                return (
                  <div>
                    <div style={{ ...card({ padding:22, marginBottom:14 }) }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:10, alignItems:"center", textAlign:"center" }}>
                        <div>
                          <p style={{ fontSize:11, color:G.t2, margin:"0 0 6px" }}>Run A · {a.dateStr}</p>
                          <div style={{ fontSize:40, fontWeight:700, color:scoreColor(a.score) }}>{a.score}</div>
                          <div style={{ fontSize:11, color:G.t2, marginTop:4 }}>{a.level}</div>
                        </div>
                        <div style={{ fontSize:22, fontWeight:700, color: scoreDiff>0?G.ac:scoreDiff<0?G.red:G.t2 }}>{scoreDiff>0?"+"+scoreDiff:scoreDiff}</div>
                        <div>
                          <p style={{ fontSize:11, color:G.t2, margin:"0 0 6px" }}>Run B · {b.dateStr}</p>
                          <div style={{ fontSize:40, fontWeight:700, color:scoreColor(b.score) }}>{b.score}</div>
                          <div style={{ fontSize:11, color:G.t2, marginTop:4 }}>{b.level}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ ...card({ padding:20, marginBottom:14 }) }}>
                      <p style={{ fontSize:11, color:G.t2, letterSpacing:1, textTransform:"uppercase", margin:"0 0 14px" }}>Kriterien</p>
                      {b.kriterien?.map((k, i) => {
                        const prev = a.kriterien?.find(c => c.name === k.name);
                        const diff = prev ? k.punkte - prev.punkte : 0;
                        return (
                          <div key={i} style={{ marginBottom:12 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                              <span>{k.name}</span>
                              <span style={{ color: diff>0?G.ac:diff<0?G.red:G.t2, fontWeight:600 }}>{prev?.punkte||0} → {k.punkte} ({diff>0?"+":""}{diff})</span>
                            </div>
                            <BarFill val={k.punkte} prev={prev?.punkte} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                      {analysis.verbesserungen?.length > 0 && <div style={{ border:"1px solid #1a2e1a", borderRadius:4, padding:14 }}><p style={{ color:G.ac, fontSize:11, fontWeight:600, margin:"0 0 8px", letterSpacing:1, textTransform:"uppercase" }}>Verbessert</p>{analysis.verbesserungen.map((v,i)=><div key={i} style={{ fontSize:12, color:"#aaa", marginBottom:4 }}>{v}</div>)}</div>}
                      {analysis.verschlechtert?.length > 0 && <div style={{ border:"1px solid #2e1a1a", borderRadius:4, padding:14 }}><p style={{ color:G.red, fontSize:11, fontWeight:600, margin:"0 0 8px", letterSpacing:1, textTransform:"uppercase" }}>Verschlechtert</p>{analysis.verschlechtert.map((v,i)=><div key={i} style={{ fontSize:12, color:"#aaa", marginBottom:4 }}>{v}</div>)}</div>}
                      {analysis.gelosteDefizite?.length > 0 && <div style={{ border:"1px solid #1a2e1a", borderRadius:4, padding:14 }}><p style={{ color:G.ac, fontSize:11, fontWeight:600, margin:"0 0 8px", letterSpacing:1, textTransform:"uppercase" }}>Defizite gelöst</p>{analysis.gelosteDefizite.map((v,i)=><div key={i} style={{ fontSize:12, color:"#aaa", marginBottom:4 }}>{v}</div>)}</div>}
                      {analysis.neueDefizite?.length > 0 && <div style={{ border:"1px solid #2e2010", borderRadius:4, padding:14 }}><p style={{ color:G.amber, fontSize:11, fontWeight:600, margin:"0 0 8px", letterSpacing:1, textTransform:"uppercase" }}>Neue Defizite</p>{analysis.neueDefizite.map((v,i)=><div key={i} style={{ fontSize:12, color:"#aaa", marginBottom:4 }}>{v}</div>)}</div>}
                    </div>
                    <div style={{ border:"1px solid #5bffa022", borderRadius:4, padding:16, marginBottom:14, background:"#0a0f0a" }}>
                      <p style={{ color:G.ac, fontSize:11, letterSpacing:1, textTransform:"uppercase", margin:"0 0 10px" }}>Nächste Schritte</p>
                      {analysis.empfehlungen?.map((e,i) => <div key={i} style={{ fontSize:13, color:"#bbb", marginBottom:6, paddingLeft:10, borderLeft:"1px solid #5bffa044" }}>→ {e}</div>)}
                    </div>
                    <div style={{ ...card({ padding:16 }) }}>
                      <p style={{ fontSize:11, color:G.t2, margin:"0 0 6px", letterSpacing:1, textTransform:"uppercase" }}>Gesamtentwicklung</p>
                      <p style={{ fontSize:13, lineHeight:1.7, margin:0, color:"#bbb" }}>{analysis.gesamtentwicklung}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {dashTab === "quota" && (
            <div>
              <div style={{ ...card({ padding:18, marginBottom:14 }) }}>
                <p style={{ fontSize:11, color:G.t2, letterSpacing:1, textTransform:"uppercase", margin:"0 0 12px" }}>Quoten konfigurieren</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["daily","Täglich"],["weekly","Wöchentlich"],["monthly","Monatlich"],["targetScore","Ziel-Score"]].map(([k, l]) => (
                    <div key={k}>
                      <label style={{ fontSize:10, color:G.t2, display:"block", marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{l}</label>
                      <input type="number" value={quota[k]} onChange={e => setQuota({ ...quota, [k]: parseInt(e.target.value)||0 })}
                        style={{ width:"100%", background:"#0a0a0a", border:"1px solid #2a2a2a", borderRadius:2, padding:"9px 12px", color:G.t1, fontSize:14, boxSizing:"border-box" }} />
                    </div>
                  ))}
                </div>
              </div>
              {allUsers.map(u => {
                const now = new Date();
                const dayC = hist.filter(h => h.name===u && new Date(h.date).toDateString()===now.toDateString()).length;
                const wkS = new Date(now); wkS.setDate(now.getDate()-7);
                const wkC = hist.filter(h => h.name===u && new Date(h.date)>=wkS).length;
                const moS = new Date(now); moS.setMonth(now.getMonth()-1);
                const moC = hist.filter(h => h.name===u && new Date(h.date)>=moS).length;
                const uRuns = hist.filter(h => h.name===u);
                const uAvg = uRuns.length ? Math.round(uRuns.reduce((a,h)=>a+h.score,0)/uRuns.length) : 0;
                return (
                  <div key={u} style={{ ...card({ padding:18, marginBottom:10 }) }}>
                    <p style={{ fontWeight:600, fontSize:13, margin:"0 0 14px" }}>{u}</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                      {[["Heute",dayC,quota.daily],["Woche",wkC,quota.weekly],["Monat",moC,quota.monthly],["Score",uAvg,quota.targetScore]].map(([l,v,t],j) => (
                        <div key={j} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:10, color:G.t2, marginBottom:4, letterSpacing:1, textTransform:"uppercase" }}>{l}</div>
                          <div style={{ fontSize:22, fontWeight:700, color: v>=t?G.ac:G.red }}>{v}</div>
                          <div style={{ fontSize:10, color:G.t2, marginTop:1 }}>/{t}</div>
                          <div style={{ height:2, background:"#111", overflow:"hidden", marginTop:6, borderRadius:1 }}>
                            <div style={{ height:"100%", width: Math.min(100,(v/t)*100)+"%", background: v>=t?G.ac:G.red }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {dashTab === "history" && (
            <div style={{ border:"1px solid #1a1a1a", borderRadius:4, overflow:"hidden" }}>
              {fh.length === 0
                ? <div style={{ padding:40, textAlign:"center", color:G.t2 }}>Keine Daten.</div>
                : [...fh].reverse().map((h, i, arr) => (
                  <div key={i} style={{ padding:"14px 18px", borderBottom: i<arr.length-1?"1px solid #111":"none" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontWeight:500, fontSize:13 }}>{h.name}</div>
                        <div style={{ fontSize:11, color:G.t2, marginTop:2 }}>{SCENARIOS[h.scKey]?.icon} {h.scenario} · {h.dateStr} · {h.turns} Runden</div>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontSize:11, color:G.t2, border:"1px solid #222", borderRadius:2, padding:"2px 8px" }}>{h.level}</span>
                        <span style={{ fontWeight:700, fontSize:16, color:scoreColor(h.score) }}>{h.score}</span>
                      </div>
                    </div>
                    {h.kriterien && (
                      <div style={{ marginTop:8, display:"flex", gap:4, flexWrap:"wrap" }}>
                        {h.kriterien.map((k, j) => (
                          <span key={j} style={{ fontSize:10, color:scoreColor(k.punkte), border:"1px solid "+scoreColor(k.punkte)+"33", borderRadius:2, padding:"1px 7px" }}>{k.name}: {k.punkte}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}

export default dynamic(() => Promise.resolve(App), { ssr: false })
