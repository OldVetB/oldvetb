import { useState, useEffect, useRef } from "react";

const VOICES = [
  { label: "Adam (Deep, Authoritative)", id: "pNInz6obpgDQGcFmaJgB" },
  { label: "Arnold (Crisp, Narrative)", id: "VR6AewLTigWG4xSOukaG" },
  { label: "Sam (Raspy, News)", id: "yoZ06aMxZJJ28mfd3POQ" },
  { label: "Antoni (Well-Rounded)", id: "ErXwobaYiN019PkySvjV" },
  { label: "Custom Voice ID (from Settings)", id: "custom" },
];

const LS = {
  get: k => { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

function Tag({ text }) {
  const isHash = text.startsWith("#");
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 12,
      fontFamily: "monospace", letterSpacing: 1, margin: "3px 4px 3px 0",
      background: isHash ? "rgba(230,57,70,0.12)" : "rgba(200,168,75,0.12)",
      border: `1px solid ${isHash ? "rgba(230,57,70,0.3)" : "rgba(200,168,75,0.3)"}`,
      color: isHash ? "#e63946" : "#c8a84b",
    }}>{text}</span>
  );
}

function StepRow({ icon, text, state }) {
  const colors = { idle: "#1e2330", active: "rgba(200,168,75,0.08)", done: "rgba(46,204,113,0.07)" };
  const borderColors = { idle: "#1e2330", active: "#c8a84b", done: "#2ecc71" };
  const textColors = { idle: "#6b7591", active: "#c8a84b", done: "#2ecc71" };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
      borderRadius: 8, border: `1px solid ${borderColors[state]}`,
      background: colors[state], transition: "all 0.3s",
    }}>
      <span style={{ fontSize: 20, width: 32, textAlign: "center",
        display: "inline-block", animation: state === "active" ? "spin 1s linear infinite" : "none" }}>
        {state === "done" ? "✅" : icon}
      </span>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 600, color: textColors[state] }}>
        {text}
      </span>
    </div>
  );
}

