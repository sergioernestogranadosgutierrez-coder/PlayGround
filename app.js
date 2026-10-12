// ChatGPT Clone PRO — todo simulado/desbloqueado en local + servicios gratis reales
const $ = (s) => document.querySelector(s);
const messagesEl = $("#messages"), chatScroll = $("#chatScroll"), input = $("#input");
const chatListEl = $("#chatList"), welcomeEl = $("#welcome");

const LS_CHATS = "gptclone.chats.v1", LS_SETTINGS = "gptclone.settings.v1", LS_FOLDERS = "gptclone.folders.v1";
let chats = [], folders = ["General", "Trabajo", "Estudio"], activeId = null, generating = false, stopFlag = false;
let pendingImage = null, pendingFileText = null, thinkMode = false;

let settings = { apiKey: "", endpoint: "https://api.openai.com/v1/chat/completions", model: "gpt-4o", streamWords: true, enterSend: true, demoMode: true, userName: "", thinkAlways: false };
try { Object.assign(settings, JSON.parse(localStorage.getItem(LS_SETTINGS) || "{}")); } catch {}
try { chats = JSON.parse(localStorage.getItem(LS_CHATS) || "[]"); } catch { chats = []; }
try { folders = JSON.parse(localStorage.getItem(LS_FOLDERS) || '["General","Trabajo","Estudio"]'); } catch {}

function save() { localStorage.setItem(LS_CHATS, JSON.stringify(chats)); localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); localStorage.setItem(LS_FOLDERS, JSON.stringify(folders)); }
function uid() { return Math.random().toString(36).slice(2, 10); }
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.remove("hidden"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add("hidden"), 2600); }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
const me = () => settings.userName ? ` ${settings.userName}` : "";

// ---------- Servidor propio: se usa /api/* si responde, si no fallback local ----------
let API_OK = false;
fetch("/api/health").then(r => r.ok ? r.json() : null).then(j => { API_OK = !!(j && j.ok); updateBadge(); }).catch(() => {});

// Memoria local (siempre privada, no sale del navegador)
function memoryLocal(text) {
  const s = text.toLowerCase();
  const m = s.match(/(?:me llamo|ll[aá]mame|soy)\s+([a-záéíóúñ]+)/i);
  if (m) {
    settings.userName = m[1][0].toUpperCase() + m[1].slice(1); save(); updateBadge();
    return `¡Encantado, ${settings.userName}! 🧠 Te recordaré en este dispositivo (memoria local). ¿Qué hacemos primero?`;
  }
  if (/qui[eé]n soy|c[uú]al es mi nombre|te acuerdas de m[ií]/.test(s))
    return settings.userName ? `Claro 😄: te llamas **${settings.userName}**.` : `Aún no me dijiste tu nombre. Escríbeme *"me llamo Alex"*.`;
  return null;
}

