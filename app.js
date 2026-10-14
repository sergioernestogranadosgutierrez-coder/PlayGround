// FusionAI — mezcla Claude + ChatGPT + Gemini en una sola app
// Llamadas directas desde el navegador (BYOK). Sin claves → modo demo.

const $ = (s) => document.querySelector(s);
const chat = $('#chat'), form = $('#form'), input = $('#input');
const typing = $('#typing');

let currentModel = 'claude';
let history = JSON.parse(localStorage.getItem('fusion_history') || '[]');

const MODELS = {
  claude:  { name: 'Claude',  cls: 'claude',  badge: 'C · Claude' },
  chatgpt: { name: 'ChatGPT', cls: 'chatgpt', badge: 'G · ChatGPT' },
  gemini:  { name: 'Gemini',  cls: 'gemini',  badge: '✦ · Gemini' },
  fusion:  { name: 'Fusión',  cls: 'fusion',  badge: '◈ · Fusión ×3' },
};

function keys() {
  return {
    openai: $('#keyOpenAI').value.trim() || localStorage.getItem('k_openai') || '',
    claude: $('#keyClaude').value.trim() || localStorage.getItem('k_claude') || '',
    gemini: $('#keyGemini').value.trim() || localStorage.getItem('k_gemini') || '',
  };
}
function refreshStatus() {
  const k = keys();
  const live = currentModel === 'fusion'
    ? (k.openai || k.claude || k.gemini)
    : currentModel === 'chatgpt' ? k.openai : currentModel === 'claude' ? k.claude : k.gemini;
  $('#statusDot').className = 'status-dot ' + (live ? 'live' : 'demo');
  $('#statusText').textContent = live ? 'Conectado (API real)' : 'Modo demo';
}
function saveKeysToStorage() {
  localStorage.setItem('k_openai', $('#keyOpenAI').value.trim());
  localStorage.setItem('k_claude', $('#keyClaude').value.trim());
  localStorage.setItem('k_gemini', $('#keyGemini').value.trim());
  refreshStatus();
}

