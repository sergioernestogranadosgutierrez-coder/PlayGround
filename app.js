/* OnceLabs — clon funcional de ElevenLabs. TTS local (Web Speech) + API real opcional. */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* Elenco de personajes: cada voz tiene tono (pitch), ritmo (rate), género,
   ritmo narrativo (pace) y frase de muestra con personalidad. En modo local
   (Web Speech) el pitch+rate+entonación crean el personaje; con API key se
   usan voces reales de ElevenLabs + ajustes por personaje. */
const CURATED = [
  { id: "lucia", emoji: "🎙️", name: "Lucía", lang: "es", gender: "f", pitch: 1.0, rate: 0.95, pace: "normal", energy: "mid", desc: "Narradora neutra. La todo-terreno.", color: "#ef4444", tags: ["Español", "mujer", "narracion", "neutra"], sample: "Hola, soy Lucía. Narro vídeos, podcasts y audiolibros con un español claro y neutro." },
  { id: "diego", emoji: "📢", name: "Diego", lang: "es", gender: "m", pitch: 0.5, rate: 0.9, pace: "slow", energy: "mid", desc: "Locutor grave de radio y publicidad.", color: "#06b6d4", tags: ["Español", "hombre", "grave", "anuncios", "locutor"], sample: "Atención... En OnceLabs, las grandes historias... merecen una gran voz." },
  { id: "rachel", emoji: "🌟", name: "Rachel", lang: "en", gender: "f", pitch: 1.2, rate: 1.0, pace: "normal", energy: "mid", desc: "Joven, cálida y versátil. La más usada.", color: "#ec4899", tags: ["English", "mujer", "joven", "narracion"], sample: "Hi! I'm Rachel. Warm, clear and friendly — perfect for almost anything." },
  { id: "drew", emoji: "🦸", name: "Héroe Drew", lang: "en", gender: "m", pitch: 0.8, rate: 1.02, pace: "normal", energy: "high", desc: "Héroe decidido, voz de película.", color: "#3b82f6", tags: ["English", "hombre", "heroe", "cine", "energia"], sample: "No fear! I am Drew, and together... we will save the day!" },
  { id: "clyde", emoji: "🦹", name: "Villano Clyde", lang: "en", gender: "m", pitch: 0.4, rate: 0.8, pace: "dark", energy: "low", desc: "Villano oscuro de cine y videojuegos.", color: "#8b5cf6", tags: ["English", "hombre", "villano", "oscuro", "cine", "terror"], sample: "So... you came... Mua... ja... ja... This kingdom is mine now." },
  { id: "valeria", emoji: "👸", name: "Princesa Valeria", lang: "es", gender: "f", pitch: 1.4, rate: 1.0, pace: "normal", energy: "mid", desc: "Dulce y luminosa, cuentos y audiolibros.", color: "#d946ef", tags: ["Español", "mujer", "princesa", "fantasia", "dulce", "audiolibro"], sample: "¡Hola, hola! Soy la princesa Valeria, y hoy te contaré un cuento mágico." },
  { id: "mateo", emoji: "🧒", name: "Mateo", lang: "es", gender: "m", pitch: 1.6, rate: 1.15, pace: "bright", energy: "high", desc: "Niño alegre y travieso.", color: "#22c55e", tags: ["Español", "hombre", "nino", "infantil", "alegre"], sample: "¡Yupi! ¡Soy Mateo! ¿Jugamos? ¡Tengo mil historias que contarte!" },
  { id: "sofia", emoji: "👧", name: "Sofía", lang: "es", gender: "f", pitch: 1.7, rate: 1.15, pace: "bright", energy: "high", desc: "Niña curiosa y divertida.", color: "#f472b6", tags: ["Español", "mujer", "nino", "infantil", "alegre"], sample: "¡Holaaa! Me llamo Sofía... ¿Sabías que sé contar cuentos? ¡Escucha, escucha!" },
  { id: "teo", emoji: "👴", name: "Abuelo Teo", lang: "es", gender: "m", pitch: 0.6, rate: 0.75, pace: "slow", energy: "low", desc: "Anciano sabio que cuenta historias.", color: "#a16207", tags: ["Español", "hombre", "anciano", "sabio", "cuentos"], sample: "Ay... En mis tiempos... les contaré una historia... de cuando yo era joven..." },
  { id: "rosa", emoji: "👵", name: "Abuela Rosa", lang: "es", gender: "f", pitch: 0.9, rate: 0.75, pace: "slow", energy: "low", desc: "Anciana tierna de cuentos.", color: "#fb923c", tags: ["Español", "mujer", "anciano", "tierna", "cuentos"], sample: "Ven, mi cielo... Siéntate aquí... que la abuela te va a contar un cuento..." },
  { id: "barba", emoji: "🏴‍☠️", name: "Capitán Barba", lang: "es", gender: "m", pitch: 0.5, rate: 0.95, pace: "pirate", energy: "high", desc: "Pirata rudo de los siete mares.", color: "#78350f", tags: ["Español", "hombre", "pirata", "fantasia", "aventura", "villano"], sample: "¡Arrr! ¡Soy el capitán Barba! ¡Todos a cubierta, que zarpamos a la aventura!" },
  { id: "rx7", emoji: "🤖", name: "Robot RX-7", lang: "es", gender: "m", pitch: 0.7, rate: 0.85, pace: "robot", energy: "low", desc: "Robot metálico y monótono.", color: "#64748b", tags: ["Español", "hombre", "robot", "futurista", "metalico"], sample: "Yo. Soy. R. X. Siete. Sis. Te. Ma. En. Li. Nea. Y. O. Be. Dez. Co." },
  { id: "zorp", emoji: "👽", name: "Alien Zorp", lang: "es", gender: "m", pitch: 1.8, rate: 0.8, pace: "alien", energy: "mid", desc: "Extraterrestre chillón y curioso.", color: "#4ade80", tags: ["Español", "hombre", "alien", "fantasia", "extraterrestre"], sample: "Bliip... ¡Saludos, humano! Vengo... del planeta Zorp... a aprender... tus historias." },
  { id: "gruum", emoji: "👹", name: "Orco Gruum", lang: "es", gender: "m", pitch: 0.2, rate: 0.8, pace: "dark", energy: "low", desc: "Monstruo brutal de cueva.", color: "#166534", tags: ["Español", "hombre", "monstruo", "fantasia", "terror", "villano", "ogro"], sample: "Grrr... Yo... ser... Gruuum... ¡No... pasar... sin... mi... permiso!" },
  { id: "lyra", emoji: "🧝", name: "Elfa Lyra", lang: "es", gender: "f", pitch: 1.5, rate: 0.95, pace: "soft", energy: "mid", desc: "Elfa mágica del bosque.", color: "#34d399", tags: ["Español", "mujer", "elfa", "fantasia", "magia", "dulce"], sample: "Que la luz del bosque te acompañe... Soy Lyra... guardiana de los cuentos antiguos..." },
  { id: "morgana", emoji: "🧙", name: "Bruja Morgana", lang: "es", gender: "f", pitch: 0.7, rate: 0.85, pace: "dark", energy: "mid", desc: "Bruja misteriosa con risa malvada.", color: "#7e22ce", tags: ["Español", "mujer", "bruja", "fantasia", "terror", "villano", "magia"], sample: "Bienvenido... a mi cabaña... Jee... jee... jee... Tengo una pócima... solo para ti..." },
  { id: "susu", emoji: "👻", name: "Fantasma Susu", lang: "es", gender: "f", pitch: 1.1, rate: 0.7, pace: "whisper", energy: "low", desc: "Fantasma que susurra en la noche.", color: "#c4b5fd", tags: ["Español", "mujer", "fantasma", "terror", "susurro", "fantasia"], sample: "Shhh... soy Susu... no tengas miedo... solo vengo... a susurrarte... un cuento..." },
  { id: "epico", emoji: "⚔️", name: "Caballero Épico", lang: "es", gender: "m", pitch: 0.5, rate: 0.85, pace: "epic", energy: "high", desc: "Voz de tráiler y batallas.", color: "#b45309", tags: ["Español", "hombre", "heroe", "epico", "trailer", "caballero"], sample: "En un mundo... al borde del abismo... ¡Un héroe... se alzará... para cambiarlo todo!" },
  { id: "chispa", emoji: "🤡", name: "Payaso Chispa", lang: "es", gender: "m", pitch: 1.5, rate: 1.2, pace: "bright", energy: "high", desc: "Payaso loco y fiestero.", color: "#f43f5e", tags: ["Español", "hombre", "payaso", "fiesta", "infantil", "alegre"], sample: "¡Tacháaan! ¡Soy Chispa, el payaso más divertido! ¡Vamos a reírnos muchísimo!" },
  { id: "noir", emoji: "🕵️", name: "Detective Noir", lang: "es", gender: "m", pitch: 0.6, rate: 0.85, pace: "slow", energy: "low", desc: "Detective serio de novela negra.", color: "#334155", tags: ["Español", "hombre", "detective", "serio", "misterio"], sample: "Era una noche lluviosa... cuando el caso... llegó a mi despacho..." },
  { id: "emily", emoji: "🌙", name: "Emily ASMR", lang: "en", gender: "f", pitch: 1.0, rate: 0.7, pace: "whisper", energy: "low", desc: "Susurro suave para dormir y meditar.", color: "#84cc16", tags: ["English", "mujer", "susurro", "calma", "asmr", "dormir"], sample: "Close your eyes... breathe... in... and... out... Everything is calm now..." },
  { id: "antoni", emoji: "🚀", name: "Anunciador Turbo", lang: "en", gender: "m", pitch: 0.9, rate: 1.15, pace: "bright", energy: "high", desc: "Energía pura para anuncios.", color: "#f59e0b", tags: ["English", "hombre", "anuncios", "energia", "joven"], sample: "Hey! Are you ready?! This is the most amazing deal ever! Let's go!" },
  { id: "sabio", emoji: "🧘", name: "Sabio Ancestral", lang: "es", gender: "m", pitch: 0.5, rate: 0.7, pace: "slow", energy: "low", desc: "Maestro milenario de montaña.", color: "#0d9488", tags: ["Español", "hombre", "anciano", "sabio", "calma"], sample: "Respira... joven discípulo... La paciencia... es la mayor de las fuerzas..." },
  { id: "reina", emoji: "👑", name: "Reina Malvada", lang: "es", gender: "f", pitch: 0.8, rate: 0.85, pace: "dark", energy: "mid", desc: "Reina fría y autoritaria.", color: "#991b1b", tags: ["Español", "mujer", "reina", "villano", "fantasia", "terror"], sample: "Arrodíllate... ante tu reina... Este reino... me pertenece... ¡por siempre!" },
  { id: "volt", emoji: "⚡", name: "Super Volt", lang: "es", gender: "m", pitch: 0.7, rate: 1.05, pace: "epic", energy: "high", desc: "Superhéroe eléctrico y veloz.", color: "#eab308", tags: ["Español", "hombre", "heroe", "superheroe", "energia"], sample: "¡Soy Volt! ¡Más rápido que el rayo! ¡Ningún villano escapará esta vez!" },
  { id: "colt", emoji: "🤠", name: "Vaquero Colt", lang: "es", gender: "m", pitch: 0.6, rate: 0.9, pace: "slow", energy: "mid", desc: "Vaquero rudo del salvaje oeste.", color: "#92400e", tags: ["Español", "hombre", "vaquero", "oeste", "rudo"], sample: "Forastero... En este pueblo... la palabra... vale más que el oro..." },
  { id: "luna", emoji: "🔬", name: "Científica Luna", lang: "es", gender: "f", pitch: 1.3, rate: 1.1, pace: "bright", energy: "high", desc: "Científica chiflada y genial.", color: "#0891b2", tags: ["Español", "mujer", "cientifica", "loca", "energia", "joven"], sample: "¡Eureka! ¡Mi invento funciona! ¡Voy a convertir palabras... en pura electricidad!" },
  { id: "sarah", emoji: "🎧", name: "Sarah", lang: "en", gender: "f", pitch: 1.1, rate: 0.95, pace: "soft", energy: "mid", desc: "Suave y clara para podcasts.", color: "#10b981", tags: ["English", "mujer", "podcast", "suave"], sample: "Hey there, welcome back to the show. Today we have a truly special story." },
  { id: "thomas", emoji: "🎬", name: "Thomas", lang: "en", gender: "m", pitch: 0.6, rate: 0.9, pace: "slow", energy: "mid", desc: "Documentales y tráilers.", color: "#f97316", tags: ["English", "hombre", "documental", "trailer", "grave"], sample: "In a land forgotten by time... one story... remained untold... until now." },
  { id: "camille", emoji: "🗼", name: "Camille", lang: "fr", gender: "f", pitch: 1.2, rate: 0.95, pace: "soft", energy: "mid", desc: "Francés elegante.", color: "#6366f1", tags: ["Frances", "mujer", "elegante"], sample: "Bonjour... Je suis Camille... Et je vais vous raconter... une belle histoire..." },
];
// Voice IDs reales de ElevenLabs (públicos) para cuando hay API key + ajustes por personaje
const EL_VOICE_IDS = { rachel: "21m00Tcm4TlvDq8ikWAM", drew: "29vD33N1CtxCmqQRPOHJ2", clyde: "2EiwWnXFnvU5JabPnv8n", sarah: "EXAVITQu4vr4xnSDxMaL", antoni: "ErXwobaYiN019PkySvjV", emily: "LcfcDJNUP1GQjkzn1xUU", thomas: "GBv7mTt0lZsSiMalrvP6" };
const EL_FALLBACK = { f: "EXAVITQu4vr4xnSDxMaL", m: "29vD33N1CtxCmqQRPOHJ2" };