// ---------- Markdown (con imágenes, charts, think) ----------
function md(src) {
  let h = esc(src);
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const raw = code.replace(/\n$/, "");
    return `<pre data-lang="${lang || "code"}" data-code="${encodeURIComponent(raw)}"><button class="copy-btn" onclick="copyCode(this)">Copiar</button><code>${raw}</code></pre>`;
  });
  h = h.replace(/!\[([^\]]*)\]\((https?:[^)]+)\)/g, `<img class="gen" alt="$1" loading="lazy" src="$2" /><br><a class="dl-btn" href="$2" download target="_blank">⬇ Descargar imagen</a>`);
  h = h.replace(/\[\[CHART:([\d.,\s]+)\]\]/g, (_, nums) => chartSVG(nums.split(",").map(Number).filter(n => !isNaN(n))));
  h = h.replace(/^### (.*)$/gm, "<h3>$1</h3>").replace(/^## (.*)$/gm, "<h2>$1</h2>").replace(/^# (.*)$/gm, "<h1>$1</h1>");
  h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`\n]+)`/g, "<code>$1</code>");
  h = h.replace(/^\s*[-*] (.*)$/gm, "<li>$1</li>");
  h = h.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  h = h.split(/\n{2,}/).map(p => {
    const t = p.trim();
    if (!t || t.startsWith("<") || t.startsWith("!")) return p;
    return `<p>${p.replace(/\n/g, "<br>")}</p>`;
  }).join("\n");
  // <details> de razonamiento se deja pasar (lo generamos ya en HTML)
  h = h.replace(/&lt;details&gt;/g, "<details class='think'>").replace(/&lt;\/details&gt;/g, "</details>").replace(/&lt;summary&gt;/g, "<summary>").replace(/&lt;\/summary&gt;/g, "</summary>");
  return h;
}
function chartSVG(nums) {
  if (!nums.length) return "";
  const max = Math.max(...nums, 1), W = 520, H = 180, bw = W / nums.length;
  let bars = nums.map((n, i) => {
    const h = Math.round((n / max) * (H - 30));
    return `<rect x="${i * bw + 6}" y="${H - h}" width="${bw - 12}" height="${h}" rx="6" fill="#10a37f"><title>${n}</title></rect><text x="${i * bw + bw / 2}" y="${H - h - 6}" text-anchor="middle" fill="currentColor" font-size="12">${n}</text>`;
  }).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">${bars}</svg>`;
}
window.copyCode = (btn) => { navigator.clipboard.writeText(decodeURIComponent(btn.parentElement.dataset.code || btn.parentElement.innerText)).then(() => toast("Código copiado ✅")); };
window.runCode = (btn) => {
  const code = decodeURIComponent(btn.parentElement.dataset.code || "");
  let out = "";
  const log = (...a) => { out += a.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ") + "\n"; };
  try { new Function("console", code)({ log }); btn.parentElement.insertAdjacentHTML("beforeend", `<div class="run-out">▶ Salida:\n${esc(out || "(sin console.log)")}</div>`); }
  catch (e) { btn.parentElement.insertAdjacentHTML("beforeend", `<div class="run-out">⚠️ ${esc(e.message)}</div>`); }
};
window.previewHTML = (btn) => {
  const code = decodeURIComponent(btn.parentElement.dataset.code || "");
  $("#previewFrame").srcdoc = code; $("#previewTitle").textContent = "🎨 Canvas — vista previa HTML";
  $("#previewModal").classList.remove("hidden");
};
window.speak = (i) => {
  const c = activeChat(); if (!c) return;
  const m = c.messages[i]; if (!m) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(m.content.replace(/[#*`]/g, "").slice(0, 800));
  u.lang = "es-ES"; speechSynthesis.speak(u); toast("🔊 Leyendo…");
};

// ---------- Chats / carpetas ----------
function activeChat() { return chats.find(c => c.id === activeId); }
function newChat(folder = "") {
  const c = { id: uid(), title: "Nuevo chat", created: Date.now(), folder: folder || currentFolder(), pinned: false, messages: [] };
  chats.unshift(c); activeId = c.id; save(); renderAll(); input.focus();
}
function currentFolder() { return $("#folderFilter").value || ""; }
function renderFolders() {
  const sel = $("#folderFilter"); const cur = sel.value;
  sel.innerHTML = `<option value="">📁 Todos</option>` + folders.map(f => `<option>${esc(f)}</option>`).join("");
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}
function renderSidebar(filter = "") {
  chatListEl.innerHTML = "";
  const ff = currentFolder();
  chats.filter(c => (!ff || c.folder === ff) && c.title.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => (b.pinned - a.pinned) || (b.created - a.created)).forEach(c => {
      const b = document.createElement("div");
      b.className = "chat-item" + (c.id === activeId ? " active" : "");
      b.innerHTML = `<span>${c.pinned ? "📌" : "💬"}</span><span class="t"></span><button class="pin" title="Fijar">📌</button><button class="x" title="Borrar">✕</button>`;
      b.querySelector(".t").textContent = (c.folder ? `[${c.folder}] ` : "") + c.title;
      b.onclick = () => { activeId = c.id; save(); renderAll(); closeSide(); };
      b.querySelector(".x").onclick = (e) => { e.stopPropagation(); chats = chats.filter(x => x.id !== c.id); if (activeId === c.id) activeId = chats[0]?.id || null; save(); renderAll(); };
      b.querySelector(".pin").onclick = (e) => { e.stopPropagation(); c.pinned = !c.pinned; save(); renderAll(); };
      b.ondblclick = () => { const t = prompt("Renombrar chat:", c.title); if (t) { c.title = t.slice(0, 60); save(); renderAll(); } };
      chatListEl.appendChild(b);
    });
  if (!chatListEl.children.length) chatListEl.innerHTML = `<p style="color:var(--muted);font-size:13px;padding:10px">Sin chats aquí.<br>Pulsa “Nuevo chat”.</p>`;
}
function renderMessages() {
  const chat = activeChat();
  messagesEl.innerHTML = "";
  welcomeEl.style.display = chat && chat.messages.length ? "none" : "";
  if (!chat) return;
  chat.messages.forEach((m, i) => {
    const div = document.createElement("div");
    div.className = "msg " + m.role;
    div.innerHTML = `<div class="m-avatar">${m.role === "user" ? "TÚ" : "✦"}</div><div class="m-body"></div>`;
    if (m.image) {
      div.querySelector(".m-body").innerHTML = `<img class="gen" src="${m.image}" /><br>${esc(m.content).replace(/\n/g, "<br>")}`;
    } else div.querySelector(".m-body").innerHTML = m.role === "user" ? esc(m.content).replace(/\n/g, "<br>") : md(m.content);
    // botones run/preview en bloques js/html
    div.querySelectorAll("pre").forEach(pre => {
      const lang = (pre.dataset.lang || "").toLowerCase();
      if (["js", "javascript"].includes(lang)) pre.insertAdjacentHTML("beforeend", `<button class="run-btn" onclick="runCode(this)">▶ Ejecutar</button>`);
      if (["html"].includes(lang)) pre.insertAdjacentHTML("beforeend", `<button class="preview-btn" onclick="previewHTML(this)">👁 Vista previa</button>`);
    });
    const acts = document.createElement("div");
    acts.className = "m-actions";
    if (m.role === "assistant") {
      acts.innerHTML = `<button title="Copiar">📋</button><button title="Leer en voz alta">🔊</button><button title="Regenerar">🔄</button>`;
      acts.children[0].onclick = () => navigator.clipboard.writeText(m.content).then(() => toast("Copiado ✅"));
      acts.children[1].onclick = () => window.speak(i);
      acts.children[2].onclick = () => regenerate(i);
    } else {
      acts.innerHTML = `<button title="Editar">✏️</button>`;
      acts.children[0].onclick = () => { input.value = m.content; input.focus(); autogrow(); };
    }
    div.querySelector(".m-body").appendChild(acts);
    messagesEl.appendChild(div);
  });
  chatScroll.scrollTop = chatScroll.scrollHeight;
}
function renderAll() { renderFolders(); renderSidebar($("#searchChats").value); renderMessages(); updateBadge(); autoTitle(); }
function updateBadge() {
  const live = !settings.demoMode && !!settings.apiKey;
  const b = $("#apiBadge");
  b.textContent = API_OK ? "🖥 servidor propio" : (live ? "● API live" : "⭐ PRO");
  b.classList.toggle("live", true);
  const names = { "gpt-4o": "GPT-4o Pro", "o1-think": "o1-Think 🧠", "gpt-4o-mini": "GPT-4o mini", "claude-pro": "Claude Pro ✍️", "gemini-pro": "Gemini Pro 🔍", "imagen-pro": "Imagen Pro 🎨" };
  $("#modelBtn").textContent = (names[settings.model] || settings.model) + " ▾";
  $("#btnDemoMode span").textContent = "Modo demo: " + (settings.demoMode ? "ON" : "OFF");
  $("#btnThink").classList.toggle("on", thinkMode || settings.thinkAlways);
  document.querySelector('[data-tool="pensar"]')?.classList.toggle("on", thinkMode || settings.thinkAlways);
  $("#userNameLabel").textContent = settings.userName ? settings.userName + " Pro" : "Usuario Pro";
}
function autoTitle() {
  const c = activeChat();
  if (c && c.title === "Nuevo chat" && c.messages.length >= 2) {
    c.title = c.messages[0].content.replace(/^\/(imagen|buscar)\s*/, "").slice(0, 42) || "Chat";
    save(); renderSidebar($("#searchChats").value);
  }
}

// ---------- Servicios gratis reales ----------
// Imágenes: pasan por TU servidor (/api/image); si no hay servidor, directo a Pollinations
function imageURL(prompt) {
  if (API_OK) return `/api/image?prompt=${encodeURIComponent(prompt)}&t=${Date.now()}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 99999)}&nologo=true&model=flux`;
}
// Búsqueda: primero TU servidor (/api/search), si no Wikipedia directa, si no simulado
async function webSearch(query) {
  const q = query.replace(/^\/buscar\s*/i, "").trim() || query;
  try {
    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (r.ok) {
      const j = await r.json();
      if (j.extract) return `## 🔍 ${j.title}\n\n${j.extract}\n\n🔗 Fuente: ${j.url}`;
      if (j.reply) return j.reply;
    }
  } catch {}
  try {
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
    if (!r.ok) throw 0;
    const j = await r.json();
    return `## 🔍 ${j.title}\n\n${j.extract || "Sin resumen."}\n\n🔗 Fuente: ${j.content_urls?.desktop?.page || "https://es.wikipedia.org"}`;
  } catch { return `## 🔍 Búsqueda: "${q}"\n\n(Sin conexión ahora mismo — modo offline.)\n\nPide *"explícame ${q} con ejemplo"* y te lo desarrollo.`; }
}
// Visión local: analiza imagen subida (dimensiones + color dominante)
function analyzeImage(dataURL) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas"); cv.width = 32; cv.height = 32;
      const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0, 32, 32);
      const d = cx.getImageData(0, 0, 32, 32).data;
      let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4; r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      res(`Veo tu imagen 👁 (${img.naturalWidth}×${img.naturalHeight}px). Tono dominante **rgb(${r},${g},${b})**.\n\n- Si es un documento: dime qué quieres (resumir, traducir, extraer datos)\n- Si es código: dime el lenguaje y el error\n- Con **API key** en ⚙️ activo visión GPT-4o real; sin key te doy esta lectura local gratis.`);
    };
    img.onerror = () => res("No pude leer la imagen, prueba con otro archivo.");
    img.src = dataURL;
  });
}

