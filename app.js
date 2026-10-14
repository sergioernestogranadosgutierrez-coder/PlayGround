/* OnceLabs — clon funcional de ElevenLabs. TTS local (Web Speech) + API real opcional. */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const CURATED = [
  { id: "rachel", name: "Rachel", lang: "en", cat: "Narr", desc: "Joven, cálida y versátil. La más usada.", color: "#ec4899", tags: ["English", "Narración", "Joven"] },
  { id: "drew", name: "Drew", lang: "en", cat: "Ads", desc: "Masculina, grave y segura. Ideal anuncios.", color: "#3b82f6", tags: ["English", "Anuncios", "Grave"] },
  { id: "clyde", name: "Clyde", lang: "en", cat: "Narr", desc: "Maduro, tono cine y videojuegos.", color: "#8b5cf6", tags: ["English", "Cine", "Maduro"] },
  { id: "sarah", name: "Sarah", lang: "en", cat: "Narr", desc: "Suave y clara para podcasts.", color: "#10b981", tags: ["English", "Podcast", "Suave"] },
  { id: "antoni", name: "Antoni", lang: "en", cat: "Ads", desc: "Varón joven, enérgico.", color: "#f59e0b", tags: ["English", "Joven", "Energía"] },
  { id: "lucia", name: "Lucía", lang: "es", cat: "Narr", desc: "Español neutro, perfecta para narración.", color: "#ef4444", tags: ["Español", "Narración", "Neutra"] },
  { id: "diego", name: "Diego", lang: "es", cat: "Ads", desc: "Español grave para publicidad.", color: "#06b6d4", tags: ["Español", "Anuncios", "Grave"] },
  { id: "valeria", name: "Valeria", lang: "es", cat: "Narr", desc: "Femenina dulce, audiolibros.", color: "#d946ef", tags: ["Español", "Audiolibro", "Dulce"] },
  { id: "emily", name: "Emily", lang: "en", cat: "Narr", desc: "Femenina tranquila, meditación.", color: "#84cc16", tags: ["English", "Calma", "ASMR"] },
  { id: "thomas", name: "Thomas", lang: "en", cat: "Ads", desc: "Documentales y trailers.", color: "#f97316", tags: ["English", "Trailer", "Documental"] },
  { id: "camille", name: "Camille", lang: "fr", cat: "Narr", desc: "Francés elegante.", color: "#6366f1", tags: ["Français", "Elegante"] },
  { id: "rafael", name: "Rafael", lang: "pt", cat: "Ads", desc: "Portugués cálido y comercial.", color: "#14b8a6", tags: ["Português", "Comercial"] },
];
// Voice IDs reales de ElevenLabs (públicos) para cuando hay API key
const EL_VOICE_IDS = { rachel: "21m00Tcm4TlvDq8ikWAM", drew: "29vD33N1CtxCmqQRPOHJ2", clyde: "2EiwWnXFnvU5JabPnv8n", sarah: "EXAVITQu4vr4xnSDxMaL", antoni: "ErXwobaYiN019PkySvjV", emily: "LcfcDJNUP1GQjkzn1xUU", thomas: "GBv7mTt0lZsSiMalrvP6" };

let state = { voice: "rachel", sysVoices: [], filter: "all", credits: 10000, customVoices: [] };
try { state.customVoices = JSON.parse(localStorage.getItem("oncelabs_custom") || "[]"); } catch {}
try { state.credits = Number(localStorage.getItem("oncelabs_credits") || 10000); } catch {}

const apiKey = () => (localStorage.getItem("oncelabs_xi_key") || "").trim();
const allVoices = () => [...CURATED, ...state.customVoices];
const voiceById = (id) => allVoices().find((v) => v.id === id) || CURATED[0];