// ---- UI ----
document.querySelectorAll('.model').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.model').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  currentModel = b.dataset.model;
  refreshStatus();
  addBot(`Cambiaste a **${MODELS[currentModel].name}**. ${currentModel === 'fusion' ? 'Preguntaré a las 3 IAs y compararé.' : 'Todo lo que escribas irá a ' + MODELS[currentModel].name + '.'}`, currentModel);
}));
$('#btnSaveKeys').onclick = () => { saveKeysToStorage(); addBot('Claves guardadas solo en tu navegador. Ya puedo llamar a las APIs reales.', currentModel); };
$('#btnClearKeys').onclick = () => {
  localStorage.removeItem('k_openai'); localStorage.removeItem('k_claude'); localStorage.removeItem('k_gemini');
  $('#keyOpenAI').value = $('#keyClaude').value = $('#keyGemini').value = '';
  refreshStatus();
};
$('#btnKeys').onclick = () => $('#keysCard').scrollIntoView({ behavior: 'smooth' });
$('#btnClear').onclick = () => { history = []; localStorage.removeItem('fusion_history'); chat.innerHTML = ''; welcome(); };
$('#btnExport').onclick = () => {
  const blob = new Blob([history.map(h => `[${h.role}] (${h.model||''}): ${h.text}`).join('\n\n')], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fusionai-chat.txt'; a.click();
};
$('#keyOpenAI').value = localStorage.getItem('k_openai') || '';
$('#keyClaude').value = localStorage.getItem('k_claude') || '';
$('#keyGemini').value = localStorage.getItem('k_gemini') || '';

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function md(s){
  let h = esc(s);
  h = h.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  h = h.replace(/`(.+?)`/g, '<code>$1</code>');
  h = h.replace(/\n/g, '<br>');
  return h;
}
function addUser(text){
  chat.insertAdjacentHTML('beforeend', `<div class="msg user">${md(text)}</div>`);
  chat.scrollTop = chat.scrollHeight;
}
function addBot(text, model='claude'){
  const m = MODELS[model] || MODELS.claude;
  chat.insertAdjacentHTML('beforeend', `<div class="msg bot"><div class="who"><span class="badge ${m.cls}">${m.badge}</span></div><div>${md(text)}</div></div>`);
  chat.scrollTop = chat.scrollHeight;
}
function addFusion(results, synthesis){
  const cols = results.map(r => `<div class="fusion-col"><h4>${r.ok ? '✅' : '⚠️'} ${r.name}</h4><div>${md(r.text)}</div></div>`).join('');
  const syn = ($('#optSynthesis').checked && synthesis) ? `<div class="synthesis"><b>◈ Síntesis FusionAI</b><br>${md(synthesis)}</div>` : '';
  chat.insertAdjacentHTML('beforeend', `<div class="msg bot" style="max-width:100%"><div class="who"><span class="badge fusion">◈ Fusión ×3 — comparativa</span></div><div class="fusion-grid">${cols}</div>${syn}</div>`);
  chat.scrollTop = chat.scrollHeight;
}
function welcome(){
  addBot('👋 ¡Hola! Soy **FusionAI**. Mezclo **Claude + ChatGPT + Gemini** en una sola app.\n\n• Elige una IA a la izquierda o usa **Fusión ×3** para comparar las 3 a la vez.\n• Sin API keys estoy en **modo demo**. Pega tus claves para respuestas reales.', 'fusion');
}
history.forEach(h => h.role === 'user' ? addUser(h.text) : addBot(h.text, h.model));
if (!history.length) welcome();
refreshStatus();

// ---- Llamadas API reales ----
async function callChatGPT(prompt, apiKey){
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800 })
  });
  if (!r.ok) throw new Error('OpenAI ' + r.status);
  const j = await r.json();
  return j.choices?.[0]?.message?.content || '(sin respuesta)';
}
async function callClaude(prompt, apiKey){
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) throw new Error('Anthropic ' + r.status);
  const j = await r.json();
  return (j.content || []).map(c => c.text || '').join('') || '(sin respuesta)';
}
async function callGemini(prompt, apiKey){
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!r.ok) throw new Error('Gemini ' + r.status);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '(sin respuesta)';
}
function demoReply(prompt, model){
  const who = { claude: 'Claude', chatgpt: 'ChatGPT', gemini: 'Gemini' }[model] || model;
  return `[DEMO · ${who}] Pega tu API key de ${who} para respuesta real.\n\nTu pregunta fue: "${prompt.slice(0, 200)}"\n\nEn modo demo simulo el estilo de ${who}: respuesta estructurada, útil y breve. Activa la clave arriba y comparame en modo Fusión ×3.`;
}
async function askOne(model, prompt){
  const k = keys();
  try {
    if (model === 'chatgpt') return { name: 'ChatGPT', text: k.openai ? await callChatGPT(prompt, k.openai) : demoReply(prompt, 'chatgpt'), ok: !!k.openai };
    if (model === 'claude')  return { name: 'Claude',  text: k.claude ? await callClaude(prompt, k.claude) : demoReply(prompt, 'claude'), ok: !!k.claude };
    if (model === 'gemini')  return { name: 'Gemini',  text: k.gemini ? await callGemini(prompt, k.gemini) : demoReply(prompt, 'gemini'), ok: !!k.gemini };
  } catch (e) {
    return { name: model, text: 'Error llamando a la API: ' + e.message + '. Revisa tu key y CORS.', ok: false };
  }
}
function synthesize(prompt, results){
  const reals = results.filter(r => r.ok).length;
  return `Pregunta: "${prompt.slice(0, 120)}"\n\n• **Claude** aporta el razonamiento más estructurado.\n• **ChatGPT** suele ser el más directo y práctico.\n• **Gemini** destaca con datos actuales y multimodal.\n\n${reals === 0 ? 'Estás en **modo demo**: pega tus 3 API keys para comparar respuestas reales.' : `Comparé ${reals}/3 respuestas reales. Quédate con lo mejor de cada una.`} Consejo: pide "dame código + explicación + fuentes" para ver la diferencia de cada modelo.`;
}

// ---- Envío ----
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = '';
  addUser(prompt);
  history.push({ role: 'user', text: prompt }); localStorage.setItem('fusion_history', JSON.stringify(history));
  typing.classList.remove('hidden');

  if (currentModel === 'fusion') {
    const [a, b, c] = await Promise.all([askOne('claude', prompt), askOne('chatgpt', prompt), askOne('gemini', prompt)]);
    typing.classList.add('hidden');
    const syn = synthesize(prompt, [a, b, c]);
    addFusion([a, b, c], syn);
    history.push({ role: 'bot', model: 'fusion', text: `[Claude]: ${a.text}\n\n[ChatGPT]: ${b.text}\n\n[Gemini]: ${c.text}\n\n[Síntesis]: ${syn}` });
  } else {
    const r = await askOne(currentModel, prompt);
    typing.classList.add('hidden');
    addBot(r.text, currentModel);
    history.push({ role: 'bot', model: currentModel, text: r.text });
  }
  localStorage.setItem('fusion_history', JSON.stringify(history));
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});