// ---------- Cerebro demo mejorado ----------
function demoAnswer(q, ctx = {}) {
  const s = q.toLowerCase();
  const hi = settings.userName ? `, ${settings.userName}` : "";
  // memoria nombre
  let m = s.match(/(?:me llamo|ll[aá]mame|soy)\s+([a-záéíóúñ]+)/i);
  if (m) { settings.userName = m[1][0].toUpperCase() + m[1].slice(1); save(); updateBadge(); return `¡Encantado${hi}! 🧠 Te recordaré como **${settings.userName}** en este dispositivo (memoria local). ¿Qué hacemos primero?`; }
  if (/qui[eé]n soy|c[uú]al es mi nombre|te acuerdas de m[ií]/.test(s)) return settings.userName ? `Claro que sí${hi} 😄: te llamas **${settings.userName}**. (Memoria local Pro.)` : `Aún no me dijiste tu nombre. Escríbeme *"me llamo Alex"* y te recordaré.`;
  if (/fotos[ií]ntesis/.test(s)) return `## 🌱 Fotosíntesis, fácil${hi}\n\n1. **Ingredientes**: luz + agua + CO₂\n2. **Receta**: la clorofila fabrica glucosa\n3. **Regalo**: oxígeno para respirar\n\n\`6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂\` 🌻`;
  if (/plan.*python|aprender python|python.*7/.test(s)) {
    let extra = "";
    const nums = (q.match(/[\d.,\s]{5,}/) ? q.match(/(\d[\d.,\s]*)/g) : null);
    if (/grafic|progreso|chart/.test(s)) extra = `\n\n**Tu progreso:**\n[[CHART:2,4,6,8,7,9,10]]`;
    return `## 📚 Plan 7 días Python${hi}\n\n- **D1**: variables y \`print()\`\n- **D2**: \`if/for/while\`\n- **D3**: funciones\n- **D4**: listas y dicts\n- **D5**: archivos + \`try/except\`\n- **D6**: proyecto agenda\n- **D7**: POO + GitHub\n\n\`\`\`python\nnombre = input("¿Cómo te llamas? ")\nprint(f"Hola, {nombre} 👋")\n\`\`\`${extra}`;
  }
  if (/grafica|gráfica|chart|progreso.*:.*\d/.test(s)) {
    const nums = q.match(/\d+(\.\d+)?/g);
    if (nums && nums.length >= 2) return `## 📊 Tu gráfica${hi}\n\n[[CHART:${nums.slice(0, 12).join(",")}]]\n\nMedia: **${(nums.map(Number).reduce((a, b) => a + b, 0) / nums.length).toFixed(1)}**. Pídeme *"grafica: 3,5,8"* cuando quieras otra.`;
  }
  if (/ordenar.*array|sort|javascript.*orden|js.*fecha/.test(s)) return `Ordenar por fecha en **JS** (pulsa ▶ Ejecutar para probarlo aquí):\n\n\`\`\`javascript\nconst eventos = [{nombre:"Conf",fecha:"2026-11-02"},{nombre:"Demo",fecha:"2026-09-15"}];\neventos.sort((a,b)=> new Date(a.fecha)-new Date(b.fecha));\nconsole.log(eventos);\n\`\`\`\n\nTip Pro: \`.toSorted()\` no muta el original.`;
  if (/html.*ejemplo|landing|p[aá]gina|canvas/.test(s)) return `Te dejo un Canvas HTML (pulsa 👁 Vista previa):\n\n\`\`\`html\n<h1>Hola${hi} 👋</h1>\n<p>Esto es un artefacto Pro.</p>\n<button onclick="alert('Funciona')">Púlsame</button>\n<style>body{font-family:system-ui;text-align:center;padding:40px}h1{color:#10a37f}</style>\n\`\`\``;
  if (/negocio|ideas|dinero|emprender/.test(s)) return `## 💡 5 ideas 2026${hi}\n\n1. **Micro-SaaS IA** para nichos\n2. **Newsletter de pago**\n3. **Plantillas** Notion/Excel\n4. **Clases Zoom**\n5. **Videos UGC**\n\nEmpieza con la 1 o la 3 (0€). ¿Te armo el plan de alguna?`;
  if (/traduce|translate/.test(s)) return `Puedo traducir al momento. Escríbeme así: *"traduce al inglés: hola mundo"*. 🌍\n\nDemo: **"hola mundo" → "hello world"**. Pásame tu frase.`;
  if (/resumen|resume|analiza.*texto/.test(s) && ctx.fileText) {
    const t = ctx.fileText, words = t.split(/\s+/).length;
    return `## 📄 Resumen de tu archivo${hi}\n\n- **Palabras**: ${words}\n- **Caracteres**: ${t.length}\n- **Idea principal**: ${t.split(".").slice(0, 3).join(". ").slice(0, 400)}…\n\n¿Quieres versión corta, puntos clave o traducción?`;
  }
  if (/c[oó]digo|funci[oó]n|python|javascript|typescript|sql|error|bug/.test(s)) return `¡Vamos con código! 💻${hi}\n\n\`\`\`javascript\n// Debounce: limita llamadas repetidas\nfunction debounce(fn, ms=300){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}\nconsole.log("Pega tu código y pulsa ▶ Ejecutar");\n\`\`\`\n\nDime lenguaje + qué debe hacer y te lo escribo.`;
  if (/gracias/.test(s)) return `¡De nada${hi}! 😊 Puedo seguir con código, imágenes (\`/imagen ...\`), búsqueda (\`/buscar ...\`) o voz (🎙).`;
  if (/hola|buenas|quien eres|quién eres|qué puedes|que puedes/.test(s)) return `¡Hola${hi}! 👋 Soy tu **ChatGPT Pro desbloqueado** (simulado en local).\n\n**Todo lo que sé hacer aquí:**\n- 💬 Chat de los 5 modelos (cambia arriba)\n- 🎨 \`/imagen un castillo\` → foto real gratis\n- 🔍 \`/buscar tema\` → ficha real de Wikipedia\n- 🎙 dictado por voz + 🔊 lectura\n- 👁 sube foto (📎) → la analizo\n- 📄 sube .txt (📎) → la resumo\n- ▶ código JS ejecutable + 👁 preview HTML\n- 📊 *"grafica: 1,5,3"* → chart\n- 🧠 *"me llamo X"* → memoria + *"recuérdame en 15 segundos Y"* → aviso\n- 📁 proyectos, 📌 fijar, ⬇ exportar`;
  const personas = { "o1-think": "Modo o1 🧠: descompongo el problema en pasos antes de responder.\n\n", "claude-pro": "Estilo redacción ✍️: claro, elegante y estructurado.\n\n", "gemini-pro": "Estilo investigación 🔍: con fuentes y datos.\n\n", "imagen-pro": "" };
  return `${personas[settings.model] || ""}Entendido${hi}: **"${q.slice(0, 140)}"**\n\nRespuesta Pro simulada — reformula con un comando para magia real:\n- 🎨 \`/imagen ${q.slice(0, 60)}\`\n- 🔍 \`/buscar ${q.slice(0, 60)}\`\n- 📊 \`grafica: 3,7,5\`\n\nO pon tu API key en ⚙️ y te respondo con GPT-4o de verdad. 🚀`;
}
function withThink(answer) {
  if (!(thinkMode || settings.thinkAlways || settings.model === "o1-think")) return answer;
  return `<details><summary>🧠 Razonamiento o1 (ver pasos)</summary>\n\n1. Entendí la intención del usuario\n2. Elegí el formato (lista + ejemplo)\n3. Verifiqué que funcione sin internet\n4. Añadí siguiente paso útil</details>\n\n${answer}`;
}