let state = { voice: "lucia", gridFilter: "all", sysVoices: [], filter: "all", credits: 10000, customVoices: [] };
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
  refreshKeyUI(); updateEngineBadge();
  toast(apiKey() ? "✅ Clave guardada. Modo ElevenLabs real activado." : "Clave eliminada. Modo local fluido.", apiKey() ? "ok" : "info");
}
["#saveKeyBtn", "#saveKeyBtn2", "#saveKeyBtn3"].forEach((s, i) => $(s).addEventListener("click", () => saveKey($(["#apiKeyInput", "#apiKeyInput2", "#apiKeyInput3"][i]).value)));
$("#apiKeyBtn").addEventListener("click", () => $("#apiModal").classList.add("open"));
$("#sideCta").addEventListener("click", () => $("#apiModal").classList.add("open"));
$("#apiModalClose").addEventListener("click", () => $("#apiModal").classList.remove("open"));

/* ---------- System voices ---------- */
function loadSysVoices() {
  try { state.sysVoices = speechSynthesis.getVoices(); } catch { state.sysVoices = []; }
  renderVoiceGrid(); renderLib(); fillChangerVoices(); updateEngineBadge();
}
if ("speechSynthesis" in window) { loadSysVoices(); speechSynthesis.onvoiceschanged = loadSysVoices; }
else { renderVoiceGrid(); renderLib(); }

