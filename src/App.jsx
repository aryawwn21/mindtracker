import { useState, useEffect, useRef } from "react";

// ── Logo SVG (two overlapping circles — MindTracker brand) ─────────────────
const LogoMark = ({ size = 32 }) => (
  <svg
    width={size}
    height={Math.round(size * 0.72)}
    viewBox="0 0 100 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="38" cy="36" r="32" fill="#4B4ACF" fillOpacity="0.9" />
    <circle cx="62" cy="26" r="26" fill="#8B5CF6" fillOpacity="0.85" />
  </svg>
);

// ── Constants ──────────────────────────────────────────────────────────────
const MOODS = ["😊", "😢", "😡", "😴", "🤯", "🥰", "😰"];
const MOOD_LABELS = {
  "😊": "Happy",
  "😢": "Sad",
  "😡": "Angry",
  "😴": "Tired",
  "🤯": "Overwhelmed",
  "🥰": "Loved",
  "😰": "Anxious",
};

const QUESTIONS = [
  "Low interest or pleasure in things you used to enjoy?",
  "Feeling down, hopeless, or depressed?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself or like a failure?",
  "Trouble concentrating on tasks or reading?",
  "Moving or speaking slowly, or being restless/fidgety?",
  "Thoughts of hurting yourself?",
];
const Q_OPTIONS = [
  "Not at all",
  "Several days",
  "More than half",
  "Nearly every day",
];

const CRISIS_KEYWORDS = [
  "kill myself",
  "end my life",
  "want to die",
  "suicide",
  "suicidal",
  "don't want to live",
  "cant go on",
  "can't go on",
  "no reason to live",
  "hurt myself",
  "self harm",
  "cutting myself",
  "overdose",
  "end it all",
  "not worth living",
  "goodbye forever",
  "final note",
  "last entry",
];
const CRISIS_RESOURCES = [
  {
    name: "iCall (India)",
    phone: "9152987821",
    url: "https://icallhelpline.org",
  },
  {
    name: "Vandrevala Foundation",
    phone: "1860-2662-345",
    url: "https://www.vandrevalafoundation.com",
  },
  { name: "AASRA", phone: "9820466627", url: "http://www.aasra.info" },
  {
    name: "Find Nearest Therapist",
    phone: null,
    url: "https://www.google.com/maps/search/mental+health+therapist+near+me",
  },
];

const BREATHING_PHASES = [
  { label: "Breathe In", duration: 4, color: "#4B4ACF" },
  { label: "Hold", duration: 4, color: "#8B5CF6" },
  { label: "Breathe Out", duration: 6, color: "#0D9488" },
  { label: "Hold", duration: 2, color: "#6B7280" },
];

function getResult(s) {
  if (s <= 4) return { label: "Minimal", color: "green" };
  if (s <= 9) return { label: "Mild", color: "amber" };
  if (s <= 14) return { label: "Moderate", color: "orange" };
  return { label: "Severe", color: "red" };
}
function checkCrisis(text) {
  const l = text.toLowerCase();
  return CRISIS_KEYWORDS.some((k) => l.includes(k));
}
function getDayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}
function calcStreak(entries) {
  if (!entries.length) return 0;
  const days = [...new Set(entries.map((e) => getDayKey(e.timestamp)))]
    .sort()
    .reverse();
  const today = getDayKey(Date.now());
  const yesterday = getDayKey(Date.now() - 86400000);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]) - new Date(days[i])) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

function CrisisModal({ onClose }) {
  return (
    <div className="modal-overlay crisis-overlay">
      <div className="modal crisis-modal">
        <div className="crisis-header">
          <span className="crisis-icon">🆘</span>
          <h2 className="modal-title crisis-title">You are not alone</h2>
        </div>
        <p className="modal-sub crisis-sub">
          We noticed something concerning. Your life matters and real help is
          available right now.
        </p>
        <div className="crisis-resources">
          {CRISIS_RESOURCES.map((r, i) => (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="crisis-resource-card"
            >
              <div className="crisis-resource-name">{r.name}</div>
              {r.phone && (
                <div className="crisis-resource-phone">📞 {r.phone}</div>
              )}
              <div className="crisis-resource-link">Open →</div>
            </a>
          ))}
        </div>
        <p className="crisis-note">
          Immediate danger? Call 112 (India) · 911 (US) · 999 (UK)
        </p>
        <button className="btn btn-ghost crisis-close" onClick={onClose}>
          I am okay, close this
        </button>
      </div>
    </div>
  );
}