// ---------- Envío ----------
async function typeInto(text, onChunk) {
  if (!settings.streamWords) { onChunk(text); return; }
  const parts = text.split(/(\s+)/); let acc = "";
  for (const w of parts) { if (stopFlag) break; acc += w; onChunk(acc); await new Promise(r => setTimeout(r, 14)); }
}
async function send(text) {
  text = (text ?? input.value).trim();
  if (!text || generating) return;
  // Memoria siempre en local (privada)
  const memReply = memoryLocal(text);
  if (memReply) {
    pushUser(text); pushAssistant(memReply);
    input.value = ""; save(); renderAll(); return;
  }
  // recordatorio: "recuérdame en N segundos X"
  const rem = text.match(/recu[eé]rdame en (\d+)\s*(segundos|seg|minutos|min)\s*(.*)/i);
  if (rem) {
    const n = parseInt(rem[1]) * (/min/.test(rem[2]) ? 60000 : 1000);
    const msg = rem[3] || "¡Hora!";
    pushUser(text);
    pushAssistant(`⏰ Vale${me()}, te avisaré en **${rem[1]} ${rem[2]}**: "${msg}". (Deja la pestaña abierta.)`);
    renderAll();
    setTimeout(() => { toast("⏰ " + msg); try { new Notification("⏰ Recordatorio", { body: msg }); } catch {} speakText(msg); }, Math.min(n, 3600000));
    try { Notification.requestPermission(); } catch {}
    input.value = ""; return;
  }
  pushUser(text, pendingImage);
  const imgCtx = pendingImage; pendingImage = null; updateAttach();
  const fileCtx = pendingFileText; pendingFileText = null; updateAttach();
  input.value = ""; autogrow(); save(); renderAll();
  generating = true; stopFlag = false;
  $("#btnStop").classList.remove("hidden"); $("#btnSend").disabled = true;
  $("#typingRow").classList.remove("hidden");
  const chat = activeChat();
  chat.messages.push({ role: "assistant", content: "" });
  const idx = chat.messages.length - 1;
  const redraw = (p) => { chat.messages[idx].content = p; renderMessages(); $("#typingRow").classList.add("hidden"); chatScroll.scrollTop = chatScroll.scrollHeight; };
  try {
    const low = text.toLowerCase();
    if (/^\/(imagen|img|dibujar|generar imagen)/.test(low) || settings.model === "imagen-pro" && /^(haz|genera|crea|dibuja).*(imagen|foto|dibujo|logo)/.test(low)) {
      const prompt = text.replace(/^\/(imagen|img|dibujar|generar imagen)\s*/i, "").replace(/^(haz|genera|crea|dibuja).*(imagen|foto|dibujo|logo)\s*(de|:)?\s*/i, "") || "paisaje hermoso";
      $("#typingText").textContent = "Generando imagen…";
      const url = imageURL(prompt);
      await typeInto(withThink(`🎨 **"${prompt}"**\n\n![${prompt}](${url})\n\nSi no carga (sin internet), prueba otra vez. Pulsa ⬇ para descargarla.`), redraw);
    } else if (/^\/(buscar|search|web)/.test(low) || (settings.model === "gemini-pro" && /^(busca|investiga|qué es|cual es|cuál es|quién)/.test(low))) {
      $("#typingText").textContent = "Buscando…";
      const r = await webSearch(text);
      await typeInto(withThink(r), redraw);
    } else if (imgCtx) {
      $("#typingText").textContent = "Analizando imagen…";
      let extra = "";
      if (settings.apiKey && !settings.demoMode) { try { extra = "\n\n" + await visionOpenAI(text, imgCtx); } catch (e) { extra = "\n\n⚠️ Visión API falló: " + e.message; } }
      else extra = await analyzeImage(imgCtx);
      await typeInto(withThink(`${extra}`), redraw);
    } else if (API_OK) {
      // ✅ Todo por TU servidor: él decide (OpenAI real si hay key, si no cerebro local)
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text, model: settings.model, userName: settings.userName,
          history: chat.messages.slice(0, -1).filter(m => !m.image).slice(-20).map(m => ({ role: m.role, content: m.content })),
          apiKey: settings.apiKey || undefined, fileText: fileCtx || undefined, image: imgCtx || undefined
        })
      });
      if (!r.ok) throw new Error("Servidor " + r.status);
      const j = await r.json();
      await typeInto(withThink(j.reply || "(vacío)"), redraw);
    } else if (settings.demoMode || !settings.apiKey) {
      await new Promise(r => setTimeout(r, 450));
      await typeInto(withThink(demoAnswer(text, { fileText: fileCtx })), redraw);
    } else {
      await callOpenAI(chat.messages.slice(0, -1), (d) => { chat.messages[idx].content += d; renderMessages(); $("#typingRow").classList.add("hidden"); });
    }
  } catch (e) { chat.messages[idx].content = `⚠️ Error: ${e.message}`; }
  generating = false;
  $("#btnStop").classList.add("hidden"); $("#btnSend").disabled = false;
  $("#typingRow").classList.add("hidden"); $("#typingText").textContent = "Pensando…";
  save(); renderAll(); input.focus();
}
function pushUser(text, image) { let c = activeChat(); if (!c) { newChat(); c = activeChat(); } c.messages.push({ role: "user", content: text, ...(image ? { image } : {}) }); }
function pushAssistant(text) { activeChat().messages.push({ role: "assistant", content: text }); save(); }