/* ---------- Tabs ---------- */
function goTab(name) {
  if (name === "pricing") name = "pricing";
  $$(".side-item").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === "panel-" + name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$("[data-tab]").forEach((b) => b.addEventListener("click", () => goTab(b.dataset.tab)));
$("#pricingBtn").addEventListener("click", () => goTab("pricing"));
$("#ctaBtn").addEventListener("click", () => goTab("tts"));
$("#brandHome").addEventListener("click", () => goTab("tts"));
$("#bannerBtn").addEventListener("click", () => goTab("tts"));

/* ---------- API key ---------- */
function refreshKeyUI() {
  const k = apiKey();
  $("#apiStatus").textContent = k ? "✅ Clave guardada (" + k.slice(0, 6) + "…). Modo ElevenLabs real activado." : "Sin clave: modo local gratuito.";
  ["#apiKeyInput", "#apiKeyInput2", "#apiKeyInput3"].forEach((s) => { const el = $(s); if (el && document.activeElement !== el) el.value = k; });
}
function saveKey(v) {
  localStorage.setItem("oncelabs_xi_key", (v || "").trim());
  refreshKeyUI();
  toast(apiKey() ? "Clave guardada. Ya puedes generar MP3 reales." : "Clave eliminada. Modo local.");
}
["#saveKeyBtn", "#saveKeyBtn2", "#saveKeyBtn3"].forEach((s, i) => $(s).addEventListener("click", () => saveKey($(["#apiKeyInput", "#apiKeyInput2", "#apiKeyInput3"][i]).value)));
$("#apiKeyBtn").addEventListener("click", () => $("#apiModal").classList.add("open"));
$("#sideCta").addEventListener("click", () => $("#apiModal").classList.add("open"));
$("#apiModalClose").addEventListener("click", () => $("#apiModal").classList.remove("open"));

/* ---------- System voices ---------- */
function loadSysVoices() {
  try { state.sysVoices = speechSynthesis.getVoices(); } catch { state.sysVoices = []; }
  renderVoiceGrid(); renderLib(); fillChangerVoices();
}
if ("speechSynthesis" in window) { loadSysVoices(); speechSynthesis.onvoiceschanged = loadSysVoices; }
else { renderVoiceGrid(); renderLib(); }

function pickSysVoice(cur) {
  const vs = state.sysVoices;
  if (!vs.length) return null;
  const wantEs = cur.lang === "es", wantFr = cur.lang === "fr", wantPt = cur.lang === "pt";
  const langSel = $("#langSel").value || "es-ES";
  let pool = vs.filter((v) => v.lang && v.lang.startsWith(langSel.slice(0, 2)));
  if (!pool.length) pool = vs.filter((v) => wantEs ? v.lang.startsWith("es") : wantFr ? v.lang.startsWith("fr") : wantPt ? v.lang.startsWith("pt") : v.lang.startsWith("en"));
  if (!pool.length) pool = vs;
  const fem = /female|maria|lucia|paulina|helena|zira|samantha|karen|veena|tessa/i.test(cur.name + cur.desc);
  const ranked = [...pool].sort((a, b) => {
    const score = (v) => (v.localService ? 1 : 0) + (/google|natural|neural/i.test(v.name) ? 2 : 0) + (fem && /female|zira|samantha|helena|lucia/i.test(v.name) ? 1 : 0);
    return score(b) - score(a);
  });
  return ranked[0];
}

/* ---------- Voice UI ---------- */
function renderVoiceGrid() {
  const q = ($("#voiceSearch").value || "").toLowerCase();
  const grid = $("#voiceGrid"); grid.innerHTML = "";
  allVoices().filter((v) => (v.name + v.desc + v.tags.join(" ")).toLowerCase().includes(q)).forEach((v) => {
    const b = document.createElement("button");
    b.className = "voice-card" + (state.voice === v.id ? " sel" : "");
    b.innerHTML = `<span class="ava" style="background:${v.color}">${v.name[0]}</span><span><b>${v.name}</b><small>${v.desc}</small></span><span class="play" title="Previsualizar">▶</span>`;
    b.onclick = (e) => {
      if (e.target.classList.contains("play")) { e.stopPropagation(); previewVoice(v.id); return; }
      state.voice = v.id;
      $$("#voiceGrid .voice-card").forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
    };
    grid.appendChild(b);
  });
}
function renderLib() {
  const lib = $("#voiceLib"); if (!lib) return; lib.innerHTML = "";
  allVoices().filter((v) => state.filter === "all" || v.tags.join(" ").toLowerCase().includes(state.filter.toLowerCase()) || v.cat === state.filter).forEach((v) => {
    const d = document.createElement("div"); d.className = "lib-card";
    d.innerHTML = `<div class="top"><span class="ava" style="background:${v.color}">${v.name[0]}</span><div><b>${v.name}</b><div class="muted" style="font-size:12px">${v.desc}</div></div></div><div class="tags">${v.tags.map((t) => `<span>${t}</span>`).join("")}</div><div class="row"><button class="mini" data-p="${v.id}">▶ Escuchar</button><button class="mini" data-u="${v.id}">＋ Usar</button></div>`;
    lib.appendChild(d);
  });
  lib.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => previewVoice(b.dataset.p));
  lib.querySelectorAll("[data-u]").forEach((b) => b.onclick = () => { state.voice = b.dataset.u; renderVoiceGrid(); goTab("tts"); toast("Voz " + voiceById(b.dataset.u).name + " seleccionada."); });
}
$("#voiceSearch").addEventListener("input", renderVoiceGrid);
$$(".chip").forEach((c) => c.addEventListener("click", () => { $$(".chip").forEach((x) => x.classList.remove("active")); c.classList.add("active"); state.filter = c.dataset.f; renderLib(); }));
function fillChangerVoices() {
  const s = $("#changerVoice"); s.innerHTML = "";
  allVoices().forEach((v) => { const o = document.createElement("option"); o.value = v.id; o.textContent = v.name + " — " + v.desc; s.appendChild(o); });
}

