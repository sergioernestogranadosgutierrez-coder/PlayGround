// Servidor propio — ChatGPT Clone PRO
// Node 22, CERO dependencias. Sirve el frontend + API para que todo funcione:
//   GET  /                    -> app (index.html, css, js)
//   GET  /api/health          -> estado del servidor
//   GET  /api/models          -> modelos Pro disponibles
//   POST /api/chat            -> chat ( OpenAI real si hay key, si no cerebro local )
//   GET  /api/image?prompt=   -> genera imagen (proxy gratis, sin key)
//   GET  /api/search?q=        -> búsqueda web real (Wikipedia, sin key)
//   POST /api/vision          -> analiza foto (real con key, básica sin key)
//
// Key opcional:  OPENAI_API_KEY=sk-... node server.js   (también vale ponerla en ⚙️)
// Puerto:        PORT=3000 node server.js
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

// Compatibilidad con el desplegador (si existe, deja constancia del output)
if (process.env.OPENCODE_WEB_DIR) {
  try {
    writeFileSync(join(process.env.OPENCODE_WEB_DIR, "deployment-output.json"), JSON.stringify({ project: ROOT, directory: resolve(ROOT) }));
  } catch {}
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon", ".md": "text/markdown; charset=utf-8" };

// ---- Límite anti-abuso simple: 180 req/min por IP solo en /api ----
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.reset) { hits.set(ip, { n: 1, reset: now + 60000 }); return false; }
  e.n++;
  return e.n > 180;
}

function send(res, code, body, type = "application/json; charset=utf-8") {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "Content-Type": type, "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
  res.end(data);
}