async function visionOpenAI(prompt, dataURL) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + settings.apiKey },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: [{ type: "text", text: prompt || "Describe esta imagen" }, { type: "image_url", image_url: { url: dataURL } }] }] })
  });
  if (!res.ok) throw new Error("API " + res.status);
  const j = await res.json();
  return j.choices?.[0]?.message?.content || "(sin respuesta)";
}
async function callOpenAI(history, onDelta) {
  const sys = `Eres un asistente útil en español. Usuario: ${settings.userName || "anon"}. Modelo simulado: ${settings.model}.`;
  const res = await fetch(settings.endpoint, {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + settings.apiKey },
    body: JSON.stringify({ model: settings.model.startsWith("o1") || settings.model.includes("claude") || settings.model.includes("gemini") || settings.model.includes("imagen") ? "gpt-4o-mini" : settings.model, stream: true, messages: [{ role: "system", content: sys }, ...history.filter(m => !m.image).map(m => ({ role: m.role, content: m.content }))] })
  });
  if (!res.ok) throw new Error("API " + res.status + ": " + (await res.text()).slice(0, 200));
  const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
  while (true) {
    if (stopFlag) { reader.cancel(); break; }
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n\n"); buf = parts.pop();
    for (const p of parts) {
      const line = p.trim(); if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim(); if (data === "[DONE]") return;
      try { onDelta(JSON.parse(data).choices?.[0]?.delta?.content || ""); } catch {}
    }
  }
}
async function regenerate(i) {
  const chat = activeChat(); if (!chat || generating) return;
  const u = [...chat.messages.slice(0, i)].reverse().find(m => m.role === "user");
  if (!u) return;
  chat.messages.splice(i, 1); save(); await send(u.content);
}