/* ---------- TTS core ---------- */
function speakLocal(text, { onend } = {}) {
  const v = voiceById(state.voice);
  const u = new SpeechSynthesisUtterance(text);
  const sys = pickSysVoice(v);
  if (sys) u.voice = sys;
  u.lang = $("#langSel").value || "es-ES";
  u.rate = ($("#speed").value || 100) / 100;
  u.pitch = 1 + (($("#styleEx").value || 20) - 20) / 200;
  u.volume = 1;
  speechSynthesis.cancel();
  $("#eq").classList.add("on");
  u.onend = u.onerror = () => { $("#eq").classList.remove("on"); onend && onend(); };
  speechSynthesis.speak(u);
  return u;
}
function previewVoice(id) {
  const v = voiceById(id);
  speakLocal(`${v.name}. ${v.desc}. Hola, esta es una muestra de mi voz.`);
  toast("Reproduciendo muestra: " + v.name);
}
async function elevenTTS(text) {
  const key = apiKey();
  const v = voiceById(state.voice);
  const vid = EL_VOICE_IDS[v.id] || EL_VOICE_IDS.rachel;
  const model = $("#modelSel").value === "eleven_v3" ? "eleven_v3" : $("#modelSel").value === "turbo_v2" ? "eleven_turbo_v2_5" : $("#modelSel").value === "flash_v2" ? "eleven_flash_v2_5" : "eleven_multilingual_v2";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: model, voice_settings: { stability: $("#stability").value / 100, similarity_boost: $("#similarity").value / 100, style: $("#styleEx").value / 100, use_speaker_boost: true } }),
  });
  if (!res.ok) throw new Error("ElevenLabs " + res.status + ": " + (await res.text()).slice(0, 200));
  return await res.blob();
}
function costOf(text) { return Math.max(1, Math.round(text.length * 1.0)); }
function spendCredits(n) {
  state.credits = Math.max(0, state.credits - n);
  localStorage.setItem("oncelabs_credits", state.credits);
  $("#creditsNum").textContent = state.credits.toLocaleString("es");
}
function addHistory(text, audioURL) {
  const v = voiceById(state.voice);
  const h = JSON.parse(localStorage.getItem("oncelabs_hist") || "[]");
  h.unshift({ t: Date.now(), text: text.slice(0, 120), voice: v.name, model: $("#modelSel").selectedOptions[0].textContent, url: audioURL || null });
  localStorage.setItem("oncelabs_hist", JSON.stringify(h.slice(0, 30)));
  renderHistory();
}
function renderHistory() {
  const h = JSON.parse(localStorage.getItem("oncelabs_hist") || "[]");
  const item = (x) => `<div class="hist"><span>🔊</span><span><b>${x.voice}</b> · ${x.model}<br><small>${new Date(x.t).toLocaleString("es")} — ${x.text}…</small></span><span class="spacer"></span>${x.url ? `<button class="mini" onclick="window.open('${x.url}','_blank')">⬇</button>` : ""}<button class="mini" data-re="${x.text.replace(/"/g, "&quot;")}">↻</button></div>`;
  $("#historyMini").innerHTML = h.slice(0, 4).map(item).join("") || '<p class="hint">Aún no hay generaciones.</p>';
  $("#historyFull").innerHTML = h.map(item).join("") || '<p class="hint">Aún no hay generaciones.</p>';
  $$("#historyMini [data-re],#historyFull [data-re]").forEach((b) => b.onclick = () => { $("#ttsText").value = b.dataset.re; updateCount(); goTab("tts"); });
}
$("#ttsText").addEventListener("input", updateCount);
function updateCount() {
  const t = $("#ttsText").value;
  $("#charCount").textContent = `${t.length.toLocaleString("es")} / 5.000`;
  $("#costHint").textContent = `≈ ${costOf(t).toLocaleString("es")} créditos`;
}
$("#sampleBtn").onclick = () => { $("#ttsText").value = "En un lugar de la Mancha, de cuyo nombre no quiero acordarme, vivía un hidalgo cuya voz parecía creada por inteligencia artificial. ¿Puedes notar las pausas... y la entonación? Esta es la calidad de OnceLabs."; updateCount(); };
$("#clearBtn").onclick = () => { $("#ttsText").value = ""; updateCount(); };
$("#txtFile").addEventListener("change", async (e) => {
  const f = e.target.files[0]; if (!f) return;
  $("#ttsText").value = (await f.text()).slice(0, 5000); updateCount();
});
$("#stopBtn").onclick = () => { try { speechSynthesis.cancel(); } catch {} const a = $("#audioPlayer"); a.pause(); $("#eq").classList.remove("on"); setStatus("Detenido."); };
$("#generateBtn").onclick = async () => {
  const text = $("#ttsText").value.trim();
  if (!text) return toast("Escribe primero un texto.");
  if (!("speechSynthesis" in window) && !apiKey()) return toast("Tu navegador no soporta síntesis local. Añade una API key.");
  const btn = $("#generateBtn"); btn.disabled = true; btn.textContent = "⏳ Generando…";
  setStatus("Generando con " + voiceById(state.voice).name + "…");
  try {
    if (apiKey()) {
      const blob = await elevenTTS(text);
      const url = URL.createObjectURL(blob);
      const a = $("#audioPlayer"); a.style.display = "block"; a.src = url; a.play();
      a.dataset.blob = url; spendCredits(costOf(text)); addHistory(text, url);
      setStatus("✅ MP3 real de ElevenLabs listo.");
    } else {
      if ($("#autoplay").checked !== false) speakLocal(text);
      spendCredits(costOf(text)); addHistory(text, null);
      setStatus("✅ Reproduciendo con voz local gratuita. Añade API key para MP3 descargable.");
    }
  } catch (err) { console.error(err); setStatus("❌ " + err.message); toast("Error: " + err.message); }
  btn.disabled = false; btn.textContent = "▶ Generar voz";
};
$("#downloadBtn").onclick = async () => {
  const a = $("#audioPlayer");
  if (a.dataset.blob) { const l = document.createElement("a"); l.href = a.dataset.blob; l.download = "oncelabs-" + state.voice + ".mp3"; l.click(); return; }
  if (!apiKey()) return toast("La descarga MP3 necesita tu API key de ElevenLabs (la reproducción local ya es gratis).");
  $("#generateBtn").click();
};
function setStatus(t) { $("#statusLine").textContent = t; }
function toast(t) { setStatus(t); }