function BreathingModal({ onClose }) {
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(BREATHING_PHASES[0].duration);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          const next = (phaseRef.current + 1) % BREATHING_PHASES.length;
          if (next === 0) setCycles((cy) => cy + 1);
          setPhase(next);
          return BREATHING_PHASES[next].duration;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const current = BREATHING_PHASES[phase];
  const totalDuration = current.duration;
  const elapsed = totalDuration - count;
  const pct = Math.round((elapsed / totalDuration) * 100);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("modal-overlay")) onClose();
      }}
    >
      <div className="modal breathing-modal">
        <h2 className="modal-title">Box Breathing</h2>
        <p className="modal-sub">
          4-4-6-2 pattern — calms your nervous system in minutes
        </p>
        <div className="breath-circle-wrap">
          <svg
            viewBox="0 0 120 120"
            width="180"
            height="180"
            className="breath-svg"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="var(--border2)"
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={current.color}
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 1s linear",
                transform: "rotate(-90deg)",
                transformOrigin: "60px 60px",
              }}
            />
            <text
              x="60"
              y="52"
              textAnchor="middle"
              fontSize="13"
              fill="var(--text-muted)"
              fontFamily="DM Sans"
            >
              {current.label}
            </text>
            <text
              x="60"
              y="74"
              textAnchor="middle"
              fontSize="28"
              fill="var(--text)"
              fontFamily="DM Serif Display"
              fontWeight="400"
            >
              {count}
            </text>
          </svg>
        </div>
        <p className="breath-cycles">
          Cycles completed: <strong>{cycles}</strong>
        </p>
        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setRunning(false);
              setPhase(0);
              setCount(BREATHING_PHASES[0].duration);
              setCycles(0);
            }}
          >
            ↺ Reset
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function MoodChart({ entries }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const moods = entries
      .filter((e) => getDayKey(e.timestamp) === key)
      .map((e) => e.mood);
    days.push({ label, moods, key });
  }
  return (
    <div className="mood-chart">
      {days.map((d) => (
        <div key={d.key} className="mood-day">
          <div className="mood-day-emojis">
            {d.moods.length === 0 ? (
              <span className="mood-day-empty">·</span>
            ) : (
              d.moods.slice(0, 2).map((m, i) => <span key={i}>{m}</span>)
            )}
          </div>
          <div className="mood-day-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function AIInsightPanel({ insight, loading, onAnalyze, hasData }) {
  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <div className="ai-label">
          <span className="ai-dot" />
          AI Wellness Insight
        </div>
        {hasData && (
          <button
            className="btn btn-sm btn-accent"
            onClick={onAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing…" : insight ? "Re-analyze" : "Analyze Now"}
          </button>
        )}
      </div>
      {!hasData && (
        <p className="ai-empty">
          Add journal entries or complete the PHQ‑9 test to unlock your
          personalized AI insight.
        </p>
      )}
      {hasData && !insight && !loading && (
        <p className="ai-empty">
          Click <strong>Analyze Now</strong> to get personalized insight based
          on your journal and test results.
        </p>
      )}
      {loading && (
        <div className="ai-loading">
          <div className="ai-spinner" />
          <span>Reading your journal and generating insights…</span>
        </div>
      )}
      {insight && !loading && (
        <div className="ai-content">
          <div className="ai-response">
            {insight.split("\n").map((line, i) => {
              if (!line.trim()) return <br key={i} />;
              if (line.startsWith("**") && line.endsWith("**"))
                return (
                  <h4 key={i} className="ai-section-title">
                    {line.replace(/\*\*/g, "")}
                  </h4>
                );
              if (line.match(/^\*\*.*\*\*/))
                return (
                  <p
                    key={i}
                    className="ai-line"
                    dangerouslySetInnerHTML={{
                      __html: line.replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>",
                      ),
                    }}
                  />
                );
              return (
                <p key={i} className="ai-line">
                  {line}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const [formU, setFormU] = useState("");
  const [formP, setFormP] = useState("");
  const [dark, setDark] = useState(false);
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("😊");
  const [showTest, setShowTest] = useState(false);
  const [answers, setAnswers] = useState(Array(9).fill(-1));
  const [savedScore, setSavedScore] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [gratitude, setGratitude] = useState("");
  const [gratitudeList, setGratitudeList] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [activeTab, setActiveTab] = useState("journal");
  const toastTimer = useRef(null);

  useEffect(() => {
    const dk = localStorage.getItem("mt_dark");
    if (dk === "1") setDark(true);
    const u = localStorage.getItem("mt_user");
    if (u) {
      setUser(u);
      const e = localStorage.getItem(`mt_entries_${u}`);
      if (e) setEntries(JSON.parse(e));
      const sc = localStorage.getItem(`mt_score_${u}`);
      if (sc) setSavedScore(JSON.parse(sc));
      const ins = localStorage.getItem(`mt_insight_${u}`);
      if (ins) setAiInsight(ins);
      const gr = localStorage.getItem(`mt_gratitude_${u}`);
      if (gr) setGratitudeList(JSON.parse(gr));
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
    localStorage.setItem("mt_dark", dark ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    if (user)
      localStorage.setItem(`mt_entries_${user}`, JSON.stringify(entries));
  }, [entries, user]);
  useEffect(() => {
    if (user)
      localStorage.setItem(
        `mt_gratitude_${user}`,
        JSON.stringify(gratitudeList),
      );
  }, [gratitudeList, user]);

  function showToast(msg) {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2400);
  }

  function handleAuth() {
    const u = formU.trim(),
      p = formP;
    if (!u || !p) {
      showToast("Please fill all fields");
      return;
    }
    const users = JSON.parse(localStorage.getItem("mt_users") || "{}");
    if (isSignup) {
      if (users[u]) {
        showToast("Username already taken");
        return;
      }
      users[u] = p;
      localStorage.setItem("mt_users", JSON.stringify(users));
      showToast("Account created!");
    } else {
      if (users[u] !== p) {
        showToast("Invalid credentials");
        return;
      }
    }
    localStorage.setItem("mt_user", u);
    setUser(u);
    const e = localStorage.getItem(`mt_entries_${u}`);
    setEntries(e ? JSON.parse(e) : []);
    const sc = localStorage.getItem(`mt_score_${u}`);
    if (sc) setSavedScore(JSON.parse(sc));
    const ins = localStorage.getItem(`mt_insight_${u}`);
    if (ins) setAiInsight(ins);
    const gr = localStorage.getItem(`mt_gratitude_${u}`);
    if (gr) setGratitudeList(JSON.parse(gr));
  }

  function logout() {
    localStorage.removeItem("mt_user");
    setUser(null);
    setEntries([]);
    setText("");
    setAiInsight("");
    setSavedScore(null);
    setGratitudeList([]);
  }

  function addEntry() {
    if (!text.trim()) {
      showToast("Write something first");
      return;
    }
    if (checkCrisis(text)) setShowCrisis(true);
    const entry = {
      id: Date.now(),
      text: text.trim(),
      mood,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      timestamp: Date.now(),
    };
    setEntries((prev) => [entry, ...prev]);
    setText("");
    showToast("Entry saved ✓");
  }
  function deleteEntry(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    showToast("Entry deleted");
  }

  function addGratitude() {
    if (!gratitude.trim()) {
      showToast("Write something first");
      return;
    }
    setGratitudeList((prev) => [
      {
        id: Date.now(),
        text: gratitude.trim(),
        date: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      },
      ...prev,
    ]);
    setGratitude("");
    showToast("Gratitude saved 🌸");
  }

  const thisWeek = entries.filter(
    (e) => Date.now() - e.timestamp < 7 * 24 * 3600 * 1000,
  ).length;
  const moodCounts = {};
  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const topMood =
    Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const streak = calcStreak(entries);
  const score = answers.reduce((a, b) => a + (b < 0 ? 0 : b), 0);
  const answeredAll = answers.every((a) => a >= 0);
  const result = getResult(score);
  const scorePct = Math.round((score / 27) * 100);

  function saveTestResult() {
    const scoreData = {
      score,
      result: result.label,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setSavedScore(scoreData);
    localStorage.setItem(`mt_score_${user}`, JSON.stringify(scoreData));
    setShowTest(false);
    showToast("Test result saved ✓");
  }

  async function runAIAnalysis() {
    setAiLoading(true);
    setAiInsight("");
    const journalSummary = entries
      .slice(0, 10)
      .map((e) => `[${e.date}] Mood: ${e.mood} — ${e.text}`)
      .join("\n");
    const testInfo = savedScore
      ? `PHQ-9 Score: ${savedScore.score}/27 (${savedScore.result} symptoms) taken on ${savedScore.date}`
      : "No PHQ-9 test completed yet.";
    const prompt = `You are a compassionate mental wellness AI assistant. A user has shared their journal entries and mental health screening results. Analyze them and provide a structured response with these four sections:\n\n**What you're feeling**\nDescribe their emotional state warmly and specifically based on what they wrote. (2-3 sentences)\n\n**What might be behind it**\nIdentify patterns, possible triggers, or themes you notice from their entries. Be specific, not generic. (2-3 sentences)\n\n**What you can do right now**\nGive 3-4 specific, actionable, compassionate suggestions suited to their current state. Make them practical and immediate.\n\n**A message for you**\nA short, genuine, heartfelt closing message. (1-2 sentences)\n\nKeep the tone warm, human, and non-clinical. Do not diagnose. Use plain language. Be specific to what they actually wrote.\n\n--- USER DATA ---\n${testInfo}\n\nRecent journal entries:\n${journalSummary || "No journal entries recorded yet."}\n--- END DATA ---`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await response.json();
      const insightText =
        data.content?.map((i) => i.text || "").join("\n") ||
        "Unable to generate insight.";
      setAiInsight(insightText);
      localStorage.setItem(`mt_insight_${user}`, insightText);
    } catch {
      setAiInsight(
        "Could not connect to the AI service. Please check your connection and try again.",
      );
    }
    setAiLoading(false);
  }

  function exportPDF() {
    showToast("Generating PDF…");
    const existing = document.getElementById("jspdf-script");
    if (existing) {
      buildPDF();
      return;
    }
    const script = document.createElement("script");
    script.id = "jspdf-script";
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.onload = buildPDF;
    document.head.appendChild(script);
  }

  function buildPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth(),
      pageH = doc.internal.pageSize.getHeight();
    const margin = 20,
      usableW = pageW - margin * 2;
    let y = margin;
    function checkPage(n = 10) {
      if (y + n > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    }
    function sTitle(t) {
      checkPage(16);
      doc.setFillColor(75, 74, 207);
      doc.rect(margin, y, usableW, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(t, margin + 3, y + 5.5);
      doc.setTextColor(28, 26, 22);
      y += 13;
    }
    function bText(txt, size = 10, color = [80, 76, 70]) {
      doc.setFontSize(size);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...color);
      doc.splitTextToSize(String(txt), usableW).forEach((l) => {
        checkPage(6);
        doc.text(l, margin, y);
        y += 5.5;
      });
    }
    doc.setFillColor(75, 74, 207);
    doc.rect(0, 0, pageW, 65, "F");
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 50, pageW, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text("MindTracker", margin, 28);
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.text("Personal Wellness Journal Report", margin, 40);
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
      margin,
      55,
    );
    doc.text(`User: ${user}`, margin, 62);
    doc.setTextColor(28, 26, 22);
    y = 80;
    sTitle("OVERVIEW");
    bText(`Total Journal Entries: ${entries.length}`);
    bText(`Entries This Week: ${thisWeek}`);
    bText(`Streak: ${streak} day${streak !== 1 ? "s" : ""}`);
    bText(`Top Mood: ${topMood}`);
    if (savedScore)
      bText(
        `PHQ-9: ${savedScore.score}/27 — ${savedScore.result} (${savedScore.date})`,
      );
    y += 6;
    if (aiInsight) {
      sTitle("AI WELLNESS INSIGHT");
      bText(aiInsight.replace(/\*\*/g, ""));
      y += 6;
    }
    if (savedScore) {
      sTitle("PHQ-9 RESULT");
      bText(`Score: ${savedScore.score}/27 — ${savedScore.result}`);
      bText(`Date: ${savedScore.date}`);
      bText(
        "Disclaimer: Screening tool only, not a clinical diagnosis.",
        9,
        [140, 135, 130],
      );
      y += 6;
    }
    if (gratitudeList.length > 0) {
      sTitle("GRATITUDE LOG");
      gratitudeList
        .slice(0, 10)
        .forEach((g, i) => bText(`${i + 1}. [${g.date}] ${g.text}`));
      y += 6;
    }
    sTitle("JOURNAL ENTRIES");
    if (!entries.length) bText("No entries recorded yet.");
    else
      entries.forEach((e, i) => {
        checkPage(22);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(75, 74, 207);
        doc.text(`${i + 1}. ${e.date}   ${e.mood}`, margin, y);
        doc.setTextColor(28, 26, 22);
        y += 6;
        bText(e.text, 10, [80, 76, 70]);
        y += 2;
        doc.setDrawColor(220, 218, 214);
        checkPage(4);
        doc.line(margin, y, pageW - margin, y);
        y += 5;
      });
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160, 156, 150);
      doc.text(
        `MindTracker — Confidential Wellness Report — Page ${i} of ${totalPages}`,
        margin,
        pageH - 10,
      );
    }
    doc.save(
      `MindTracker_${user}_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
    showToast("PDF downloaded! ✓");
  }

  // ── AUTH ──────────────────────────────────────────────
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <LogoMark size={52} />
            <div className="auth-brand-text">
              <span className="brand-logo">MindTracker</span>
              <span className="brand-sub">Your private wellness journal</span>
            </div>
          </div>
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              placeholder="your username"
              value={formU}
              onChange={(e) => setFormU(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                document.getElementById("pw-input")?.focus()
              }
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              id="pw-input"
              type="password"
              placeholder="••••••••"
              value={formP}
              onChange={(e) => setFormP(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAuth}>
            {isSignup ? "Create Account" : "Sign In"}
          </button>
          <span className="auth-toggle" onClick={() => setIsSignup(!isSignup)}>
            {isSignup
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </span>
        </div>
        <Toast message={toastMsg} />
      </div>
    );
  }

  // ── MAIN ──────────────────────────────────────────────
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <LogoMark size={34} />
          <div className="header-brand">
            <span className="logo">MindTracker</span>
            <span className="logo-tag">wellness journal</span>
          </div>
        </div>
        <nav className="header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowBreathing(true)}
          >
            🌬 Breathe
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setDark(!dark)}
          >
            {dark ? "☀ Light" : "◑ Dark"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowTest(true)}
          >
            PHQ‑9
          </button>
          <button className="btn btn-ghost btn-sm" onClick={exportPDF}>
            ⬇ PDF
          </button>
          <a
            className="btn btn-ghost btn-sm"
            href="https://www.google.com/maps/search/mental+health+therapist+near+me"
            target="_blank"
            rel="noreferrer"
          >
            Find Help
          </a>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </nav>
      </header>

      <section className="section">
        <h2 className="section-title">Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total entries</div>
            <div className="stat-val">{entries.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">This week</div>
            <div className="stat-val">{thisWeek}</div>
          </div>
          <div className="stat-card stat-streak">
            <div className="stat-label">Streak 🔥</div>
            <div className="stat-val">{streak}d</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Top mood</div>
            <div className="stat-val">{topMood}</div>
          </div>
          {savedScore && (
            <div className="stat-card">
              <div className="stat-label">PHQ‑9 result</div>
              <div
                className={`stat-val score-color-${savedScore.result.toLowerCase()}`}
              >
                {savedScore.result}
              </div>
              <div className="stat-score-sub">
                {savedScore.score}/27 · {savedScore.date}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">This week</h2>
        <MoodChart entries={entries} />
      </section>

      <div className="tab-bar">
        {[
          ["journal", "📓 Journal"],
          ["gratitude", "🌸 Gratitude"],
          ["insights", "✨ AI Insights"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`tab-btn${activeTab === id ? " active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "journal" && (
        <>
          <section className="section">
            <h2 className="section-title">New entry</h2>
            <div className="mood-strip">
              {MOODS.map((m) => (
                <button
                  key={m}
                  className={`mood-btn${m === mood ? " active" : ""}`}
                  onClick={() => setMood(m)}
                  title={MOOD_LABELS[m]}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="journal-box">
              <textarea
                className="journal-textarea"
                placeholder="What's on your mind today…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addEntry();
                }}
              />
              <div className="journal-footer">
                <span className="char-count">
                  {text.length} chars · Ctrl+Enter to save
                </span>
                <button className="btn btn-primary btn-sm" onClick={addEntry}>
                  Save entry
                </button>
              </div>
            </div>
          </section>
          <section className="section">
            <h2 className="section-title">
              Journal — {entries.length}{" "}
              {entries.length === 1 ? "entry" : "entries"}
            </h2>
            <div className="entries-list">
              {entries.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📓</span>
                  <p>No entries yet. Write your first one above.</p>
                </div>
              ) : (
                entries.map((e) => (
                  <div key={e.id} className="entry-card">
                    <div className="entry-header">
                      <div className="entry-meta">
                        <span className="entry-mood">{e.mood}</span>
                        <span className="entry-date">{e.date}</span>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => deleteEntry(e.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="entry-text">{e.text}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === "gratitude" && (
        <section className="section">
          <h2 className="section-title">Gratitude Log 🌸</h2>
          <p className="section-desc">
            Write one thing you're grateful for today. Small things count.
          </p>
          <div className="journal-box" style={{ marginBottom: "1.25rem" }}>
            <textarea
              className="journal-textarea"
              placeholder="Today I'm grateful for…"
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                  addGratitude();
              }}
              style={{ minHeight: "80px" }}
            />
            <div className="journal-footer">
              <span className="char-count">Ctrl+Enter to save</span>
              <button className="btn btn-primary btn-sm" onClick={addGratitude}>
                Add
              </button>
            </div>
          </div>
          <div className="entries-list">
            {gratitudeList.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🌸</span>
                <p>Your gratitude log is empty. Start with one small thing.</p>
              </div>
            ) : (
              gratitudeList.map((g) => (
                <div key={g.id} className="entry-card gratitude-card">
                  <div className="entry-header">
                    <div className="entry-meta">
                      <span className="entry-mood">🌸</span>
                      <span className="entry-date">{g.date}</span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() =>
                        setGratitudeList((prev) =>
                          prev.filter((x) => x.id !== g.id),
                        )
                      }
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="entry-text">{g.text}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "insights" && (
        <section className="section">
          <h2 className="section-title">AI Insight</h2>
          <AIInsightPanel
            insight={aiInsight}
            loading={aiLoading}
            onAnalyze={runAIAnalysis}
            hasData={entries.length > 0 || savedScore !== null}
          />
        </section>
      )}

      {showTest && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay"))
              setShowTest(false);
          }}
        >
          <div className="modal">
            <h2 className="modal-title">PHQ‑9 Assessment</h2>
            <p className="modal-sub">
              Over the last 2 weeks, how often have you been bothered by the
              following?
            </p>
            {QUESTIONS.map((q, i) => (
              <div key={i} className="q-item">
                <p className="q-text">
                  {i + 1}. {q}
                </p>
                <div className="q-options">
                  {Q_OPTIONS.map((label, v) => (
                    <button
                      key={v}
                      className={`q-opt${answers[i] === v ? " selected" : ""}`}
                      onClick={() =>
                        setAnswers((prev) => {
                          const n = [...prev];
                          n[i] = v;
                          return n;
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {answeredAll && (
              <div className="score-section">
                <p className="score-meta">
                  Total score: <strong>{score}</strong> / 27
                </p>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${scorePct}%` }}
                    data-color={result.color}
                  />
                </div>
                <span className={`result-badge badge-${result.color}`}>
                  {result.label} symptoms
                </span>
                <p className="score-disclaimer">
                  This is a screening tool, not a clinical diagnosis. Please
                  consult a healthcare professional.
                </p>
              </div>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setAnswers(Array(9).fill(-1))}
              >
                Reset
              </button>
              {answeredAll && (
                <button className="btn btn-primary" onClick={saveTestResult}>
                  Save Result
                </button>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => setShowTest(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBreathing && (
        <BreathingModal onClose={() => setShowBreathing(false)} />
      )}
      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}
      <Toast message={toastMsg} />
    </div>
  );
}