// ---------- Voz ----------
let recog = null;
function dictar() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return toast("Tu navegador no soporta dictado 🎙 (usa Chrome)");
  if (recog) { recog.stop(); recog = null; return; }
  recog = new SR(); recog.lang = "es-ES"; recog.interimResults = false;
  recog.onresult = (e) => { input.value += (input.value ? " " : "") + e.results[0][0].transcript; autogrow(); };
  recog.onend = () => { recog = null; };
  recog.start(); toast("🎙 Escuchando… habla ahora");
}
function speakText(t) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.slice(0, 300)); u.lang = "es-ES"; speechSynthesis.speak(u); } catch {} }

// ---------- Adjuntos ----------
function updateAttach() {
  const box = $("#attachPreview");
  if (!pendingImage && !pendingFileText) { box.classList.add("hidden"); box.innerHTML = ""; return; }
  box.classList.remove("hidden");
  box.innerHTML = `${pendingImage ? `<img src="${pendingImage}" />` : ""}<span>${pendingImage ? "📷 Foto lista — escribe qué hago con ella" : ""}${pendingFileText ? `📄 Texto cargado (${pendingFileText.length} caracteres)` : ""}</span><button class="x">✕</button>`;
  box.querySelector(".x").onclick = () => { pendingImage = null; pendingFileText = null; updateAttach(); };
}
$("#fileImage").addEventListener("change", (e) => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { pendingImage = r.result; updateAttach(); toast("📷 Foto cargada"); };
  r.readAsDataURL(f); e.target.value = "";
});
$("#fileText").addEventListener("change", (e) => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { pendingFileText = String(r.result).slice(0, 20000); updateAttach(); toast("📄 Archivo cargado — pide resumen"); };
  r.readAsText(f); e.target.value = "";
});