const FEMALE_HINTS = /female|femenin|maria|lucia|paulina|helena|zira|samantha|karen|veena|tessa|sofia|elena|laura|monica|carmen|ana|rosa|valeria|emily|sarah|rachel|camille|google.*espa.*f|microsoft.*(sabina|helena|laura|elena)/i;
const MALE_HINTS = /male|masculin|diego|jorge|carlos|pablo|miguel|pedro|antonio|hombre|david|daniel|alvaro|sergio|tomas|thomas|drew|clyde|george|harry|liam|microsoft.*(pablo|raul|alvaro)/i;

function pickSysVoice(cur) {
  const vs = state.sysVoices;
  if (!vs.length) return null;
  const langSel = ($("#langSel") && $("#langSel").value) || "es-ES";
  const wantLang = (cur.lang && cur.lang !== "es") ? cur.lang : langSel;
  let pool = vs.filter((v) => v.lang && v.lang.startsWith(wantLang.slice(0, 2)));
  if (!pool.length) pool = vs.filter((v) => v.lang && v.lang.startsWith((cur.lang || "es").slice(0, 2)));
  if (!pool.length) pool = vs;
  const wantF = cur.gender === "f";
  const exactLang = (v) => v.lang === wantLang || v.lang.replace("_", "-") === wantLang;
  const ranked = [...pool].sort((a, b) => {
    const score = (v) => {
      let s = 0;
      // Voces en la nube (Google/Neural) suenan mucho más naturales y fluidas
      if (!v.localService) s += 6;
      if (/google|neural|natural|premium|enhanced/i.test(v.name)) s += 5;
      if (/samantha|karen|daniel|jorge|monica|paulina|helena|sabina|elena|laura|xiaoxiao|aria|jenny|guy/i.test(v.name)) s += 2;
      if (exactLang(v)) s += 3;
      if (wantF && FEMALE_HINTS.test(v.name)) s += 4;
      if (!wantF && MALE_HINTS.test(v.name)) s += 4;
      if (!wantF && FEMALE_HINTS.test(v.name) && !/male/i.test(v.name)) s -= 4;
      if (wantF && MALE_HINTS.test(v.name) && !FEMALE_HINTS.test(v.name)) s -= 3;
      return s;
    };
    return score(b) - score(a);
  });
  // Para personajes infantiles preferimos la segunda voz del mismo género (más variedad tímbrica)
  if ((cur.id === "mateo" || cur.id === "sofia") && ranked.length > 1) {
    const sameGender = ranked.filter((v) => wantF ? FEMALE_HINTS.test(v.name) || !MALE_HINTS.test(v.name) : MALE_HINTS.test(v.name) || !FEMALE_HINTS.test(v.name));
    if (sameGender.length > 1) return sameGender[1];
  }
  return ranked[0];
}
function updateEngineBadge() {
  const el = $("#engineBadge"); if (!el) return;
  if (apiKey()) { el.textContent = "ElevenLabs API · MP3 44.1 kHz"; el.dataset.q = "elite"; return; }
  const v = pickSysVoice(voiceById(state.voice));
  if (v && !v.localService && /google|neural|natural|premium/i.test(v.name)) { el.textContent = "Motor neural en la nube · " + v.name; el.dataset.q = "neural"; }
  else if (v) { el.textContent = "Voz del sistema · " + v.name + " · modo fluido"; el.dataset.q = "local"; }
  else { el.textContent = "Buscando voces del sistema…"; el.dataset.q = "search"; }
  // Si tras 2.5s no hay voces TTS en el navegador, avisamos sin bloquear
  setTimeout(() => {
    if (el.dataset.q !== "search") return;
    if (!state.sysVoices.length && !apiKey()) { el.textContent = "Sin voces TTS en este navegador · usa API key"; el.dataset.q = "local"; }
  }, 2500);
}