/* sliders */
[["#stability", "#vStab", "%"], ["#similarity", "#vSim", "%"], ["#styleEx", "#vStyle", "%"]].forEach(([a, b]) => $(a).addEventListener("input", (e) => $(b).textContent = e.target.value + "%"));
$("#speed").addEventListener("input", (e) => $("#vSpeed").textContent = (e.target.value / 100).toFixed(2) + "×");
$("#clearHistory").onclick = () => { localStorage.removeItem("oncelabs_hist"); renderHistory(); };
$("#ssmlBtn").onclick = () => toast("Tip SSML: usa <break time='500ms'/> y <prosody rate='slow'> con la API real.");

/* ---------- SFX ---------- */
const SFX_IDEAS = ["Olas del mar en tormenta", "Multitud aplaudiendo en estadio", "Sable láser futurista", "Lluvia sobre tejado", "Motor V8 acelerando", "Pájaros al amanecer", "Explosión lejana", "Taza de café vertiéndose"];
$("#sfxIdeas").innerHTML = SFX_IDEAS.map((s) => `<button>${s}</button>`).join("");
$$("#sfxIdeas button").forEach((b) => b.onclick = () => $("#sfxPrompt").value = b.textContent);
$("#sfxBtn").onclick = async () => {
  const p = $("#sfxPrompt").value.trim() || "Olas del mar";
  if (apiKey()) {
    $("#sfxMsg").textContent = "Generando con ElevenLabs Text-to-SFX…";
    try {
      const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", { method: "POST", headers: { "xi-api-key": apiKey(), "Content-Type": "application/json" }, body: JSON.stringify({ text: p, duration_seconds: Number($("#sfxDur").value), prompt_influence: 0.3 }) });
      if (!r.ok) throw new Error(await r.text());
      const url = URL.createObjectURL(await r.blob());
      const a = $("#sfxAudio"); a.style.display = "block"; a.src = url; a.play();
      $("#sfxMsg").textContent = "✅ Efecto real generado.";
    } catch (e) { $("#sfxMsg").textContent = "❌ " + e.message; }
    return;
  }
  // Demo local: ruido filtrado sintetizado
  $("#sfxMsg").textContent = "Sintetizando demo local de " + $("#sfxDur").value + "s: «" + p + "»…";
  const dur = Number($("#sfxDur").value), ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const low = /mar|ola|lluvia|viento/i.test(p), deep = /explosi|motor|trueno/i.test(p);
  for (let i = 0; i < d.length; i++) { const t = i / d.length; d[i] = (Math.random() * 2 - 1) * (low ? (0.4 + 0.3 * Math.sin(t * 20)) : 0.5) * (1 - t * 0.3); }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = deep ? "lowpass" : "bandpass"; f.frequency.value = deep ? 220 : low ? 800 : 2000;
  const dest = ctx.createMediaStreamDestination(); src.connect(f); f.connect(ctx.destination); f.connect(dest);
  src.start();
  const rec = new MediaRecorder(dest.stream); const chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => { const url = URL.createObjectURL(new Blob(chunks, { type: "audio/webm" })); const a = $("#sfxAudio"); a.style.display = "block"; a.src = url; $("#sfxMsg").textContent = "✅ Demo local lista (conecta API key para SFX neuronales)."; };
  rec.start(); setTimeout(() => rec.stop(), dur * 1000);
};