// ---------- UI ----------
function autogrow() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 180) + "px"; }
input.addEventListener("input", autogrow);
input.addEventListener("keydown", (e) => { if (e.key === "Enter" && settings.enterSend && !e.shiftKey) { e.preventDefault(); send(); } });
$("#btnSend").onclick = () => send();
$("#btnStop").onclick = () => { stopFlag = true; };
$("#btnNewChat").onclick = () => newChat();
$("#folderFilter").onchange = () => renderSidebar($("#searchChats").value);
$("#btnNewFolder").onclick = () => { const n = prompt("Nombre del proyecto:"); if (n) { folders.push(n.slice(0, 30)); save(); renderFolders(); $("#folderFilter").value = n; renderSidebar(); } };
$("#searchChats").oninput = (e) => renderSidebar(e.target.value);
$("#btnMenu").onclick = () => { $("#sidebar").classList.add("open"); $("#backdrop").classList.add("open"); };
$("#btnToggleSide").onclick = closeSide; $("#backdrop").onclick = closeSide;
function closeSide() { $("#sidebar").classList.remove("open"); $("#backdrop").classList.remove("open"); }
document.querySelectorAll(".sugg").forEach(b => b.onclick = () => send(b.dataset.prompt));
document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); newChat(); } });
$("#modelBtn").onclick = () => $("#modelMenu").classList.toggle("hidden");
document.querySelectorAll("#modelMenu button").forEach(b => b.onclick = () => {
  settings.model = b.dataset.model;
  if (settings.model === "imagen-pro") toast("🎨 Modo Imagen Pro: escribe lo que quieras dibujar");
  if (settings.model === "o1-think") { thinkMode = true; toast("🧠 Razonamiento o1 activado"); }
  save(); updateBadge(); $("#modelMenu").classList.add("hidden"); $("#inpModel").value = settings.model;
});
$("#btnThink").onclick = () => { thinkMode = !thinkMode; updateBadge(); toast("🧠 Razonamiento " + (thinkMode ? "ON" : "OFF")); };
$("#btnTheme").onclick = () => { const h = document.documentElement; h.dataset.theme = h.dataset.theme === "dark" ? "light" : "dark"; $("#btnTheme").textContent = h.dataset.theme === "dark" ? "🌙" : "☀️"; };
$("#btnDemoMode").onclick = () => { settings.demoMode = !settings.demoMode; save(); updateBadge(); toast(settings.demoMode ? "🧪 Demo ON" : "API " + (settings.apiKey ? "ON" : "sin key — ponla en ⚙️")); };
$("#btnShare").onclick = () => { const c = activeChat(); if (!c) return; navigator.clipboard.writeText(c.messages.map(m => (m.role === "user" ? "TÚ: " : "IA: ") + m.content).join("\n\n")).then(() => toast("Conversación copiada 🔗")); };
$("#btnExport").onclick = () => { const c = activeChat(); if (!c) return toast("No hay chat"); const blob = new Blob([c.messages.map(m => `# ${m.role}\n${m.content}`).join("\n\n")], { type: "text/markdown" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (c.title || "chat") + ".md"; a.click(); };
$("#btnClearAll").onclick = () => { if (confirm("¿Borrar todos los chats?")) { chats = []; activeId = null; save(); renderAll(); } };
$("#btnAttach").onclick = () => { const c = confirm("OK = foto 👁  |  Cancelar = texto 📄"); (c ? $("#fileImage") : $("#fileText")).click(); };
document.querySelectorAll("#toolbar button").forEach(b => b.onclick = () => {
  const t = b.dataset.tool;
  if (t === "imagen") { input.value = "/imagen "; input.focus(); }
  if (t === "buscar") { input.value = "/buscar "; input.focus(); }
  if (t === "voz") dictar();
  if (t === "foto") $("#fileImage").click();
  if (t === "archivo") $("#fileText").click();
  if (t === "pensar") { thinkMode = !thinkMode; updateBadge(); toast("🧠 " + (thinkMode ? "ON" : "OFF")); }
  if (t === "leer") { const c = activeChat(); const last = [...(c?.messages || [])].reverse().find(m => m.role === "assistant"); if (last) speakText(last.content); else toast("Nada que leer aún"); }
});
$("#btnSettings").onclick = () => { $("#inpName").value = settings.userName; $("#inpKey").value = settings.apiKey; $("#inpEndpoint").value = settings.endpoint; $("#inpModel").value = settings.model; $("#inpStream").checked = settings.streamWords; $("#inpEnter").checked = settings.enterSend; $("#inpThink").checked = settings.thinkAlways; $("#modal").classList.remove("hidden"); };
$("#btnCloseSettings").onclick = () => $("#modal").classList.add("hidden");
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("#modal").classList.add("hidden"); });
$("#btnSaveSettings").onclick = () => {
  settings.userName = $("#inpName").value.trim().replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ ]/g, "").slice(0, 30);
  settings.apiKey = $("#inpKey").value.trim(); settings.endpoint = $("#inpEndpoint").value.trim();
  settings.model = $("#inpModel").value.trim() || "gpt-4o";
  settings.streamWords = $("#inpStream").checked; settings.enterSend = $("#inpEnter").checked; settings.thinkAlways = $("#inpThink").checked;
  settings.demoMode = !settings.apiKey; save(); updateBadge(); $("#modal").classList.add("hidden");
  toast(settings.apiKey ? "API + Pro guardados ✅" : "Guardado Pro local 🧪");
};
$("#btnWipeKey").onclick = () => { settings.apiKey = ""; settings.demoMode = true; save(); updateBadge(); $("#inpKey").value = ""; toast("Key borrada"); };
$("#btnWipeMem").onclick = () => { settings.userName = ""; save(); updateBadge(); $("#inpName").value = ""; toast("Memoria borrada 🧠"); };
$("#btnClosePreview").onclick = () => $("#previewModal").classList.add("hidden");

// init (migra chats viejos sin folder)
chats.forEach(c => { if (!("folder" in c)) c.folder = ""; });
if (!chats.length) { const c = { id: uid(), title: "Nuevo chat", created: Date.now(), folder: "", pinned: false, messages: [] }; chats = [c]; activeId = c.id; }
else activeId = chats[0].id;
save(); renderAll(); autogrow();