/* ---------- Voice UI ---------- */
function voiceBadges(v) {
  const tone = v.pitch <= 0.6 ? "⚫ grave" : v.pitch >= 1.4 ? "🔊 agudo" : "🎵 medio";
  const pace = v.rate <= 0.8 ? "🐢 lento" : v.rate >= 1.1 ? "🐇 rápido" : "⏱️ normal";
  return `<span>${v.emoji || "🎭"} ${tone} · ${pace}</span>`;
}
function renderVoiceGrid() {
  const q = ($("#voiceSearch").value || "").toLowerCase();
  const gf = (state.gridFilter || "all").toLowerCase();
  const grid = $("#voiceGrid"); grid.innerHTML = "";
  const list = allVoices().filter((v) => (v.name + " " + v.desc + " " + (v.tags || []).join(" ")).toLowerCase().includes(q))
    .filter((v) => gf === "all" || (v.tags || []).join(" ").toLowerCase().includes(gf));
  if (!list.length) grid.innerHTML = '<p class="hint">Sin resultados para este filtro. Prueba con “Todos”.</p>';
  list.forEach((v) => {
    const b = document.createElement("button");
    b.className = "voice-card" + (state.voice === v.id ? " sel" : "");
    b.innerHTML = `<span class="ava" style="--g:${v.color}">${v.emoji || v.name[0]}</span><span><b>${v.name}</b><small>${v.desc}</small><small style="opacity:.75">${v.pitch ? "tono " + v.pitch.toFixed(1) + " · ritmo " + v.rate.toFixed(2) + "×" : "voz personal"}</small></span><span class="play" title="Previsualizar">▶</span>`;
    b.onclick = (e) => {
      if (e.target.classList.contains("play")) { e.stopPropagation(); previewVoice(v.id); return; }
      state.voice = v.id;
      $$("#voiceGrid .voice-card").forEach((x) => x.classList.remove("sel")); b.classList.add("sel");
      toast("Personaje: " + v.name + " — " + v.desc);
    };
    grid.appendChild(b);
  });
}
function renderLib() {
  const lib = $("#voiceLib"); if (!lib) return; lib.innerHTML = "";
  allVoices().filter((v) => state.filter === "all" || (v.tags || []).join(" ").toLowerCase().includes(state.filter.toLowerCase()) || (v.cat || "") === state.filter).forEach((v) => {
    const d = document.createElement("div"); d.className = "lib-card";
    d.innerHTML = `<div class="top"><span class="ava" style="--g:${v.color}">${v.emoji || v.name[0]}</span><div><b>${v.name}</b><div class="muted" style="font-size:12px">${v.desc}</div></div></div><div class="tags">${(v.tags || []).map((t) => `<span>${t}</span>`).join("")}${v.pitch ? voiceBadges(v) : ""}</div><div class="row"><button class="mini" data-p="${v.id}">▶ Escuchar</button><button class="mini" data-u="${v.id}">＋ Usar</button></div>`;
    lib.appendChild(d);
  });
  lib.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => previewVoice(b.dataset.p));
  lib.querySelectorAll("[data-u]").forEach((b) => b.onclick = () => { state.voice = b.dataset.u; renderVoiceGrid(); goTab("tts"); toast("Voz " + voiceById(b.dataset.u).name + " seleccionada."); });
}
$("#voiceSearch").addEventListener("input", renderVoiceGrid);
$$(".chip").forEach((c) => c.addEventListener("click", () => {
  const inStudio = c.closest("#panel-tts");
  const scope = inStudio ? '.type-row .chip' : '#panel-voices .filters .chip';
  $$(scope).forEach((x) => x.classList.remove("active")); c.classList.add("active");
  if (inStudio) { state.gridFilter = c.dataset.f; renderVoiceGrid(); }
  else { state.filter = c.dataset.f; renderLib(); }
}));
function fillChangerVoices() {
  const s = $("#changerVoice"); s.innerHTML = "";
  allVoices().forEach((v) => { const o = document.createElement("option"); o.value = v.id; o.textContent = v.name + " — " + v.desc; s.appendChild(o); });
}

