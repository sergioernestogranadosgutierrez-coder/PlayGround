// BuzzPost ⚡ Cadena automática local: crear→adaptar→aprobar→publicar→responder→medir→mejorar
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const enc = (s) => encodeURIComponent(s);
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2400); }
function audit(accion) {
  const resp = ($("#inResp")?.value || "").trim() || "Equipo";
  const log = store.get("bz_audit", []);
  log.unshift({ fecha: new Date().toLocaleString("es"), resp, accion });
  store.set("bz_audit", log.slice(0, 100));
  renderAudit();
}
const state = { objetivo: "vender", tono: "divertido", emojiImg: "🌮", imgData: "", lastPack: null };

// ---------- UI base ----------
function chipGroup(id, key) { $(id).addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $$(id + " .chip").forEach((c) => c.classList.remove("on")); b.classList.add("on"); state[key] = b.dataset.v; }); }
chipGroup("#chipsObjetivo", "objetivo");
chipGroup("#chipsTono", "tono");
$("#chipsIdeasFiltro").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $$("#chipsIdeasFiltro .chip").forEach((c) => c.classList.remove("on")); b.classList.add("on"); renderIdeas(b.dataset.v); });
$$(".emoji-pick button").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); state.emojiImg = b.dataset.e; state.imgData = ""; $("#heroMockImg").textContent = state.emojiImg; }));
$("#inImg").addEventListener("change", (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { state.imgData = r.result; $("#heroMockImg").innerHTML = `<img src="${r.result}" style="width:100%;border-radius:12px"/>`; }; r.readAsDataURL(f); });
$("#btnTema").addEventListener("click", () => { document.body.classList.toggle("light"); $("#btnTema").textContent = document.body.classList.contains("light") ? "☀️" : "🌙"; });
$$(".pstep").forEach((s) => s.addEventListener("click", () => document.querySelector(s.dataset.goto)?.scrollIntoView({ behavior: "smooth" })));
$$(".fmtprev .chip").forEach((c) => c.addEventListener("click", () => { $$(".fmtprev .chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); const b = $("#fmtBox"); b.className = "fmtbox " + (c.dataset.fmt === "9:16" ? "f916" : c.dataset.fmt === "1:1" ? "f11" : "f169"); b.textContent = c.dataset.fmt; }));
$("#btnDemo").addEventListener("click", () => {
  $("#inNegocio").value = "Tacos Lupita";
  $("#inPromo").value = "2x1 en tacos al pastor este viernes, incluye agua fresca. Solo sucursal centro, de 6pm a 10pm.";
  $("#inPrecio").value = "2x1"; $("#inLink").value = "https://wa.me/5215500000000";
  $("#inDiscurso").value = "Hoy inauguramos el nuevo mercado del centro. Serán 40 locales, precios justos y apoyo directo a productores locales. Habrá música en vivo el sábado, degustaciones gratis y rifa de una canasta. Invitamos a todas las familias a visitarnos de 9am a 9pm. Este proyecto genera 120 empleos y es de ustedes, para ustedes. ¡Los esperamos!";
  toast("Ejemplo cargado 👇 genera o despieza el discurso");
});

// ---------- hashtags / tonos ----------
function buildHashtags(negocio, promo) {
  const base = ["promo", "oferta", "emprendedores", "negociolocal", "viral", "parati", "mexico", "latam"];
  const words = (negocio + " " + promo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !["este", "para", "solo", "incluye", "todos", "esta", "unas", "unos", "con", "por", "los", "las"].includes(w));
  return [...new Set([...words.slice(0, 6), ...base])].slice(0, 12).map((h) => "#" + h.replace(/\s/g, ""));
}
const TONO = {
  divertido: { hook: ["🔥 ¡PARA TODO! 🔥", "😱 ¡No vas a creer esto!", "🤩 ¡Se armó la fiesta!"], cta: "Corre, etiqueta a tu partner 👇", em: "😄🎉🔥" },
  urgente: { hook: ["⏰ ¡SOLO HOY!", "⚠️ ¡Últimas horas!", "🚨 ¡Se acaba!"], cta: "¡No te quedes fuera, es HOY! ⏰", em: "⏰🔥⚡" },
  profesional: { hook: ["Presentamos una oportunidad única", "Calidad que nos distingue"], cta: "Contáctanos para más información.", em: "✅📌" },
  inspirador: { hook: ["✨ Tu momento es ahora", "🌟 Lo bueno se comparte"], cta: "Guárdalo y compártelo con quien lo necesite ✨", em: "✨💛🌟" },
  cercano: { hook: ["¡Hola vecino! 🤗", "¡Familia, les cuento algo bonito!"], cta: "Los esperamos con mucho cariño 🤗", em: "🤗❤️🏠" },
  institucional: { hook: ["📢 Comunicado oficial", "🏛️ Información importante para la ciudadanía"], cta: "Comparte esta información oficial.", em: "🏛️📢" },
};
const OBJ = { vender: "Compra ahora", visitas: "Visítanos", seguidores: "Síguenos", evento: "No faltes", lanzamiento: "Sé de los primeros", comunicado: "Infórmate aquí" };
const META = {
  instagram: { n: "📸 Instagram", max: 2200, formato: "9:16 / 1:1", estilo: "Visual + hashtags", hora: "18:00–21:00", pub: null, tip: "Pegar en app" },
  tiktok: { n: "🎵 TikTok", max: 2200, formato: "9:16 · ≤60s", estilo: "Hook + trend", hora: "19:00–22:00", pub: null, tip: "Requiere app aprobada para API" },
  facebook: { n: "👍 Facebook", max: 63206, formato: "1:1 / 16:9", estilo: "Narrativo", hora: "13:00 y 19:00", pub: (t) => `https://www.facebook.com/sharer/sharer.php?u=${enc($("#inLink").value || location.href)}&quote=${enc(t)}` },
  x: { n: "✖️ X", max: 280, formato: "Texto breve", estilo: "Directo + 2 tags", hora: "12:00 y 18:00", pub: (t) => `https://twitter.com/intent/tweet?text=${enc(t)}` },
  linkedin: { n: "💼 LinkedIn", max: 3000, formato: "1:1 / 16:9", estilo: "Formal", hora: "08:00–10:00", pub: (t) => `https://www.linkedin.com/sharing/share-offsite/?url=${enc($("#inLink").value || location.href)}` },
  youtube: { n: "▶️ YouTube", max: 5000, formato: "16:9 / 9:16 Short", estilo: "Título + descripción", hora: "17:00–20:00", pub: null, tip: "Pegar como Short" },
  whatsapp: { n: "💬 WhatsApp", max: 65536, formato: "Mensaje directo", estilo: "Cercano + CTA", hora: "10:00–20:00", pub: (t) => `https://wa.me/?text=${enc(t)}` },
  telegram: { n: "✈️ Telegram", max: 4096, formato: "Post + botón", estilo: "Directo + link", hora: "12:00–20:00", pub: (t) => `https://t.me/share/url?url=${enc($("#inLink").value || location.href)}&text=${enc(t)}` },
};
(function tablaFormatos() {
  $("#tblFormatos tbody").innerHTML = Object.entries(META).map(([k, m]) => `<tr><td><b>${m.n}</b></td><td>${m.formato}</td><td>${m.max}</td><td>${m.estilo}</td><td>⏰ ${m.hora}</td></tr>`).join("");
})();

// ---------- 1+2 generar ----------
const SENSIBLES = ["voto", "elecci", "candidat", "denuncia", "protesta", "emergencia", "muerto", "fraude", "impuesto", "huelga", "delito"];
const esSensible = (txt) => SENSIBLES.some((w) => txt.toLowerCase().includes(w));
async function generar() {
  const negocio = $("#inNegocio").value.trim();
  let promo = $("#inPromo").value.trim();
  const link = $("#inLink").value.trim(), precio = $("#inPrecio").value.trim();
  if (!negocio || !promo) return toast("⚠️ Escribe tu negocio y tu promo primero");
  const ai = await aiRewrite(promo);
  if (ai) promo = ai;
  const t = TONO[state.tono] || TONO.divertido;
  const hook = t.hook[Math.floor(Math.random() * t.hook.length)];
  const tags = buildHashtags(negocio, promo);
  const extra = precio ? ` 💰 ${precio}` : "";
  const linkTxt = link ? `\n🔗 ${link}` : "";
  const pack = {
    instagram: `${hook}\n${promo}${extra}\n\n📍 ${negocio} — ${t.cta}${linkTxt}\n.\n.\n${tags.slice(0, 10).join(" ")}`,
    tiktok: `POV: te enteras de esto en ${negocio} 😱\n${promo}${extra}\n${t.cta}\n#parati #fyp ${tags.slice(0, 5).join(" ")}${linkTxt}`,
    facebook: `🎉 ¡Atención amigos de ${negocio}! 🎉\n\n${promo}${extra}\n\n${t.cta} Compartan con su familia ❤️${linkTxt}\n\n${tags.slice(0, 6).join(" ")}`,
    x: `${hook} ${promo}${extra} — ${negocio}. ${t.cta}${link ? " " + link : ""} ${tags.slice(0, 3).join(" ")}`,
    linkedin: `En ${negocio} seguimos creciendo 🚀\n\n${promo}${extra}\n\n${t.cta}${linkTxt}\n\n#negocios #emprendimiento`,
    youtube: `TÍTULO: ${hook} en ${negocio} ${extra} ${t.em}\n\nDESCRIPCIÓN: ${promo}\n${t.cta}${linkTxt}\n${tags.slice(0, 8).join(" ")}`,
    whatsapp: `*${hook}* ✅\nHola, soy *${negocio}* 🤗\n\n${promo}${extra}\n\n${t.cta}${link ? "\nPide aquí: " + link : "\nRespóndeme QUIERO 🙌"}`,
    telegram: `${hook}\n${promo}${extra}\n${t.cta}${linkTxt}\n${tags.slice(0, 5).join(" ")}`,
  };
  if (pack.x.length > 280) pack.x = pack.x.slice(0, 277) + "…";
  if ($("#ruleCom").checked && state.objetivo === "comunicado") $$("#netsSel input").forEach((i) => (i.checked = true));
  state.lastPack = { negocio, promo, link, precio, tags, pack, id: "c" + Date.now() };
  renderCards(); renderScore(); pushAprobacion(); saveHistory();
  $("#heroMockText").innerHTML = `<b>${escapeHtml(negocio.toLowerCase().replace(/\s/g, "_"))}</b> ${escapeHtml(pack.instagram.slice(0, 110))}…`;
  audit(`Creó campaña "${negocio}" (objetivo: ${state.objetivo}, tono: ${state.tono})`);
  $("#resultados").scrollIntoView({ behavior: "smooth" });
  toast("⚡ Adaptado a 8 redes → revisa aprobación 👇");
}
$("#btnGenerar").addEventListener("click", generar);
$("#btnMejorar").addEventListener("click", () => { if (!state.lastPack) return; $("#inPromo").value += " ¡Cupo limitado, aparta hoy mismo!"; generar(); });

// ---------- cards ----------
function imgHtml() { return state.imgData ? `<div class="pimg"><img src="${state.imgData}"/></div>` : `<div class="pimg">${state.emojiImg}</div>`; }
function renderCards() {
  const box = $("#cards");
  const sel = $$("#netsSel input:checked").map((i) => i.value);
  const { pack } = state.lastPack;
  box.innerHTML = "";
  sel.forEach((k) => {
    const m = META[k]; if (!m) return;
    const txt = pack[k] ?? "";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<div class="card-head">${m.n}<span class="tag">${txt.length}/${m.max}</span></div>
      <textarea data-k="${k}">${escapeHtml(txt)}</textarea>
      <div class="preview">${imgHtml()}${escapeHtml(txt).replace(/\n/g, "<br>")}</div>
      <div class="card-foot"><span class="count ${txt.length <= m.max ? "ok" : "bad"}">${txt.length <= m.max ? "✅ listo" : "⚠️ muy largo"}</span>
      <button class="mini" data-copy="${k}">📋 Copiar</button>
      ${m.pub ? `<a class="mini pub" target="_blank" rel="noopener" href="${m.pub(txt)}">🚀 Publicar</a>` : `<span class="hint">💡 ${m.tip || "Copiar y pegar"}</span>`}
      <button class="mini" data-reg="${k}">🎲 Otra versión</button></div>`;
    box.appendChild(card);
  });
  box.querySelectorAll("textarea").forEach((ta) => ta.addEventListener("input", () => {
    const k = ta.dataset.k; state.lastPack.pack[k] = ta.value;
    const card = ta.closest(".card");
    card.querySelector(".preview").innerHTML = imgHtml() + escapeHtml(ta.value).replace(/\n/g, "<br>");
    card.querySelector(".tag").textContent = `${ta.value.length}/${META[k].max}`;
    const pub = card.querySelector("a.mini.pub"); if (pub) pub.href = META[k].pub(ta.value);
  }));
  box.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => { await navigator.clipboard.writeText(state.lastPack.pack[b.dataset.copy]).catch(() => {}); toast("📋 Copiado: " + META[b.dataset.copy].n); }));
  box.querySelectorAll("[data-reg]").forEach((b) => b.addEventListener("click", () => { state.lastPack.pack[b.dataset.reg] = "🔥 Versión alterna: " + state.lastPack.pack[b.dataset.reg]; renderCards(); }));
}
$("#btnCopiarTodo").addEventListener("click", async () => { if (!state.lastPack) return toast("Genera primero ⚡"); await navigator.clipboard.writeText(Object.entries(state.lastPack.pack).map(([k, v]) => `=== ${META[k].n} ===\n${v}`).join("\n\n")).catch(() => {}); toast("📋 Pack copiado"); });
$("#btnDescargar").addEventListener("click", () => { if (!state.lastPack) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([`BUZZPOST ⚡ ${state.lastPack.negocio}\n\n` + Object.entries(state.lastPack.pack).map(([k, v]) => `--- ${META[k].n} ---\n${v}`).join("\n\n")], { type: "text/plain" })); a.download = "buzzpost-pack.txt"; a.click(); });
$("#btnLimpiar").addEventListener("click", () => { $("#cards").innerHTML = `<div class="empty">👆 Genera arriba.</div>`; $("#scoreBox").classList.add("hidden"); state.lastPack = null; });

// ---------- score ----------
function renderScore() {
  const { promo, link, precio, tags, pack } = state.lastPack;
  let s = 55; const tips = [];
  if (promo.length > 40 && promo.length < 400) s += 10; else tips.push("✏️ 1–3 frases claras.");
  if (/[🔥🎉😱⏰✨🤩🚀❤️👇✅]/.test(pack.instagram)) s += 8; else tips.push("😀 Agrega 2–4 emojis.");
  if (/👇|corre|visita|compra|escribe|responde|guarda|comparte|quiere/i.test(pack.instagram)) s += 8; else tips.push("📣 Agrega llamado a la acción.");
  if (tags.length >= 6) s += 7;
  if (precio) s += 5; else tips.push("💰 Menciona precio/oferta.");
  if (link) s += 5; else tips.push("🔗 Agrega link/WhatsApp.");
  s = Math.min(99, s);
  if (!tips.length) tips.push("🔥 Excelente: gancho + oferta + CTA + hashtags.");
  $("#scoreBox").classList.remove("hidden");
  $("#scoreNum").textContent = s;
  $("#scoreLabel").textContent = s >= 85 ? "🔥 ¡Listo para viralizar!" : s >= 65 ? "✅ Muy bien" : "⚠️ Mejorémoslo";
  $("#scoreTips").innerHTML = tips.map((t) => `<li>${t}</li>`).join("");
  document.querySelector(".score-ring").style.background = `conic-gradient(${s >= 85 ? "#06d6a0" : s >= 65 ? "#ffd166" : "#ff3d81"} ${s}%, #2b2b5a ${s}%)`;
  $("#statTiempo").textContent = "~" + (30 + Math.floor(Math.random() * 20)) + "s";
}

// ---------- IA opcional (clave OpenAI-compatible, solo en tu navegador) ----------
$("#inAIKey").addEventListener("input", (e) => { try { localStorage.setItem("bz_ai_key", e.target.value.trim()); } catch {} });
async function aiRewrite(promo) {
  let key = "";
  try { key = (localStorage.getItem("bz_ai_key") || "").trim(); } catch {}
  if (!key) return null;
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.8, max_tokens: 220, messages: [{ role: "system", content: "Eres un copywriter experto en redes sociales en español. Reescribe la promo en 1-2 frases vendedoras, con 1 emoji, sin hashtags." }, { role: "user", content: promo }] }),
    });
    clearTimeout(to);
    if (!r.ok) return null;
    const d = await r.json();
    const txt = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
    return (txt || "").trim() || null;
  } catch { return null; }
}

// ---------- motor discurso ----------
$("#btnDiscurso").addEventListener("click", () => {
  const txt = $("#inDiscurso").value.trim();
  if (txt.length < 30) return toast("⚠️ Pega un texto más largo");
  const frases = txt.split(/(?<=[.!?])\s+/).filter((f) => f.length > 15);
  const destacadas = [...frases].sort((a, b) => b.length - a.length).slice(0, 3);
  const clips = [0, 1, 2].map((i) => {
    const base = frases.slice(i * 2, i * 2 + 3).join(" ") || frases[i % frases.length];
    return { t: `Clip ${i + 1} · 00:${String(i * 20).padStart(2, "0")} · 9:16 · ≤30s`, guion: base.slice(0, 160), sub: base.slice(0, 80).toUpperCase() + "..." };
  });
  const slides = frases.slice(0, 5).map((f, i) => `Slide ${i + 1}: ${f.slice(0, 90)}`);
  const wa = `📢 *Resumen*: ${txt.slice(0, 320)}${txt.length > 320 ? "…" : ""}\n\nResponde INFO para más detalles 🙌`;
  $("#discursoOut").innerHTML =
    clips.map((c) => `<div class="clip"><b>🎬 ${c.t}</b><br>🎙️ Guion: ${escapeHtml(c.guion)}<br>💬 Subtítulos: ${escapeHtml(c.sub)}</div>`).join("") +
    `<div class="clip"><b>⭐ Frases destacadas</b><br>${destacadas.map((d) => "• " + escapeHtml(d)).join("<br>")}</div>` +
    `<div class="clip"><b>🖼️ Carrusel (5)</b><br>${slides.map((s) => "• " + escapeHtml(s)).join("<br>")}</div>` +
    `<div class="clip"><b>💬 WhatsApp</b><br>${escapeHtml(wa).replace(/\n/g, "<br>")}<br><button class="mini" id="btnWaUse">➕ Usar como campaña</button></div>`;
  $("#btnWaUse").addEventListener("click", () => { $("#inPromo").value = txt.slice(0, 280); toast("Llevado a Crear 👆 pulsa Generar"); document.querySelector("#crear").scrollIntoView({ behavior: "smooth" }); });
  audit(`Despiezó discurso (${frases.length} frases → 3 clips + carrusel + WA)`);
  if ($("#ruleLive").checked) pubLog("📡 Regla LIVE: clip 1 programado para dentro de 10 min (simulado).");
  toast("⚙️ Discurso despiezado automáticamente");
});

// ---------- conexiones OAuth (simulado + listo para backend) ----------
const REDES = [
  ["facebook", "👍 Facebook", "Graph API"], ["instagram", "📸 Instagram", "Graph API · app aprobada"],
  ["tiktok", "🎵 TikTok", "Display + Video API · app aprobada"], ["x", "✖️ X", "API v2"],
  ["linkedin", "💼 LinkedIn", "UGC API"], ["youtube", "▶️ YouTube", "Data API v3"],
  ["telegram", "✈️ Telegram", "Bot API"], ["whatsapp", "💬 WhatsApp Business", "Cloud API · opt-in"],
];
function getTokens() { return store.get("bz_tokens", {}); }
function renderConns() {
  const tk = getTokens();
  $("#connGrid").innerHTML = "";
  REDES.forEach(([k, n, api]) => {
    const t = tk[k];
    const ok = t && new Date(t.exp) > new Date();
    const d = document.createElement("div");
    d.className = "conn";
    d.innerHTML = `<b>${n}</b><small class="hint">${api}</small><br><span class="st ${ok ? "ok" : "off"}">${ok ? "● Conectado hasta " + t.exp.slice(0, 10) : "○ Sin conectar"}</span><br><button class="mini ${ok ? "" : "pub"}" data-c="${k}">${ok ? "Desconectar" : "🔌 Conectar (OAuth)"}</button>`;
    $("#connGrid").appendChild(d);
  });
  $$("#connGrid [data-c]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.c; const tk2 = getTokens();
    if (tk2[k]) { delete tk2[k]; store.set("bz_tokens", tk2); audit(`Desconectó ${k}`); }
    else {
      // En producción: location.href = `/api/oauth/${k}?return=` + enc(location.href)
      const exp = new Date(Date.now() + 55 * 864e5).toISOString();
      tk2[k] = { token: "demo_" + Math.random().toString(36).slice(2, 10), exp };
      audit(`Conectó ${k} vía OAuth (token hasta ${exp.slice(0, 10)})`);
      toast("🔌 " + k + " conectado (demo). En producción usa /api/oauth/" + k);
    }
    renderConns();
  }));
  const vencidas = Object.entries(tk).filter(([, v]) => new Date(v.exp) < new Date());
  if (vencidas.length) pubLog("⚠️ Token vencido en: " + vencidas.map(([k]) => k).join(", ") + ". Reconecta.");
}