/* ---------- STT ---------- */
let recog = null;
$("#sttRecBtn").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast("Dictado no soportado en este navegador. Prueba Chrome.");
  if (recog) { recog.stop(); recog = null; $("#sttRecBtn").textContent = "● Empezar dictado"; return; }
  recog = new SR(); recog.lang = $("#sttLang").value; recog.continuous = true; recog.interimResults = true;
  recog.onresult = (e) => { let t = ""; for (const r of e.results) t += r[0].transcript; $("#sttOut").value = t; };
  recog.onend = () => { recog = null; $("#sttRecBtn").textContent = "● Empezar dictado"; };
  recog.start(); $("#sttRecBtn").textContent = "⏹ Detener";
};
$("#sttCopy").onclick = () => navigator.clipboard.writeText($("#sttOut").value);
$("#sttToTts").onclick = () => { $("#ttsText").value = $("#sttOut").value; updateCount(); goTab("tts"); };
$("#sttFileBtn").onclick = async () => {
  const f = $("#sttFile").files[0]; if (!f) return toast("Elige un archivo primero.");
  if (!apiKey()) return toast("La transcripción de archivos (Scribe) necesita API key. El dictado en vivo es gratis.");
  $("#sttMsg").textContent = "Transcribiendo con Scribe…";
  const fd = new FormData(); fd.append("file", f); fd.append("model_id", "scribe_v1");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": apiKey() }, body: fd });
  const j = await r.json(); $("#sttOut").value = j.text || JSON.stringify(j); $("#sttMsg").textContent = "✅ Transcripción lista.";
};