/* ---------- TTS core: motor de habla fluida ----------
   Cadena: normalizar texto → actuar personaje → trocear en frases
   → encolar con pausas naturales (evita cortes y silencios raros
   de los motores en textos largos) + keepalive anti-corte. */
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function normalizeText(raw) {
  return String(raw || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^[#>\-*]+\s?/gm, "")
    .replace(/[*_`|]/g, "")
    .replace(/(\d)\s*%/g, "$1 por ciento")
    .replace(/(\d)\s*€/g, "$1 euros")
    .replace(/(\d)\s*\$/g, "$1 dólares")
    .replace(/\$\s?(\d)/g, "$1 dólares ")
    .replace(/\betc\.?/gi, "etcétera")
    .replace(/\bej\.?/g, "ejemplo")
    .replace(/\bvs\.?/g, "contra")
    .replace(/\baprox\.?/g, "aproximadamente")
    .replace(/\bDr\.?\s/g, "Doctor ")
    .replace(/\bSr\.?\s/g, "Señor ")
    .replace(/\bSra\.?\s/g, "Señora ")
    .replace(/\bEE\.\s?UU\.?/g, "Estados Unidos")
    .replace(/\bnº\b/gi, "número")
    .replace(/\.{2,}/g, "…")
    .replace(/\s*([.!?…,;:])\s*/g, "$1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function paceText(text, v) {
  if (!v || !v.pace || v.pace === "normal") return text;
  let t = " " + text + " ";
  switch (v.pace) {
    case "slow": t = t.replace(/([,.¿?¡!;:])/g, "$1… "); break;
    case "dark": t = t.replace(/([.¿?¡!])/g, "$1… ").replace(/,/g, ",… "); break;
    case "epic": t = t.replace(/,/g, "… ").replace(/\.\s/g, "… "); break;
    case "whisper": t = t.replace(/\.\s/g, "… ").replace(/,/g, "… "); break;
    case "soft": t = t.replace(/\.\s/g, "… "); break;
    case "bright": t = t.replace(/\.\s/g, "! "); break;
    case "pirate": {
      let n = 0;
      t = "¡Arrr! " + t.replace(/[.!?]\s/g, (m) => (++n % 3 === 0 ? m + "¡Já, já! " : m));
      break;
    }
    case "alien": {
      let n = 0;
      t = "Bliip… " + t.replace(/[.!?]\s/g, (m) => (++n % 2 ? m + "bliip… " : m));
      break;
    }
    case "robot": {
      const words = t.trim().split(/\s+/);
      if (words.length <= 18) return words.join(". ");
      return words.slice(0, 14).join(". ") + " … " + words.slice(14).join(" ");
    }
    default: break;
  }
  return t.replace(/\s{2,}/g, " ").trim();
}

function splitChunks(text, max = 210) {
  const t = text.replace(/\.{2,}/g, "…");
  const parts = t.match(/[^.!?…]+[.!?…]+["»')\]]*\s*|[^.!?…]+$/g) || [t];
  const out = [];
  let cur = "";
  const pushPiece = (p) => {
    if ((cur + p).length <= max) { cur += p; return; }
    if (cur) out.push(cur.trim());
    if (p.length <= max) { cur = p; return; }
    const subs = p.match(/[^,;:]+[,;:]+\s*|[^,;:]+$/g) || [p];
    cur = "";
    for (const q of subs) {
      if ((cur + q).length <= max) cur += q;
      else { if (cur) out.push(cur.trim()); cur = q; }
    }
  };
  for (const p of parts) pushPiece(p);
  if (cur.trim()) out.push(cur.trim());
  return out.filter((c) => c.replace(/[…\s]/g, "").length);
}

let speechSeq = 0;
let speechKeep = null;
function stopKeepalive() { if (speechKeep) { clearInterval(speechKeep); speechKeep = null; } }
function startKeepalive() {
  stopKeepalive();
  speechKeep = setInterval(() => { try { if (speechSynthesis.speaking) speechSynthesis.resume(); } catch {} }, 7000);
}
function setSpeaking(on) { $$(".eq").forEach((e) => e.classList.toggle("on", on)); }

function speakLocal(text, { voiceId, onend, raw = false } = {}) {
  if (!("speechSynthesis" in window)) { onend && onend(); return null; }
  const v = voiceById(voiceId || state.voice);
  const acted = raw ? normalizeText(text) : paceText(normalizeText(text), v);
  const chunks = splitChunks(acted);
  const seq = ++speechSeq;
  speechSynthesis.cancel();
  stopKeepalive();
  setSpeaking(true);
  if (!chunks.length) { setSpeaking(false); onend && onend(); return null; }

  const sys = pickSysVoice(v);
  const lang = ($("#langSel") && $("#langSel").value) || (v.lang === "en" ? "en-US" : v.lang === "fr" ? "fr-FR" : "es-ES");
  const userRate = (($("#speed") && $("#speed").value) || 100) / 100;
  const styleShift = ((($("#styleEx") && $("#styleEx").value) || 20) - 20) / 200;
  const rate = clamp((v.rate || 1) * userRate, 0.4, 1.6);
  const pitch = clamp((v.pitch != null ? v.pitch : 1) + styleShift, 0, 2);
  startKeepalive();

  const finish = () => {
    if (seq !== speechSeq) return;
    stopKeepalive();
    setSpeaking(false);
    onend && onend();
  };
  const step = (i) => {
    if (seq !== speechSeq) return;
    if (i >= chunks.length) return finish();
    const u = new SpeechSynthesisUtterance(chunks[i]);
    if (sys) u.voice = sys;
    u.lang = lang; u.rate = rate; u.pitch = pitch; u.volume = 1;
    const last = i === chunks.length - 1;
    let fired = false;
    const next = () => {
      if (fired || seq !== speechSeq) return;
      fired = true; clearTimeout(wd);
      if (last) return finish();
      const c = chunks[i];
      const pause = /[…!?]$/.test(c.trim()) ? 260 : 90; // respiración natural
      setTimeout(() => step(i + 1), pause);
    };
    const wd = setTimeout(next, 20000); // watchdog: si el motor no emite onend, seguimos
    u.onend = next; u.onerror = next;
    speechSynthesis.speak(u);
  };
  // Pequeña espera tras cancel(): algunos motores descartan el primer utterance
  setTimeout(() => step(0), 50);
  return { cancel: () => { speechSeq++; stopKeepalive(); setSpeaking(false); try { speechSynthesis.cancel(); } catch {} } };
}

function previewVoice(id) {
  const v = voiceById(id);
  state.voice = id; renderVoiceGrid(); updateEngineBadge();
  // raw: la muestra ya trae la actuación del personaje (pausas incluidas)
  speakLocal(v.sample || `${v.name}. ${v.desc}. Hola, esta es una muestra de mi voz.`, { voiceId: id, raw: true });
  toast(`🎭 ${v.name}: ${v.desc}`);
}
function elSettingsFor(v) {
  // Estabilidad/estilo por arquetipo: villanos estables y graves, niños expresivos, robots planos
  if (v.pace === "robot" || v.pace === "alien") return { stability: 0.9, style: 0.0 };
  if (v.pace === "dark" || v.pitch <= 0.6) return { stability: 0.75, style: 0.15 };
  if (v.pace === "whisper" || v.pace === "soft" || v.pace === "slow") return { stability: 0.65, style: 0.3 };
  if (v.pace === "bright" || (v.pitch || 0) >= 1.4) return { stability: 0.3, style: 0.8 };
  if (v.energy === "high") return { stability: 0.4, style: 0.7 };
  return { stability: ($("#stability") && $("#stability").value / 100) || 0.5, style: ($("#styleEx") && $("#styleEx").value / 100) || 0.2 };
}
async function elevenTTS(text) {
  const key = apiKey();
  const v = voiceById(state.voice);
  const vid = EL_VOICE_IDS[v.id] || EL_FALLBACK[v.gender] || EL_VOICE_IDS.rachel;
  const s = elSettingsFor(v);
  const faithful = v.pace === "robot" ? paceText(text, v) : text; // el robot necesita sus pausas
  const model = $("#modelSel").value === "eleven_v3" ? "eleven_v3" : $("#modelSel").value === "turbo_v2" ? "eleven_turbo_v2_5" : $("#modelSel").value === "flash_v2" ? "eleven_flash_v2_5" : "eleven_multilingual_v2";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: faithful, model_id: model, voice_settings: { stability: s.stability, similarity_boost: ($("#similarity") && $("#similarity").value / 100) || 0.75, style: s.style, use_speaker_boost: true } }),
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
$("#stopBtn").onclick = () => {
  speechSeq++; stopKeepalive(); setSpeaking(false);
  try { speechSynthesis.cancel(); } catch {}
  const a = $("#audioPlayer"); a.pause();
  setStatus("⏹ Detenido.");
};
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
      toast("✅ MP3 real de ElevenLabs listo — calidad 44.1 kHz.", "ok");
    } else {
      if ($("#autoplay").checked !== false) speakLocal(text);
      spendCredits(costOf(text)); addHistory(text, null);
      toast("✅ Reproduciendo en modo fluido (fragmentos + respiración). Añade API key para MP3 descargable.", "ok");
    }
  } catch (err) { console.error(err); toast("Error: " + err.message, "err"); }
  btn.disabled = false; btn.textContent = "▶ Generar voz";
};
$("#downloadBtn").onclick = async () => {
  const a = $("#audioPlayer");
  if (a.dataset.blob) { const l = document.createElement("a"); l.href = a.dataset.blob; l.download = "oncelabs-" + state.voice + ".mp3"; l.click(); return; }
  if (!apiKey()) return toast("La descarga MP3 necesita tu API key de ElevenLabs (la reproducción local ya es gratis).");
  $("#generateBtn").click();
};
function setStatus(t) { const el = $("#statusLine"); if (el) el.textContent = t; }
function toast(t, kind = "info") {
  setStatus(t);
  const box = $("#toasts"); if (!box) return;
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.innerHTML = `<span class="dot"></span><span>${String(t)}</span>`;
  box.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 350); }, 3600);
}

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
  state.customVoices.unshift({ id: "custom-" + Date.now(), emoji: "🧑", name: n, lang: "es", gender: "f", pitch: 1.0, rate: 1.0, pace: "normal", energy: "mid", desc: "Voz local clonada (demo).", color: "#0ea5e9", tags: ["Español", "personal", "mujer"] });
  localStorage.setItem("oncelabs_custom", JSON.stringify(state.customVoices));
  renderVoiceGrid(); renderLib(); fillChangerVoices(); toast("Voz «" + n + "» añadida.");
};
$("#changerRecBtn").onclick = async () => { $("#changerRecBtn").textContent = "Grabando 5s…"; const b = await recordOnce(5000); $("#changerSrc").src = URL.createObjectURL(b); $("#changerRecBtn").textContent = "● Grabar"; };
$("#changerFile").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) $("#changerSrc").src = URL.createObjectURL(f); });
$("#changerBtn").onclick = () => {
  const v = voiceById($("#changerVoice").value);
  $("#changerMsg").textContent = `Demo: hablando como ${v.emoji || ""} ${v.name} (tono ${v.pitch}, ritmo ${v.rate})…`;
  speakLocal(`Hola, ahora hablo con la voz de ${v.name}. ${v.sample || "Este es el cambiador de voz en modo demo local."}`, { voiceId: v.id });
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
  if (/voz|voice|personaje/.test(q)) return "Tenemos 30 personajes: pirata, robot, alien, orco, elfa, bruja, fantasma, niños, abuelos, héroes, villanos y más. Mi favorito es el Capitán Barba... ¡Arrr!";
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

/* ---------- Intro / lobby ---------- */
const LOBBY_SHOWCASE = ["lucia", "barba", "rx7", "clyde", "mateo", "morgana"];
function renderLobby() {
  const box = $("#lobbyShow"); if (!box) return;
  box.innerHTML = LOBBY_SHOWCASE.map((id) => {
    const v = voiceById(id);
    return `<button class="lobby-chip" data-id="${id}" type="button"><span class="chip-ava" style="--c:${v.color}">${v.emoji}</span><b>${v.name}</b><small>${v.desc}</small></button>`;
  }).join("");
  box.querySelectorAll(".lobby-chip").forEach((b) => {
    b.addEventListener("click", () => {
      box.querySelectorAll(".lobby-chip").forEach((x) => x.classList.remove("playing"));
      b.classList.add("playing");
      previewVoice(b.dataset.id);
      setTimeout(() => b.classList.remove("playing"), 4000);
    });
  });
}
function enterLobby() {
  const l = $("#lobby"); if (!l || l.classList.contains("gone")) return;
  speechSeq++; stopKeepalive(); setSpeaking(false);
  try { speechSynthesis.cancel(); } catch {}
  l.classList.add("gone");
  document.body.classList.remove("lobby-open");
  setTimeout(() => { l.style.display = "none"; }, 750);
  setTimeout(() => {
    speakLocal("Bienvenido a OnceLabs. Elige tu personaje, escribe el guion y pulsa generar para escuchar voces profesionales.", { voiceId: state.voice });
  }, 700);
}
if ($("#enterBtn")) $("#enterBtn").addEventListener("click", enterLobby);
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && $("#lobby") && !$("#lobby").classList.contains("gone")) enterLobby(); });

/* init */
document.body.classList.add("lobby-open");
// Waveforms con barras aleatorias
$$(".eq").forEach((eq) => {
  if (eq.childElementCount) return;
  eq.innerHTML = Array.from({ length: 22 }, () => "<i></i>").join("");
  [...eq.children].forEach((b) => { b.style.animationDelay = (Math.random() * 0.7).toFixed(2) + "s"; });
});
$("#creditsNum").textContent = state.credits.toLocaleString("es");
renderLobby();
updateCount(); refreshKeyUI(); renderVoiceGrid(); renderLib(); renderHistory(); fillChangerVoices(); updateEngineBadge();