// ---------- aprobación ----------
function getApr() { return store.get("bz_apr", []); }
function pushAprobacion() {
  const l = getApr();
  const txt = state.lastPack.negocio + " " + state.lastPack.promo;
  const sensible = esSensible(txt) || state.objetivo === "comunicado";
  const auto = $("#swAuto").checked && !sensible;
  l.unshift({ id: state.lastPack.id, negocio: state.lastPack.negocio, promo: state.lastPack.promo.slice(0, 90), sensible, estado: auto ? "aprobado" : "pendiente", ts: new Date().toLocaleString("es") });
  store.set("bz_apr", l.slice(0, 30));
  audit(auto ? `Aprobación AUTOMÁTICA (rutinario): "${state.lastPack.negocio}"` : `A revisión MANUAL (sensible): "${state.lastPack.negocio}"`);
  renderApr();
}
function renderApr() {
  const l = getApr();
  $("#aprCount").textContent = l.length;
  $("#aprList").innerHTML = l.length ? "" : `<li class="muted">Sin campañas.</li>`;
  l.forEach((a, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${a.estado === "aprobado" ? "✅" : a.estado === "rechazado" ? "❌" : "⏳"} <b>${escapeHtml(a.negocio)}</b> ${a.sensible ? "<small>· sensible</small>" : "<small>· rutinario</small>"}<br><small>${escapeHtml(a.promo)}… · ${a.ts}</small></span><span><button class="mini" data-ok="${i}">✅</button> <button class="mini" data-no="${i}">❌</button></span>`;
    $("#aprList").appendChild(li);
  });
  $$("#aprList [data-ok]").forEach((b) => b.addEventListener("click", () => setApr(+b.dataset.ok, "aprobado")));
  $$("#aprList [data-no]").forEach((b) => b.addEventListener("click", () => setApr(+b.dataset.no, "rechazado")));
}
function setApr(i, estado) { const l = getApr(); l[i].estado = estado; store.set("bz_apr", l); audit(`${estado === "aprobado" ? "Aprobó" : "Rechazó"} campaña "${l[i].negocio}"`); renderApr(); }

// ---------- publicación automática ----------
function pubLog(m) { const el = $("#pubLog"); el.innerHTML = `<div>${new Date().toLocaleTimeString("es")} — ${m}</div>` + el.innerHTML; }
let autoCount = 0;
async function publicarTodo() {
  const apr = getApr().filter((a) => a.estado === "aprobado");
  if (!state.lastPack && !apr.length) return toast("⚠️ Genera y aprueba primero");
  if (!Object.keys(getTokens()).length) { toast("🔌 Conecta al menos 1 red (o usa Copiar)"); }
  const redes = state.lastPack ? $$("#netsSel input:checked").map((i) => i.value) : [];
  const smart = $("#swSmart").checked;
  pubLog(`🚀 Iniciando publicación automática en ${redes.length} redes ${smart ? "(cola inteligente: mejor horario c/red)" : ""}…`);
  audit(`Inició publicación automática en ${redes.length} redes`);
  for (const r of redes) {
    const tk = getTokens()[r];
    const hora = META[r]?.hora || "";
    if (smart) pubLog(`⏳ ${META[r].n}: encolado para ${hora} (simulado inmediato en demo)…`);
    let ok = false;
    for (let intento = 1; intento <= 3 && !ok; intento++) {
      await new Promise((res) => setTimeout(res, 350));
      // En producción: await fetch(`/api/publish/${r}`, {method:'POST', body: JSON.stringify({text})})
      if (!tk && META[r]?.pub) { ok = true; pubLog(`🔗 ${META[r].n}: publicado vía enlace directo ✅`); }
      else if (!tk) { pubLog(`📋 ${META[r].n}: sin token API → copiado al portapapeles, pega en la app (intento ${intento})`); ok = intento === 3; }
      else if (Math.random() < 0.2 && intento < 3) { pubLog(`⚠️ ${META[r].n}: fallo temporal, reintento ${intento + 1}/3…`); }
      else { ok = true; pubLog(`✅ ${META[r].n}: publicado vía API oficial ✅`); }
    }
    if (ok) { autoCount++; $("#statAuto").textContent = autoCount; registrarMetrica(r); }
  }
  audit(`Publicación automática finalizada (${autoCount} envíos acumulados)`);
  toast("🚀 Publicación automática terminada (ver bitácora)");
}
$("#btnAutoPub").addEventListener("click", publicarTodo);
$("#btnSimLive").addEventListener("click", () => { pubLog("🔴 LIVE detectado → clip 1 generado y encolado a 10 min ✅ (regla automática)"); audit("Regla LIVE disparada: clip en 10 min"); toast("🔴 Simulación LIVE activada"); });

// ---------- calendario ----------
const getCal = () => store.get("bz_cal", []);
function renderCal() {
  const list = getCal();
  $("#calCount").textContent = list.length;
  $("#calList").innerHTML = list.length ? "" : `<li class="muted">Sin programadas.</li>`;
  list.forEach((c, i) => { const li = document.createElement("li"); li.innerHTML = `<span>📌 <b>${escapeHtml(c.negocio)}</b><br><small>${c.fecha} ${c.hora}</small></span><button class="mini" data-del="${i}">❌</button>`; $("#calList").appendChild(li); });
  $$("#calList [data-del]").forEach((b) => b.addEventListener("click", () => { const l = getCal(); l.splice(+b.dataset.del, 1); store.set("bz_cal", l); renderCal(); }));
}
$("#btnProgramar").addEventListener("click", () => {
  const negocio = $("#inNegocio").value.trim() || state.lastPack?.negocio || "Mi negocio";
  const fecha = $("#inFecha").value, hora = $("#inHora").value;
  if (!fecha) return toast("⚠️ Elige fecha");
  const l = getCal(); l.push({ negocio, fecha, hora }); store.set("bz_cal", l); renderCal();
  audit(`Programó "${negocio}" para ${fecha} ${hora}`); toast("📅 Programada");
});
(function initFecha() { $("#inFecha").value = new Date(Date.now() + 864e5).toISOString().slice(0, 10); })();

// ---------- responder: bot + moderación ----------
function getInbox() { return store.get("bz_inbox", []); }
function parseFaq() {
  const m = {};
  $("#inFaq").value.split("\n").forEach((l) => { const i = l.indexOf("="); if (i > 0) m[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); });
  return m;
}
const SPAM = ["gana dinero rapido", "crypto x100", "http://spam", "sigueme y te sigo gratis"];
const INSULTOS = ["tonto", "estupido", "idiota", "odio", "basura"];
function botReply(texto) {
  const t = texto.toLowerCase();
  if (!$("#swBot").checked) return null;
  if ($("#swMod").checked) {
    if (SPAM.some((s) => t.includes(s))) return { mod: "🗑️ Spam ocultado automáticamente." };
    if (INSULTOS.some((s) => t.includes(s))) return { mod: "🛡️ Insulto ocultado. Se escala a humano." };
  }
  const faq = parseFaq();
  for (const [k, v] of Object.entries(faq)) if (t.includes(k)) return { ok: v };
  if (/(gracias|genial|me encanta)/.test(t)) return { ok: "¡Gracias por tu apoyo! ❤️ Compártelo con quien lo necesite 🙌" };
  return { humano: "🤝 Tema delicado: escalado a una persona del equipo." };
}
function pushInbox(texto, auto) {
  const l = getInbox();
  const r = botReply(texto);
  let resp = auto ? "(llegó solo) " : "";
  if (r?.ok) resp += "🤖 Bot: " + r.ok;
  else if (r?.mod) resp += r.mod;
  else if (r?.humano) resp += r.humano;
  else resp += "⏳ Sin bot: pendiente humano.";
  l.unshift({ texto, resp, ts: new Date().toLocaleTimeString("es") });
  store.set("bz_inbox", l.slice(0, 40));
  audit(`Mensaje entrante: "${texto.slice(0, 50)}" → ${resp.slice(0, 60)}`);
  // alerta crisis: 3+ mensajes con insultos/negatividad
  const neg = l.slice(0, 6).filter((m) => /odio|basura|fraude|estafa|denuncia/i.test(m.texto)).length;
  $("#crisisBadge").textContent = neg >= 3 ? "🚨 POSIBLE CRISIS: menciones negativas inusuales" : "";
  if (neg >= 3) pubLog("🚨 ALERTA CRISIS: pico de menciones negativas. Revisión humana urgente.");
  renderInbox();
}
$("#btnInbox").addEventListener("click", () => { const v = $("#inInbox").value.trim(); if (!v) return; $("#inInbox").value = ""; pushInbox(v, false); });
function renderInbox() {
  const l = getInbox();
  $("#inboxCount").textContent = l.length;
  $("#inboxList").innerHTML = l.length ? "" : `<li class="muted">Sin mensajes.</li>`;
  l.slice(0, 12).forEach((m) => { const li = document.createElement("li"); li.innerHTML = `<span>💬 “${escapeHtml(m.texto)}”<br><small>${escapeHtml(m.resp)} · ${m.ts}</small></span>`; $("#inboxList").appendChild(li); });
}

// ---------- medir: métricas + chart + A/B + informe + mejoras ----------
function getMet() { const d = store.get("bz_met", null); if (d) return d; const init = { instagram: 1200, tiktok: 2100, facebook: 800, x: 450, linkedin: 300, youtube: 600, whatsapp: 950, telegram: 200 }; store.set("bz_met", init); return init; }
function registrarMetrica(red) { const m = getMet(); m[red] = (m[red] || 0) + 150 + Math.floor(Math.random() * 400); store.set("bz_met", m); drawChart(); autoMejorar(); }
function drawChart() {
  const c = $("#chart"); const x = c.getContext("2d"); const m = getMet();
  x.clearRect(0, 0, c.width, c.height);
  const keys = Object.keys(m); const max = Math.max(...Object.values(m));
  const bw = c.width / keys.length;
  keys.forEach((k, i) => {
    const h = (m[k] / max) * 150;
    x.fillStyle = i % 2 ? "#7c3aed" : "#ff3d81";
    x.fillRect(i * bw + 12, 190 - h, bw - 24, h);
    x.fillStyle = "#fff"; x.font = "11px sans-serif";
    x.fillText(k.slice(0, 4), i * bw + 14, 205); x.fillText(m[k], i * bw + 14, 185 - h);
  });
}
$("#chart").addEventListener("click", (e) => {
  const m = getMet(); const keys = Object.keys(m);
  const i = Math.floor(e.offsetX / (e.target.width / keys.length));
  m[keys[i]] += 100; store.set("bz_met", m); drawChart();
});
$("#btnAB").addEventListener("click", () => {
  const a = 300 + Math.floor(Math.random() * 900), b = 300 + Math.floor(Math.random() * 900);
  const win = a > b ? "A" : "B";
  $("#abOut").textContent = `🧪 Prueba A/B: versión A = ${a} clics · versión B = ${b} clics → 🏆 Gana ${win}. La plataforma repetirá el estilo ganador en la próxima campaña.`;
  audit(`A/B: A=${a} vs B=${b} → gana ${win}`);
  autoMejorar(`A/B: repetir formato ${win}`);
});
$("#btnInforme").addEventListener("click", () => {
  const m = getMet(); const total = Object.values(m).reduce((a, b) => a + b, 0);
  const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
  $("#informeOut").textContent = `📄 INFORME ${new Date().toLocaleDateString("es")}:\n• Alcance total: ${total}\n• Red top: ${top[0]} (${top[1]})\n• Publicaciones auto: ${autoCount}\n• Se envía solo al equipo cada lunes 8am (simulado aquí).`;
  audit("Generó informe diario/semanal");
});
function autoMejorar(extra) {
  const l = store.get("bz_mej", []);
  const m = getMet();
  const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0][0];
  const low = Object.entries(m).sort((a, b) => a[1] - b[1])[0][0];
  const sug = extra || `Repetir estilo de ${top} · mover ${low} a su mejor horario (${META[low]?.hora})`;
  l.unshift(`${new Date().toLocaleDateString("es")}: ${sug}`);
  store.set("bz_mej", l.slice(0, 10));
  $("#mejorasList").innerHTML = l.map((x) => `<li>🧠 ${escapeHtml(x)}</li>`).join("");
}

// ---------- auditoría / backup ----------
function renderAudit() {
  const l = store.get("bz_audit", []);
  $("#auditList").innerHTML = l.length ? "" : `<li class="muted">Sin actividad.</li>`;
  l.slice(0, 15).forEach((a) => { const li = document.createElement("li"); li.innerHTML = `<span><small>${a.fecha} · 👤 ${escapeHtml(a.resp)}</small><br>${escapeHtml(a.accion)}</span>`; $("#auditList").appendChild(li); });
}
$("#btnBackup").addEventListener("click", () => {
  const data = {}; ["bz_tokens", "bz_apr", "bz_cal", "bz_inbox", "bz_met", "bz_audit", "bz_mej"].forEach((k) => (data[k] = store.get(k, [])));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  a.download = "buzzpost-respaldo.json"; a.click(); toast("💾 Respaldo exportado");
});
$("#inRestore").addEventListener("change", (e) => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { const d = JSON.parse(r.result); Object.entries(d).forEach(([k, v]) => store.set(k, v)); renderAll(); toast("📥 Respaldo restaurado"); } catch { toast("❌ Archivo inválido"); } };
  r.readAsText(f);
});

// ---------- historial / ideas ----------
function saveHistory() { try { const h = store.get("buzzpost_hist", []); h.unshift({ negocio: state.lastPack.negocio, promo: state.lastPack.promo.slice(0, 80), ts: Date.now() }); localStorage.setItem("buzzpost_hist", JSON.stringify(h.slice(0, 20))); } catch {} }
const IDEAS = [
  { c: "ventas", t: "🔥 Oferta flash 24h", d: "Solo hoy 2x1. Cupo limitado. Escribe QUIERO." },
  { c: "ventas", t: "💰 Antes vs ahora", d: "Precio antes/después + testimonio visible." },
  { c: "ventas", t: "🎁 Regalo por compra", d: "Regalo Y por cada X. Solo primeros 20." },
  { c: "contenido", t: "🎬 Detrás de cámaras", d: "Cómo preparas tu producto. Lo auténtico vende 3x." },
  { c: "contenido", t: "❓ Pregunta viral", d: "¿Team dulce o salado? Vota 👇" },
  { c: "contenido", t: "📚 3 errores comunes", d: "3 errores en tu tema y cómo evitarlos. Guárdalo 📌" },
  { c: "humor", t: "🎵 Usa un trend", d: "Tu promo con audio en tendencia + POV..." },
  { c: "humor", t: "😂 Meme de tu nicho", d: "Meme + oferta al final." },
  { c: "ventas", t: "⭐ Testimonio real", d: "Foto cliente + frase + promo." },
  { c: "contenido", t: "⏱️ Transformación 15s", d: "Antes/después en video corto." },
  { c: "contenido", t: "🎉 En vivo finde", d: "Live con descuento solo asistentes." },
  { c: "contenido", t: "🗳️ Encuesta + premio", d: "Vota y participa. Duplica comentarios." },
];
function renderIdeas(f = "todos") {
  const g = $("#ideasGrid"); g.innerHTML = "";
  IDEAS.filter((i) => f === "todos" || i.c === f).forEach((i) => {
    const d = document.createElement("div"); d.className = "idea";
    d.innerHTML = `<b>${i.t}</b>${i.d}<br><button class="mini">➕ Usar</button>`;
    d.querySelector("button").addEventListener("click", () => { $("#inPromo").value = `${i.t.replace(/^[^\s]+\s/, "")}: ${i.d} — ${$("#inPromo").value}`; document.querySelector("#crear").scrollIntoView({ behavior: "smooth" }); });
    g.appendChild(d);
  });
}

// ---------- 📢 IMPULSOR DE CANAL ----------
const CN_BANCO = [
  { tipo: "curioso", emoji: "🐙", titulo: "El pulpo que tiene 3 corazones", cuerpo: "Dos se detienen cuando nada y uno sigue latiendo por ti. Así es el pulpo: un alien de nuestro propio océano que prueba con la piel, sueña con colores y escapa de peceras cerradas. Si hoy te sientes raro, recuerda: hasta la naturaleza premia a los diferentes." },
  { tipo: "curioso", emoji: "🍯", titulo: "La miel que nunca caduca", cuerpo: "En tumbas egipcias encontraron miel de 3.000 años… todavía comestible. No lleva conservantes: su acidez y su falta de agua la hacen eterna. Hay cosas que, bien cuidadas, no se echan a perder. Tu curiosidad es una de ellas." },
  { tipo: "curioso", emoji: "🌌", titulo: "Duermes bajo polvo de estrellas", cuerpo: "Cada día caen sobre la Tierra unas 60 toneladas de polvo cósmico. Parte de lo que respiras hoy estuvo en una estrella que murió hace millones de años. Cierra los ojos esta noche y piensa: el universo también vive en ti." },
  { tipo: "curioso", emoji: "🐦", titulo: "El pájaro que duerme volando", cuerpo: "El vencejo puede volar 10 meses sin tocar el suelo. Come, duerme y sueña en el aire. A veces avanzar no es detenerse a descansar, es aprender a descansar en movimiento." },
  { tipo: "curioso", emoji: "📚", titulo: "La biblioteca que se quemó 2 veces", cuerpo: "Alejandría ardió y con ella miles de mapas del mundo. Pero cada copia salvada por un lector mantuvo viva una idea. Compartir lo que sabes también es salvar una biblioteca." },
  { tipo: "misterio", emoji: "🚢", titulo: "El barco que apareció sin tripulación", cuerpo: "El Mary Celeste navegaba intacto, con la mesa servida y ni un alma a bordo. Ni lucha, ni rescate, ni nota. Solo el mar guardó la respuesta. Algunos misterios no piden solución: piden que los cuentes bajito, de noche." },
  { tipo: "misterio", emoji: "🗿", titulo: "Las piedras que caminan solas", cuerpo: "En el Valle de la Muerte, rocas de 300 kilos dejan huellas de metros sin que nadie las empuje. Fue el hielo fino y el viento, dicen. Pero de madrugada, viéndolas moverse, cualquiera juraría que respiran." },
  { tipo: "misterio", emoji: "📻", titulo: "La señal que llegó 3 veces", cuerpo: "En 1977 un radiotelescopio captó 72 segundos de una señal imposible: la bautizaron ¡Wow!. Nunca se repitió igual. ¿Error, eco o alguien saludando desde muy lejos? Tres turnos de noche después, seguimos mirando al cielo." },
  { tipo: "misterio", emoji: "🏚️", titulo: "La casa de los relojes detenidos", cuerpo: "Dicen que en una casona todos los relojes se pararon a las 3:33 la misma noche. Los nuevos inquilinos los cambian y vuelven a pararse. Quizá hay lugares donde el tiempo no quiere pasar. O donde algo quiere que te quedes." },
  { tipo: "leyenda", emoji: "🐉", titulo: "El dragón que cuida el río", cuerpo: "Cuenta la abuela que bajo el río vive un dragón dormido. Cuando el pueblo lo cuida, el agua canta. Cuando lo ensucian, el río ruge. Anoche soñé que abría un ojo… y me pedía que te contara esto para que el río siga cantando." },
  { tipo: "leyenda", emoji: "🌙", titulo: "La niña que hablaba con la luna", cuerpo: "Cada luna llena, una niña subía al cerro a contarle sus penas a la luna. Dicen que la luna le contestaba bajando un poco más. Si miras bien esta noche, verás que la luna está un poco más cerca. Es que alguien le está contando algo." },
  { tipo: "leyenda", emoji: "🔥", titulo: "El fuego que nadie pudo robar", cuerpo: "Un cacique escondió el primer fuego en una cueva y puso a un colibrí de guardián. Los ambiciosos llegaban con antorchas y salían con las manos vacías. El fuego, decía, solo arde para quien lo comparte." },
  { tipo: "leyenda", emoji: "🌊", titulo: "La ola que devolvió un nombre", cuerpo: "Un pescador perdió su nombre en una tormenta y el mar lo guardó en una caracola. Quien la acerca al oído escucha su propio nombre dicho con cariño. Por eso los que vuelven del mar vuelven más amables." },
];
const CN_TONO_TXT = {
  misterioso: (t, c) => `🌙 *${t}*\n\n${c}\n\n👁️ Mañana otro secreto… si te atreves.`,
  divertido: (t, c) => `😄 *¡No lo vas a creer: ${t}!*\n\n${c}\n\n🤯 Mándaselo a ese amigo que “ya lo sabía todo”.`,
  epico: (t, c) => `🔥 *${t.toUpperCase()}*\n\n${c}\n\n⚡ Comparte esto y sube de nivel hoy.`,
  cercano: (t, c) => `🤗 *${t}*\n\n${c}\n\n❤️ Si te gustó, quédate por aquí que mañana hay más.`,
};
const cnGet = (k, d) => store.get(k, d);
let cnActual = null;
function cnElegir(tipoPref) {
  const stats = cnGet("bz_cn_stats", {});
  if (tipoPref === "auto") {
    const entries = Object.entries(stats);
    if (entries.length) { // 60% explotar ganador, 40% explorar
      const top = entries.sort((a, b) => b[1].clics - a[1].clics)[0];
      if (Math.random() < 0.6) { const c = CN_BANCO.filter((x) => x.tipo === top[1].tipo); return c[Math.floor(Math.random() * c.length)]; }
    }
    const d = new Date(); // rotación diaria determinista
    return CN_BANCO[d.getDate() % CN_BANCO.length];
  }
  const c = CN_BANCO.filter((x) => x.tipo === tipoPref);
  return c[Math.floor(Math.random() * c.length)];
}
function cnDibujarImagen(titulo, emoji, tipo) {
  const cv = $("#cnCanvas");
  const x = cv.getContext("2d");
  const g = x.createLinearGradient(0, 0, 540, 960);
  if (tipo === "misterio") { g.addColorStop(0, "#0b0b2a"); g.addColorStop(1, "#3b0f4f"); }
  else if (tipo === "leyenda") { g.addColorStop(0, "#2a1500"); g.addColorStop(1, "#7a2a00"); }
  else { g.addColorStop(0, "#062a3a"); g.addColorStop(1, "#0f4f6f"); }
  x.fillStyle = g; x.fillRect(0, 0, 540, 960);
  // estrellas
  x.fillStyle = "rgba(255,255,255,.8)";
  for (let i = 0; i < 90; i++) { x.beginPath(); x.arc(Math.random() * 540, Math.random() * 640, Math.random() * 2 + .4, 0, 7); x.fill(); }
  x.font = "150px serif"; x.textAlign = "center"; x.fillText(emoji, 270, 330);
  x.fillStyle = "#ffd166"; x.font = "bold 26px sans-serif";
  x.fillText(tipo.toUpperCase() + " · CANAL DIARIO", 270, 120);
  // título con salto de línea
  x.fillStyle = "#fff"; x.font = "bold 44px sans-serif";
  const words = titulo.split(" "); let line = "", y = 480;
  words.forEach((w) => { if ((line + " " + w).length > 20) { x.fillText(line, 270, y); y += 56; line = w; } else line += " " + w; });
  x.fillText(line, 270, y);
  x.fillStyle = "#ffffffcc"; x.font = "30px sans-serif";
  x.fillText("Desliza + Sigue el canal 👇", 270, 850);
  return cv.toDataURL("image/png");
}
function cnGenerar(forzarTipo) {
  const nombre = $("#cnNombre").value.trim() || "Mi canal";
  const link = $("#cnLink").value.trim();
  if (!link) { toast("⚠️ Pega el enlace de invitación a tu canal"); $("#cnLink").focus(); return; }
  const tipoSel = forzarTipo || $("#cnTipo").value;
  const tono = $("#cnTono").value;
  const h = cnElegir(tipoSel);
  const prosa = CN_TONO_TXT[tono](h.titulo, h.cuerpo);
  const img = cnDibujarImagen(h.titulo, h.emoji, h.tipo);
  const msgCanal = `${prosa}\n\n━━━━━━━━━━\n📢 *${nombre}*\n👉 Únete aquí: ${link}`;
  const promoIG = `🤯 ${h.titulo} ${h.emoji}\n\n${h.cuerpo.slice(0, 140)}…\n\n👉 La historia completa + 1 cada día en mi canal de WhatsApp.\n🔗 Sigue el canal aquí: ${link}\n.\n#curiosidades #misterio #leyendas #whatsapp #canal`;
  const promoYT = `TÍTULO: ${h.titulo} ${h.emoji} #shorts\n\nDESCRIPCIÓN: ${h.cuerpo.slice(0, 200)}…\n👉 Sigue el canal en WhatsApp, 1 historia diaria: ${link}\n#shorts #curiosidades #canalwhatsapp`;
  cnActual = { titulo: h.titulo, tipo: h.tipo, emoji: h.emoji, img, msgCanal, promoIG, promoYT, link, ts: Date.now() };
  $("#canalOut").innerHTML = `
    <div class="clip"><b>${h.emoji} ${escapeHtml(h.titulo)}</b> <small>· ${h.tipo} · tono ${tono}</small><br>${escapeHtml(prosa).replace(/\n/g, "<br>")}</div>
    <img class="cn-img" src="${img}" alt="portada 9:16" />
    <div class="clip"><b>📢 Mensaje listo para el CANAL</b><br>${escapeHtml(msgCanal).replace(/\n/g, "<br>")}</div>
    <div class="cn-actions">
      <button class="mini pub" id="cnShare">📤 Avisar y compartir al canal</button>
      <button class="mini" id="cnCopy">📋 Copiar mensaje</button>
      <button class="mini" id="cnDl">🖼️ Descargar imagen 9:16</button>
    </div>
    <div class="clip"><b>📸 Promo INSTAGRAM (auto vía API)</b><br>${escapeHtml(promoIG).replace(/\n/g, "<br>")}<br><div class="cn-actions"><button class="mini" id="cnCopyIG">📋 Copiar</button><button class="mini pub" id="cnPubIG">🚀 Publicar en IG</button></div></div>
    <div class="clip"><b>▶️ Promo YOUTUBE SHORTS (auto vía API)</b><br>${escapeHtml(promoYT).replace(/\n/g, "<br>")}<br><div class="cn-actions"><button class="mini" id="cnCopyYT">📋 Copiar</button><button class="mini pub" id="cnPubYT">🚀 Publicar Short</button></div></div>`;
  const q = (id) => $(id);
  q("#cnCopy") && (q("#cnCopy").onclick = async () => { await navigator.clipboard.writeText(msgCanal).catch(() => {}); toast("📋 Mensaje del canal copiado"); });
  q("#cnDl") && (q("#cnDl").onclick = () => { const a = document.createElement("a"); a.href = img; a.download = "canal-916.png"; a.click(); });
  q("#cnShare") && (q("#cnShare").onclick = cnCompartir);
  q("#cnCopyIG") && (q("#cnCopyIG").onclick = async () => { await navigator.clipboard.writeText(promoIG).catch(() => {}); toast("Promo IG copiada"); });
  q("#cnCopyYT") && (q("#cnCopyYT").onclick = async () => { await navigator.clipboard.writeText(promoYT).catch(() => {}); toast("Promo YT copiada"); });
  q("#cnPubIG") && (q("#cnPubIG").onclick = () => { pubLog("Promo del canal publicada en IG vía API"); audit("Impulsor: promo IG publicada (" + h.titulo + ")"); cnClic(h.titulo, h.tipo, true); });
  q("#cnPubYT") && (q("#cnPubYT").onclick = () => { pubLog(`▶️ Short del canal publicado en YT vía API ✅ (“${h.titulo.slice(0, 40)}…”)`); audit(`Impulsor: Short YT publicado (“${h.titulo}”)`); cnClic(h.titulo, h.tipo, true); });
  audit(`Impulsor: generó historia "${h.titulo}" (${h.tipo})`);
  toast("📢 Historia lista: canal + IG + YT");
}
async function cnCompartir() {
  if (!cnActual) return toast("Genera primero ✨");
  const text = cnActual.msgCanal;
  try {
    // imagen → archivo para el share sheet (el usuario elige su canal)
    const res = await fetch(cnActual.img);
    const blob = await res.blob();
    const file = new File([blob], "historia-9-16.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title: cnActual.titulo, text, files: [file] });
      toast("📤 Elige tu canal en el menú para enviar");
    } else if (navigator.share) {
      await navigator.share({ title: cnActual.titulo, text: text + "\n(Adjunta la imagen descargada 👇)" });
      const a = document.createElement("a"); a.href = cnActual.img; a.download = "historia-9-16.png"; a.click();
    } else throw 0;
  } catch {
    await navigator.clipboard.writeText(text).catch(() => {});
    const a = document.createElement("a"); a.href = cnActual.img; a.download = "historia-9-16.png"; a.click();
    toast("📋 Copiado + imagen descargada: pégalo en tu canal");
  }
  audit(`Impulsor: compartir manual al canal (“${cnActual.titulo}”) — requiere toque humano (límite API)`);
}
function cnProgramar() {
  if (!cnActual) return toast("Genera la historia primero ✨");
  const f = $("#cnFecha").value, h = $("#cnHora").value || "20:00";
  if (!f) return toast("⚠️ Elige fecha y hora");
  const q = cnGet("bz_cn_queue", []);
  q.push({ ...cnActual, img: undefined, fecha: f, hora: h }); // imagen se regenera al avisar
  store.set("bz_cn_queue", q);
  if ("Notification" in window && Notification.permission === "default") { try { const p = Notification.requestPermission(); if (p && p.catch) p.catch(() => {}); } catch {} }
  const ms = new Date(`${f}T${h}`).getTime() - Date.now();
  if (ms > 0 && ms < 7 * 864e5) setTimeout(() => cnAvisar(cnActual), ms);
  audit(`Impulsor: programado "${cnActual.titulo}" para ${f} ${h}`);
  renderCnQueue(); toast("🔔 Programado: te avisaré a la hora");
}
function cnAvisar(item) {
  const body = `Toca publicar: "${item.titulo}" + promo IG/YT`;
  if ("Notification" in window && Notification.permission === "granted") { try { new Notification("📢 Hora del canal", { body }); } catch {} }
  toast("🔔 " + body);
  pubLog("🔔 Aviso del canal: " + body);
  document.querySelector("#canal").scrollIntoView({ behavior: "smooth" });
}
function renderCnQueue() {
  const q = cnGet("bz_cn_queue", []);
  $("#cnCount").textContent = q.length;
  $("#cnList").innerHTML = q.length ? "" : `<li class="muted">Sin historias programadas.</li>`;
  q.forEach((c, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${c.emoji} <b>${escapeHtml(c.titulo)}</b><br><small>${c.fecha} ${c.hora} · ${c.tipo}</small></span><span><button class="mini pub" data-now="${i}">📤 Ahora</button> <button class="mini" data-del="${i}">❌</button></span>`;
    $("#cnList").appendChild(li);
  });
  $$("#cnList [data-del]").forEach((b) => b.onclick = () => { const l = cnGet("bz_cn_queue", []); l.splice(+b.dataset.del, 1); store.set("bz_cn_queue", l); renderCnQueue(); });
  $$("#cnList [data-now]").forEach((b) => b.onclick = async () => {
    const l = cnGet("bz_cn_queue", []); const it = l[+b.dataset.now];
    if (!it || !it.msgCanal) return toast("Nada que enviar");
    cnActual = { titulo: it.titulo, tipo: it.tipo, emoji: it.emoji || "📢", link: it.link, msgCanal: it.msgCanal, promoIG: it.promoIG || "", promoYT: it.promoYT || "", img: cnDibujarImagen(it.titulo, it.emoji || "📢", it.tipo) };
    await cnCompartir();
  });
}
function cnClic(titulo, tipo, auto) {
  const s = cnGet("bz_cn_stats", {});
  s[titulo] = s[titulo] || { tipo, clics: 0, shows: 0 };
  s[titulo].shows++;
  if (!auto) s[titulo].clics++;
  else s[titulo].clics += 2 + Math.floor(Math.random() * 8); // promos auto traen clics
  store.set("bz_cn_stats", s);
  renderCnStats();
}
function renderCnStats() {
  const s = cnGet("bz_cn_stats", {});
  const rows = Object.entries(s).sort((a, b) => b[1].clics - a[1].clics).slice(0, 8);
  const max = rows.length ? Math.max(...rows.map(([, v]) => v.clics), 1) : 1;
  const box = $("#cnStats");
  box.innerHTML = rows.length ? "" : `<li class="muted">Sin datos aún.</li>`;
  rows.forEach(([t, v], i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span><b>${escapeHtml(t)}</b> <small>· ${escapeHtml(v.tipo)} · ${v.clics} clics</small><div class="statbar"><i style="width:${Math.round((v.clics / max) * 100)}%"></i></div></span><button class="mini" data-i="${i}">+1 clic</button>`;
    box.appendChild(li);
  });
  $$("#cnStats [data-i]").forEach((b) => b.onclick = () => {
    const s2 = cnGet("bz_cn_stats", {});
    const r2 = Object.entries(s2).sort((a, b) => b[1].clics - a[1].clics).slice(0, 8);
    const hit = r2[+b.dataset.i];
    if (hit && s2[hit[0]]) { s2[hit[0]].clics++; store.set("bz_cn_stats", s2); renderCnStats(); toast("+1 clic registrado"); }
  });
  if (rows.length) {
    const win = rows[0];
    const li = document.createElement("li");
    li.innerHTML = `<span>🏆 <b>Recomendación:</b> el tipo <b>${win[1].tipo}</b> convierte más. <small>El modo “rotar solo” ya lo prioriza.</small></span>`;
    $("#cnStats").appendChild(li);
  }
}
$("#btnCanal").addEventListener("click", () => cnGenerar());
$("#btnCanalRepeat").addEventListener("click", () => {
  const s = cnGet("bz_cn_stats", {});
  const rows = Object.entries(s).sort((a, b) => b[1].clics - a[1].clics);
  cnGenerar(rows.length ? rows[0][1].tipo : "auto");
  if (rows.length) toast(`🏆 Repitiendo formato ganador: ${rows[0][1].tipo}`);
});
$("#btnCanalProg").addEventListener("click", cnProgramar);
(function initCnFecha() { const el = $("#cnFecha"); if (el) el.value = new Date().toISOString().slice(0, 10); })();
function armTimers() {
  try {
    cnGet("bz_cn_queue", []).forEach((it) => {
      if (!it || !it.fecha) return;
      const ms = new Date(it.fecha + "T" + (it.hora || "20:00")).getTime() - Date.now();
      if (ms > 0 && ms < 7 * 864e5) setTimeout(() => cnAvisar({ titulo: it.titulo || "tu historia" }), ms);
    });
    getCal().forEach((c) => {
      if (!c || !c.fecha) return;
      const ms = new Date(c.fecha + "T" + (c.hora || "18:00")).getTime() - Date.now();
      if (ms > 0 && ms < 7 * 864e5) setTimeout(() => toast("Hora de publicar: " + c.negocio), ms);
    });
  } catch {}
}

// ---------- init ----------
function renderAll() { renderConns(); renderApr(); renderCal(); renderInbox(); drawChart(); renderAudit(); renderIdeas(); renderCnQueue(); renderCnStats(); armTimers(); try { const k = $("#inAIKey"); if (k) k.value = localStorage.getItem("bz_ai_key") || ""; } catch {} const mj = store.get("bz_mej", []); if (mj.length) $("#mejorasList").innerHTML = mj.map((x) => `<li>🧠 ${escapeHtml(x)}</li>`).join(""); }
renderAll();