/* ---------- Changer / Dubbing / Isolator / Agents / Clone ---------- */
let mediaRec = null, mediaChunks = [];
async function recordOnce(ms = 10000) {
  const s = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRec = new MediaRecorder(s); mediaChunks = [];
  mediaRec.ondataavailable = (e) => mediaChunks.push(e.data);
  mediaRec.start();
  return new Promise((res) => setTimeout(() => { mediaRec.onstop = () => res(new Blob(mediaChunks)); mediaRec.stop(); s.getTracks().forEach((t) => t.stop()); }, ms));
}
$("#cloneRecBtn").onclick = async () => { $("#cloneRecBtn").textContent = "● Grabando 5s…"; const b = await recordOnce(5000); const url = URL.createObjectURL(b); const a = $("#cloneAudio"); a.style.display = "block"; a.src = url; a.dataset.url = url; $("#cloneRecBtn").textContent = "● Grabar muestra"; toast("Muestra lista. Ponle nombre y añádela."); };
$("#cloneAddBtn").onclick = () => {
  const n = $("#cloneName").value.trim() || "Mi voz " + (state.customVoices.length + 1);
  state.customVoices.unshift({ id: "custom-" + Date.now(), name: n, lang: "es", cat: "Narr", desc: "Voz local clonada (demo).", color: "#0ea5e9", tags: ["Español", "Personal"] });
  localStorage.setItem("oncelabs_custom", JSON.stringify(state.customVoices));
  renderVoiceGrid(); renderLib(); toast("Voz «" + n + "» añadida.");
};
$("#changerRecBtn").onclick = async () => { $("#changerRecBtn").textContent = "Grabando 5s…"; const b = await recordOnce(5000); $("#changerSrc").src = URL.createObjectURL(b); $("#changerRecBtn").textContent = "● Grabar"; };
$("#changerFile").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) $("#changerSrc").src = URL.createObjectURL(f); });
$("#changerBtn").onclick = () => {
  const v = voiceById($("#changerVoice").value);
  $("#changerMsg").textContent = "Demo: reproduciendo origen con entonación de " + v.name + "…";
  speakLocal("Hola, ahora hablo con la voz de " + v.name + ". Este es el cambiador de voz en modo demo local.");
};
$("#dubBtn").onclick = () => {
  const f = $("#dubFile").files[0];
  $("#dubMsg").textContent = f ? `Demo: doblando «${f.name}» al idioma ${$("#dubLang").selectedOptions[0].text} con la voz ${voiceById(state.voice).name}…` : "Elige un archivo primero (demo).";
  if (f) speakLocal("Esta es una muestra del doblaje. Hello, this is a dubbing sample.");
};
$("#isoBtn").onclick = () => {
  const f = $("#isoFile").files[0]; if (!f) return toast("Sube un audio primero.");
  $("#isoAudio").src = URL.createObjectURL(f); $("#isoAudio").play();
  toast("Demo local: reproduce el original. Con API key se aplica Voice Isolator neuronal.");
};
const botReply = (q) => {
  q = q.toLowerCase();
  if (/precio|costo|cuesta/.test(q)) return "Nuestro plan gratuito incluye diez mil créditos al mes. El plan Starter cuesta cinco euros y es el más popular.";
  if (/voz|voice/.test(q)) return "Tenemos doce voces curadas más las de tu navegador. Mi favorita es Lucía para español y Rachel para inglés.";
  if (/hola|buenas/.test(q)) return "¡Hola! Soy Nova, tu agente de voz. Puedo narrar, doblar y responder preguntas.";
  if (/quien|eleven/.test(q)) return "Soy OnceLabs, un clon educativo de ElevenLabs que funciona gratis en tu navegador con la Web Speech API.";
  return "Interesante. He procesado tu mensaje: " + q.slice(0, 80) + ". Puedo leerte cualquier texto con la voz que elijas.";
};
$("#chatSend").onclick = sendChat;
$("#chatInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });
function sendChat() {
  const inp = $("#chatInput"), t = inp.value.trim(); if (!t) return;
  $("#chatLog").insertAdjacentHTML("beforeend", `<div class="msg user">${t.replace(/</g, "&lt;")}</div>`);
  const r = botReply(t);
  $("#chatLog").insertAdjacentHTML("beforeend", `<div class="msg bot">${r}</div>`);
  $("#chatLog").scrollTop = 1e6; inp.value = "";
  speakLocal(r);
}
$("#chatVoice").onclick = () => { goTab("stt"); toast("Usa el dictado en vivo y envíalo al chat."); };
$("#copyCurl").onclick = () => navigator.clipboard.writeText($("#curlExample").textContent);
$("#curlExample").textContent = $("#curlExample").textContent.replace("VOICE_ID", EL_VOICE_IDS.rachel);

/* init */
$("#creditsNum").textContent = state.credits.toLocaleString("es");
updateCount(); refreshKeyUI(); renderVoiceGrid(); renderLib(); renderHistory(); fillChangerVoices();