function readBody(req, limit = 6 * 1024 * 1024) {
  return new Promise((resolveP, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => { size += c.length; chunks.push(c); if (size > limit) { reject(new Error("Cuerpo demasiado grande (máx 6MB)")); req.destroy(); } });
    req.on("end", () => resolveP(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// ================= CEREBRO LOCAL (cuando no hay API key) =================
function brain(q, userName = "", fileText = "") {
  const s = q.toLowerCase();
  const hi = userName ? `, ${userName}` : "";
  if (/fotos[ií]ntesis/.test(s)) return `## 🌱 Fotosíntesis, fácil${hi} (vía tu servidor)\n\n1. **Ingredientes**: luz + agua + CO₂\n2. **Receta**: la clorofila fabrica glucosa\n3. **Regalo**: oxígeno para respirar\n\n\`6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂\` 🌻`;
  if (/plan.*python|aprender python|python.*7/.test(s)) {
    const extra = /grafic|progreso|chart/.test(s) ? `\n\n**Tu progreso:**\n[[CHART:2,4,6,8,7,9,10]]` : "";
    return `## 📚 Plan 7 días Python${hi} (vía tu servidor)\n\n- **D1**: variables y \`print()\`\n- **D2**: \`if/for/while\`\n- **D3**: funciones\n- **D4**: listas y dicts\n- **D5**: archivos + \`try/except\`\n- **D6**: proyecto agenda\n- **D7**: POO + GitHub\n\n\`\`\`python\nnombre = input("¿Cómo te llamas? ")\nprint(f"Hola, {nombre} 👋")\n\`\`\`${extra}`;
  }
  if (/grafica|gráfica|chart|progreso/.test(s)) {
    const nums = q.match(/\d+(\.\d+)?/g);
    if (nums && nums.length >= 2) {
      const arr = nums.slice(0, 12).map(Number);
      const media = (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
      return `## 📊 Tu gráfica${hi} (vía tu servidor)\n\n[[CHART:${arr.join(",")}]]\n\nMedia: **${media}**.`;
    }
  }
  if (/ordenar.*array|sort|javascript.*orden|js.*fecha/.test(s)) return `Ordenar por fecha en **JS** (pulsa ▶ Ejecutar):\n\n\`\`\`javascript\nconst eventos = [{nombre:"Conf",fecha:"2026-11-02"},{nombre:"Demo",fecha:"2026-09-15"}];\neventos.sort((a,b)=> new Date(a.fecha)-new Date(b.fecha));\nconsole.log(eventos);\n\`\`\``;
  if (/landing|p[aá]gina|canvas|<html|html.*ejemplo/.test(s)) return `Canvas HTML (pulsa 👁 Vista previa):\n\n\`\`\`html\n<h1>Hola${hi} 👋</h1>\n<p>Generado por tu propio servidor.</p>\n<button onclick="alert('Funciona')">Púlsame</button>\n<style>body{font-family:system-ui;text-align:center;padding:40px}h1{color:#10a37f}</style>\n\`\`\``;
  if (/negocio|ideas|dinero|emprender/.test(s)) return `## 💡 5 ideas 2026${hi}\n\n1. **Micro-SaaS IA** para nichos\n2. **Newsletter de pago**\n3. **Plantillas** Notion/Excel\n4. **Clases Zoom**\n5. **Videos UGC**\n\n¿Te armo el plan de alguna?`;
  if (/traduce|translate/.test(s)) return `Puedo traducir al momento. Escríbeme: *"traduce al inglés: hola mundo"* 🌍 → *"hello world"*. Pásame tu frase.`;
  if ((/resumen|resume|analiza/.test(s)) && fileText) {
    const words = fileText.split(/\s+/).filter(Boolean).length;
    return `## 📄 Resumen (vía tu servidor)${hi}\n\n- **Palabras**: ${words}\n- **Caracteres**: ${fileText.length}\n- **Idea principal**: ${fileText.split(".").slice(0, 3).join(". ").slice(0, 400)}…`;
  }
  if (/c[oó]digo|funci[oó]n|python|javascript|typescript|sql|error|bug/.test(s)) return `¡Vamos con código! 💻${hi}\n\n\`\`\`javascript\nfunction debounce(fn, ms=300){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}\nconsole.log("Pega tu código y pulsa ▶ Ejecutar");\n\`\`\``;
  if (/gracias/.test(s)) return `¡De nada${hi}! 😊 (respuesta de tu propio servidor)`;
  if (/hola|buenas|quien eres|quién eres|qué puedes|que puedes|health|ping/.test(s)) return `¡Hola${hi}! 👋 Soy tu servidor propio (Node, sin dependencias).\n\nPuedo: 💬 chat • 🎨 \`/imagen ...\` • 🔍 \`/buscar ...\` • 👁 visión • 📄 resumir archivos • 📊 gráficas • ⏰ recordatorios.`;
  return `Entendido${hi}: **"${q.slice(0, 140)}"**\n\nTe responde tu propio servidor 🖥️. Prueba:\n- 🎨 \`/imagen un castillo flotante\`\n- 🔍 \`/buscar fotosíntesis\`\n- 📊 \`grafica: 3,7,5,9\`\n\nCon \`OPENAI_API_KEY\` en el servidor (o tu key en ⚙️) respondo con GPT real.`;
}

function pickModel(m) {
  if (m === "gpt-4o") return "gpt-4o";
  return "gpt-4o-mini"; // o1/claude/gemini/imagen se sirven con mini si hay key
}

async function openaiChat({ messages, model, apiKey }) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({ model: pickModel(model), messages })
  });
  if (!r.ok) throw new Error("OpenAI " + r.status + ": " + (await r.text()).slice(0, 200));
  const j = await r.json();
  return j.choices?.[0]?.message?.content || "(vacío)";
}

function dataUrlInfo(dataURL) {
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(dataURL || "");
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  let dims = "";
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    dims = `, ${buf.readUInt32BE(16)}×${buf.readUInt32BE(20)}px`;
  }
  return { mime: m[1], kb: (buf.length / 1024).toFixed(1), dims };
}

// ================= SERVIDOR =================
const server = createServer((req, res) => {
  handle(req, res).catch((e) => {
    try { send(res, 500, { error: String(e.message || e) }); } catch {}
  });
});

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const ip = req.socket.remoteAddress || "x";

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" });
    res.end();
    return;
  }

  // ---------- API ----------
  if (url.pathname.startsWith("/api/")) {
    if (limited(ip)) return send(res, 429, { error: "Demasiadas peticiones, espera un minuto ⏳" });

    if (url.pathname === "/api/health" && req.method === "GET") {
      return send(res, 200, { ok: true, service: "chatgpt-clone-pro", pro: true, openai: Boolean(OPENAI_KEY), time: new Date().toISOString() });
    }

    if (url.pathname === "/api/models" && req.method === "GET") {
      return send(res, 200, { models: ["gpt-4o", "o1-think", "gpt-4o-mini", "claude-pro", "gemini-pro", "imagen-pro"] });
    }

    if (url.pathname === "/api/search" && req.method === "GET") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return send(res, 400, { error: "Falta ?q=" });
      try {
        const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
        if (!r.ok) throw new Error("wiki " + r.status);
        const j = await r.json();
        return send(res, 200, { title: j.title, extract: j.extract, url: j.content_urls?.desktop?.page || `https://es.wikipedia.org/wiki/${encodeURIComponent(q)}` });
      } catch {
        return send(res, 200, { reply: `## 🔍 Búsqueda: "${q}"\n\n(La Wikipedia no responde ahora mismo.)\n\n**Resumen base:** ${q} es un tema importante. Pídeme *"explícame ${q} con ejemplo"* y lo desarrollo aquí mismo.` });
      }
    }

    if (url.pathname === "/api/image" && req.method === "GET") {
      const prompt = (url.searchParams.get("prompt") || "").trim().slice(0, 500);
      if (!prompt) return send(res, 400, { error: "Falta ?prompt=" });
      try {
        const up = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 99999)}&nologo=true&model=flux`);
        if (!up.ok) throw new Error("generador " + up.status);
        const buf = Buffer.from(await up.arrayBuffer());
        res.writeHead(200, { "Content-Type": up.headers.get("content-type") || "image/jpeg", "Cache-Control": "public, max-age=3600", "Content-Length": buf.length, "Access-Control-Allow-Origin": "*" });
        res.end(buf);
      } catch (e) {
        return send(res, 502, { error: "Generador de imágenes no disponible ahora: " + String(e.message || e) });
      }
      return;
    }

    if ((url.pathname === "/api/chat" || url.pathname === "/api/vision") && req.method === "POST") {
      let body;
      try { body = JSON.parse(await readBody(req)); }
      catch (e) { return send(res, 400, { error: String(e.message || e) }); }
      const message = String(body.message || body.prompt || "").slice(0, 4000);
      const history = Array.isArray(body.history) ? body.history.slice(-20).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 2000) })) : [];
      const model = String(body.model || "gpt-4o");
      const userName = String(body.userName || "").slice(0, 30);
      const fileText = String(body.fileText || "").slice(0, 20000);
      const key = String(body.apiKey || "") || OPENAI_KEY;

      // --- Visión: imagen vía servidor ---
      if (body.image) {
        const info = dataUrlInfo(body.image);
        if (key) {
          try {
            const content = [{ type: "text", text: message || "Describe esta imagen en español" }, { type: "image_url", image_url: { url: body.image } }];
            const reply = await openaiChat({ messages: [{ role: "user", content }], model: "gpt-4o-mini", apiKey: key });
            return send(res, 200, { reply, via: "openai-vision" });
          } catch (e) {
            return send(res, 200, { reply: `⚠️ Visión OpenAI falló (${esc0(e)}). Sin key uso análisis básico.`, via: "error" });
          }
        }
        if (!info) return send(res, 200, { reply: "No pude leer esa imagen, prueba con otro archivo.", via: "demo-vision" });
        return send(res, 200, {
          reply: `Veo tu imagen 👁 (${info.mime}, ${info.kb} KB${info.dims}). La analicé en tu propio servidor.\n\n- Si es un documento: pide *"resúmelo"* o *"tradúcelo"*\n- Si es código: dime el lenguaje y el error\n- Con API key en el servidor activo visión GPT-4o real.`,
          via: "demo-vision"
        });
      }

      if (!message && url.pathname === "/api/chat") return send(res, 400, { error: "Falta message" });

      // --- Chat con OpenAI real si hay key ---
      if (key && url.pathname === "/api/chat") {
        try {
          const sys = `Eres un asistente útil que responde en español.${userName ? ` El usuario se llama ${userName}.` : ""}${fileText ? ` Texto del usuario para analizar: """${fileText.slice(0, 6000)}"""` : ""}`;
          const reply = await openaiChat({ messages: [{ role: "system", content: sys }, ...history, ...(message ? [{ role: "user", content: message }] : [])], model, apiKey: key });
          return send(res, 200, { reply, via: "openai" });
        } catch (e) {
          return send(res, 200, { reply: `⚠️ OpenAI falló (${esc0(e)}). Te respondo en modo local:\n\n${brain(message, userName, fileText)}`, via: "demo-fallback" });
        }
      }
      // --- Chat local del servidor ---
      return send(res, 200, { reply: brain(message, userName, fileText), via: "demo" });
    }

    return send(res, 404, { error: "API no encontrada" });
  }

  // ---------- Estático ----------
  if (req.method !== "GET") return send(res, 405, "Método no permitido", "text/plain; charset=utf-8");
  const safe = resolve(ROOT, "." + decodeURIComponent(url.pathname));
  if (safe !== resolve(ROOT) && !safe.startsWith(resolve(ROOT) + "/")) return send(res, 404, "No encontrado", "text/plain; charset=utf-8");
  let file = safe;
  try {
    if (statSync(file).isDirectory()) file = join(file, "index.html");
  } catch { return send(res, 404, "No encontrado", "text/plain; charset=utf-8"); }
  if (!existsSync(file)) return send(res, 404, "No encontrado", "text/plain; charset=utf-8");
  try {
    const content = readFileSync(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(content);
  } catch { send(res, 404, "No encontrado", "text/plain; charset=utf-8"); }
}

function esc0(e) { return String(e.message || e).slice(0, 160); }

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor propio PRO en http://localhost:${PORT}  (OpenAI: ${OPENAI_KEY ? "ON" : "OFF, modo local"})`);
});