export default function OldVetB() {
  const [keys, setKeys] = useState({ claude: "", eleven: "", youtube: "", voiceId: "" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);
  const [steps, setSteps] = useState(["idle","idle","idle","idle"]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState(VOICES[0].id);
  const [stability, setStability] = useState("0.5");
  const [audioUrl, setAudioUrl] = useState("");
  const [genVoice, setGenVoice] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [privacy, setPrivacy] = useState("private");
  const [copied, setCopied] = useState("");
  const fileRef = useRef();
  const outputRef = useRef();

  useEffect(() => {
    const ck = LS.get("ovb_ck"), ek = LS.get("ovb_ek"), yk = LS.get("ovb_yk"), vid = LS.get("ovb_vid");
    setKeys({ claude: ck, eleven: ek, youtube: yk, voiceId: vid });
    if (ck && ek) { setKeysSaved(true); }
    else { setSettingsOpen(true); }
  }, []);

  function saveKeys() {
    if (!keys.claude || !keys.eleven) { alert("Enter Claude and ElevenLabs keys at minimum."); return; }
    LS.set("ovb_ck", keys.claude);
    LS.set("ovb_ek", keys.eleven);
    LS.set("ovb_yk", keys.youtube);
    LS.set("ovb_vid", keys.voiceId);
    setKeysSaved(true);
    setSettingsOpen(false);
  }

  function setStep(i, state) {
    setSteps(prev => prev.map((s, idx) => idx === i ? state : s));
  }

  async function generate() {
    if (!keys.claude) { setSettingsOpen(true); return; }
    setGenerating(true);
    setError("");
    setResult(null);
    setSteps(["idle","idle","idle","idle"]);

    const today = new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

    try {
      setSteps(["active","idle","idle","idle"]);
      await new Promise(r => setTimeout(r, 400));

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": keys.claude,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are a veteran military news broadcaster writing for "Old Vet B" YouTube channel. Today is ${today}.

Search the web for the LATEST breaking news on these specific conflicts ONLY:
1. US military operations & threats (North America, South America, Latin America)
2. Russia-Ukraine War
3. Iran — threats, strikes, proxy forces, nuclear program
4. Israel — Gaza, West Bank, Lebanon, regional escalation

Find the most current updates on each one. Then create a complete YouTube video package.

Respond ONLY in valid JSON (absolutely no markdown, no backticks, no extra text before or after):
{
  "title": "YouTube title under 70 chars — punchy, SEO-optimized, includes today's date or 'TODAY'",
  "description": "4-5 sentence YouTube description packed with keywords. Mention Old Vet B. Cover US, Russia-Ukraine, Iran, and Israel. End with 'Subscribe for the war news the mainstream media won't tell you.'",
  "hashtags": ["#OldVetB", "#WarNews", "#MilitaryNews", "#RussiaUkraine", "#Iran", "#Israel", "#USMilitary", "#BreakingNews", "#VeteranNews"],
  "tags": ["war news today", "russia ukraine war", "iran news", "israel gaza", "us military news", "veteran news", "old vet b", "breaking military news", "middle east war", "ukraine update"],
  "script": "A FULL 5-minute broadcast script (approximately 750-900 words). Written like a fired-up veteran news anchor. Cover all 4 conflicts — US operations, Russia-Ukraine, Iran, Israel — each gets its own section with latest facts and what it means for America. Start with: 'Good [morning/evening], I am Old Vet B, and this is your war report for ${today}.' Veteran perspective. No spin. No fluff. End with a strong sign-off encouraging viewers to subscribe and share."
}`,
          messages: [{ role: "user", content: "Search for the latest news on: US military operations in North/South America, Russia-Ukraine war, Iran threats and activity, and Israel conflict updates. Then generate the complete Old Vet B video package covering all 4 topics." }],
        }),
      });

      setSteps(["done","active","idle","idle"]);
      await new Promise(r => setTimeout(r, 300));

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);

      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const clean = text.replace(/```json|```/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(clean); }
      catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error("Could not parse AI response. Try again.");
      }

      setSteps(["done","done","active","idle"]);
      await new Promise(r => setTimeout(r, 300));
      setSteps(["done","done","done","active"]);
      await new Promise(r => setTimeout(r, 300));
      setSteps(["done","done","done","done"]);

      setResult(parsed);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 200);

    } catch(err) {
      setError(err.message);
      setSteps(["idle","idle","idle","idle"]);
    }
    setGenerating(false);
  }

  async function generateVoiceover() {
    if (!keys.eleven) { alert("Enter ElevenLabs API key in Settings."); return; }
    if (!result?.script) { alert("Generate a package first."); return; }
    setGenVoice(true);
    setAudioUrl("");

    let vid = voice === "custom" ? keys.voiceId : voice;
    if (!vid) { alert("Enter a custom Voice ID in Settings."); setGenVoice(false); return; }

    try {
      const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
        method: "POST",
        headers: { "xi-api-key": keys.eleven, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.script.slice(0, 5000),
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: parseFloat(stability), similarity_boost: 0.75, style: 0.5, use_speaker_boost: true },
        }),
      });
      if (!resp.ok) {
        const e = await resp.json();
        throw new Error(e.detail?.message || `ElevenLabs error ${resp.status}`);
      }
      const blob = await resp.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch(err) { alert("ElevenLabs error: " + err.message); }
    setGenVoice(false);
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  const s = { // styles
    page: { background: "#080a0e", minHeight: "100vh", color: "#d6dce8", fontFamily: "'Barlow', sans-serif" },
    header: { background: "#0e1117", borderBottom: "1px solid #1e2330", padding: "0 28px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    main: { maxWidth: 860, margin: "0 auto", padding: "32px 24px" },
    card: { background: "#141720", border: "1px solid #1e2330", borderRadius: 12, overflow: "hidden", marginBottom: 20 },
    cardHead: { padding: "14px 20px", borderBottom: "1px solid #1e2330", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" },
    cardTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 2, color: "#f0f4ff", display: "flex", alignItems: "center", gap: 10 },
    cardBody: { padding: 20 },
    input: { width: "100%", background: "#0e1117", border: "1px solid #1e2330", borderRadius: 7, color: "#d6dce8", fontFamily: "'Barlow', sans-serif", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box" },
    label: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#c8a84b", fontWeight: 700, marginBottom: 6, display: "block" },
    btn: (bg, c="#fff") => ({ background: bg, color: c, border: "none", borderRadius: 7, padding: "11px 20px", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", transition: "all 0.2s" }),
    copyBtn: { background: "none", border: "1px solid #1e2330", borderRadius: 5, color: "#6b7591", padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'Barlow', sans-serif" },
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        textarea { resize: vertical; }
        audio { width: 100%; }
      `}</style>

      {/* HEADER */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#e63946", width: 34, height: 34, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: "#fff", letterSpacing: 1 }}>OV</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3, color: "#f0f4ff" }}>OLD VET B</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, letterSpacing: 3, color: "#c8a84b", textTransform: "uppercase" }}>Video Generator</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {keysSaved && <span style={{ fontSize: 12, color: "#2ecc71", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>✓ Keys Saved</span>}
          <button style={s.btn("#1e2330", "#6b7591")} onClick={() => setSettingsOpen(o => !o)}>⚙️ API Settings</button>
        </div>
      </div>

      <div style={s.main}>

        {/* SETTINGS */}
        {settingsOpen && (
          <div style={{ ...s.card, animation: "fadeUp 0.3s ease" }}>
            <div style={s.cardHead}><div style={s.cardTitle}><span style={{ width: 3, height: 16, background: "#c8a84b", borderRadius: 2, display: "inline-block" }}></span>API Keys</div></div>
            <div style={s.cardBody}>
              {[
                { key: "claude", label: "Claude API Key", placeholder: "sk-ant-api03-...", hint: "console.anthropic.com → API Keys" },
                { key: "eleven", label: "ElevenLabs API Key", placeholder: "Your ElevenLabs key...", hint: "elevenlabs.io → Profile → API Key" },
                { key: "youtube", label: "YouTube API Key (optional)", placeholder: "YouTube Data API v3 key...", hint: "console.cloud.google.com" },
                { key: "voiceId", label: "ElevenLabs Custom Voice ID (optional)", placeholder: "Paste Voice ID for custom voice...", hint: "elevenlabs.io → Voices → click voice → Copy voice ID", text: true },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={s.label}>{f.label}</label>
                  <input
                    type={f.text ? "text" : "password"}
                    style={s.input}
                    placeholder={f.placeholder}
                    value={keys[f.key]}
                    onChange={e => setKeys(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                  <div style={{ fontSize: 12, color: "#6b7591", marginTop: 4 }}>{f.hint}</div>
                </div>
              ))}
              <button style={{ ...s.btn("#c8a84b", "#080a0e"), width: "100%", marginTop: 4 }} onClick={saveKeys}>🔒 Save Keys</button>
            </div>
          </div>
        )}

        {/* GENERATE */}
        <div style={{ background: "linear-gradient(135deg, #0d130a, #141720)", border: "1px solid rgba(46,204,113,0.2)", borderRadius: 14, padding: 36, textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: "#f0f4ff", marginBottom: 6 }}>🎬 Generate Video Package</div>
          <div style={{ fontSize: 13, color: "#6b7591", marginBottom: 24 }}>
            Searches live news on <span style={{ color: "#c8a84b", fontWeight: 600 }}>US · Russia-Ukraine · Iran · Israel</span> → writes your <span style={{ color: "#c8a84b", fontWeight: 600 }}>5-minute script</span> + title + hashtags
          </div>
          <button
            disabled={generating}
            onClick={generate}
            style={{ background: generating ? "#1e2330" : "linear-gradient(135deg, #2ecc71, #27ae60)", color: "#fff", border: "none", borderRadius: 10, padding: "16px 48px", fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 4, cursor: generating ? "not-allowed" : "pointer", boxShadow: generating ? "none" : "0 4px 24px rgba(46,204,113,0.25)", opacity: generating ? 0.6 : 1 }}
          >
            {generating ? "⏳ GENERATING..." : "▶ GENERATE NOW"}
          </button>
        </div>

        {/* PROGRESS */}
        {(generating || error) && (
          <div style={{ ...s.card, marginBottom: 28 }}>
            <div style={s.cardHead}><div style={s.cardTitle}><span style={{ width: 3, height: 16, background: "#c8a84b", borderRadius: 2, display: "inline-block" }}></span>{error ? "Error" : "Generating..."}</div></div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: "🌍", text: "Fetching today's war & conflict news from the web" },
                { icon: "📝", text: "Writing your 5-minute broadcast script" },
                { icon: "🏷️", text: "Generating YouTube title, description & hashtags" },
                { icon: "📦", text: "Packaging everything for you" },
              ].map((step, i) => <StepRow key={i} icon={step.icon} text={step.text} state={steps[i]} />)}
              {error && <div style={{ marginTop: 8, padding: 14, background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 8, color: "#e63946", fontSize: 13 }}>⚠️ {error}</div>}
            </div>
          </div>
        )}

        {/* OUTPUT */}
        {result && (
          <div ref={outputRef} style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ background: "linear-gradient(135deg, rgba(46,204,113,0.1), rgba(46,204,113,0.05))", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 10, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: "#2ecc71" }}>Video Package Ready!</div>
                <div style={{ fontSize: 13, color: "#6b7591", marginTop: 2 }}>Generate voiceover below → build in Pictory → upload to YouTube</div>
              </div>
            </div>

            {/* Title & Desc */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <div style={s.cardTitle}><span style={{ width: 3, height: 14, background: "#e63946", borderRadius: 2, display: "inline-block" }}></span>YouTube Title & Description</div>
                <button style={s.copyBtn} onClick={() => copyText(`TITLE:\n${result.title}\n\nDESCRIPTION:\n${result.description}`, "titledesc")}>
                  {copied === "titledesc" ? "✓ Copied!" : "Copy All"}
                </button>
              </div>
              <div style={s.cardBody}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: "#f0f4ff", marginBottom: 10 }}>{result.title}</div>
                <div style={{ fontSize: 13, color: "#6b7591", lineHeight: 1.8 }}>{result.description}</div>
              </div>
            </div>

            {/* Tags */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <div style={s.cardTitle}><span style={{ width: 3, height: 14, background: "#e63946", borderRadius: 2, display: "inline-block" }}></span>Hashtags & Tags</div>
                <button style={s.copyBtn} onClick={() => copyText([...(result.hashtags||[]), ...(result.tags||[])].join(" "), "tags")}>
                  {copied === "tags" ? "✓ Copied!" : "Copy All"}
                </button>
              </div>
              <div style={s.cardBody}>
                {[...(result.hashtags||[]), ...(result.tags||[])].map((t, i) => <Tag key={i} text={t} />)}
              </div>
            </div>

            {/* Script */}
            <div style={s.card}>
              <div style={s.cardHead}>
                <div style={s.cardTitle}><span style={{ width: 3, height: 14, background: "#e63946", borderRadius: 2, display: "inline-block" }}></span>5-Minute Broadcast Script</div>
                <button style={s.copyBtn} onClick={() => copyText(result.script, "script")}>
                  {copied === "script" ? "✓ Copied!" : "Copy Script"}
                </button>
              </div>
              <div style={s.cardBody}>
                <div style={{ background: "#060810", border: "1px solid #1e2330", borderRadius: 8, padding: 20, fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap", maxHeight: 500, overflowY: "auto", color: "#d6dce8" }}>
                  {result.script}
                </div>
              </div>
            </div>

            {/* ElevenLabs */}
            <div style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), #141720)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: "#f0f4ff", marginBottom: 6 }}>🎙️ Generate Voiceover</div>
              <div style={{ fontSize: 13, color: "#6b7591", marginBottom: 16 }}>Send script to ElevenLabs → download MP3 → import into Pictory</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ ...s.label, color: "#8b5cf6" }}>Voice</label>
                  <select style={{ ...s.input, border: "1px solid rgba(139,92,246,0.3)" }} value={voice} onChange={e => setVoice(e.target.value)}>
                    {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={{ ...s.label, color: "#8b5cf6" }}>Stability</label>
                  <select style={{ ...s.input, border: "1px solid rgba(139,92,246,0.3)" }} value={stability} onChange={e => setStability(e.target.value)}>
                    <option value="0.7">High (Consistent)</option>
                    <option value="0.5">Medium (Balanced)</option>
                    <option value="0.3">Low (Expressive)</option>
                  </select>
                </div>
                <button
                  disabled={genVoice}
                  onClick={generateVoiceover}
                  style={{ background: genVoice ? "#1e2330" : "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff", border: "none", borderRadius: 7, padding: "11px 22px", fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 1, cursor: genVoice ? "not-allowed" : "pointer", opacity: genVoice ? 0.6 : 1, whiteSpace: "nowrap" }}
                >
                  {genVoice ? "⏳ Generating..." : "🎙️ Generate MP3"}
                </button>
              </div>
              {audioUrl && (
                <div style={{ marginTop: 16, padding: 14, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8 }}>
                  <audio controls src={audioUrl} style={{ width: "100%", marginBottom: 10 }} />
                  <a href={audioUrl} download="OldVetB-Voiceover.mp3" style={{ ...s.btn("linear-gradient(135deg, #8b5cf6, #7c3aed)"), textDecoration: "none", display: "inline-block" }}>⬇️ Download MP3</a>
                </div>
              )}
            </div>

            {/* YouTube Upload */}
            <div style={{ background: "linear-gradient(135deg, rgba(230,57,70,0.08), #141720)", border: "1px solid rgba(230,57,70,0.25)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 2, color: "#f0f4ff", marginBottom: 6 }}>🔴 Upload to YouTube</div>
              <div style={{ fontSize: 13, color: "#6b7591", marginBottom: 16 }}>Download your Pictory video → upload to YouTube Studio with pre-filled title/tags</div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <a href="https://studio.youtube.com" target="_blank" rel="noreferrer" style={{ ...s.btn("#e63946"), textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>🔴 Open YouTube Studio</a>
                <a href="https://app.pictory.ai" target="_blank" rel="noreferrer" style={{ ...s.btn("#1e2330", "#c8a84b"), border: "1px solid rgba(200,168,75,0.3)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>🎬 Open Pictory</a>
              </div>

              <div style={{ fontSize: 12, color: "#6b7591", background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "10px 14px", lineHeight: 1.6 }}>
                📋 <strong style={{ color: "#c8a84b" }}>Workflow:</strong> Copy script → paste into Pictory → import MP3 voiceover → generate video → download → upload to YouTube Studio → paste title/description/tags → publish
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
