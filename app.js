// ServerGratis · Musu — lógica 100% estática (GitHub Pages ready)
const GAMES = [
 {id:"minecraft",name:"Minecraft",icon:"⛏️",players:"Ilimitado (10–20 gratis)",diff:"fácil",tags:["supervivencia","mods","cooperativo","24/7"],ram:"2–4 GB",cpu:"2 vCPU",disk:"2 GB + mundo",port:25565,
  dl:"Servidor oficial (Paper, ideal con plugins): papermc.io · Vanilla: minecraft.net/download/server",
  steps:["Descarga Paper.jar y crea una carpeta (ej: servidor-mc).","Crea start.bat / start.sh con: java -Xmx2G -jar paper.jar nogui","Ejecuta una vez, acepta el EULA (eula=true) y vuelve a ejecutar.","Instala Playit.gg, crea túnel TCP al puerto 25565 y comparte la dirección."],
  config:"# server.properties\nmotd=Mi servidor Musu\nmax-players=10\nserver-port=25565\ndifficulty=normal\nonline-mode=true",
  errors:[["No se pudo conectar: revisa que el servidor siga abierto y que des a tus amigos la dirección playit completa con puerto.","OutOfMemory: sube -Xmx2G a -Xmx4G si tu PC / Oracle tiene RAM."]]},
 {id:"terraria",name:"Terraria",icon:"🌲",players:"Hasta 8 (16 con TShock)",diff:"fácil",tags:["cooperativo","mods","supervivencia","24/7"],ram:"1–2 GB",cpu:"1–2 vCPU",disk:"500 MB",port:7777,
  dl:"Servidor dedicado incluido con el juego en Steam (TerrariaServer.exe) · Mods: tModLoader en Steam",
  steps:["En Steam: Terraria → Herramientas → instala Terraria Dedicated Server.","Ejecuta TerrariaServer.exe, elige mundo y puerto 7777.","Para jugar con mods instala tModLoader (gratis si tienes Terraria).","Sin abrir puertos: usa Playit.gg (TCP 7777) o Radmin VPN."],
  config:"world=/home/user/.local/share/Terraria/Worlds/mundo.wld\nmaxplayers=8\nport=7777\npassword=tupassword\nmotd=Servidor Musu",
  errors:[["Versión distinta: todos deben usar la misma versión de Terraria / tModLoader.","Puerto ocupado: cambia 7777 por 7778 en servidor y túnel."]]},
 {id:"stardew",name:"Stardew Valley",icon:"🚜",players:"Hasta 8",diff:"fácil",tags:["cooperativo"],ram:"1 GB",cpu:"1 vCPU",disk:"500 MB",port:24642,
  dl:"Sin servidor dedicado: el anfitrión usa su partida en modo cooperativo (Steam/GOG). Mods: SMAPI + Stardew Valley Expanded",
  steps:["El anfitrión inicia partida Cooperativa → Invitar por LAN o código Steam.","Todos instalan Tailscale y se unen a la misma red.","El invitado escribe la IP Tailscale del anfitrión (100.x.y.z).","Con mods: todos instalan la misma versión de SMAPI."],
  config:"// Stardew no usa archivo de servidor.\n// Anfitrión: Cooperativo > Hospedar. Invitados: unirse por IP Tailscale.\nmaxJugadores=8",
  errors:[["No aparece la partida: desactiva firewall o usa IP Tailscale directa.","Desync con mods: verifica que todos tengan idéntica lista de mods."]]},
 {id:"valheim",name:"Valheim",icon:"⚔️",players:"Hasta 10",diff:"media",tags:["supervivencia","cooperativo","mods","24/7"],ram:"2–4 GB",cpu:"2 vCPU",disk:"2 GB",port:2456,
  dl:"SteamCMD AppID 896660 (valheim_server) · Mods: BepInEx + ValheimPlus",
  steps:["Instala SteamCMD e instala con: app_update 896660 validate","Edita start_headless.sh con nombre, mundo y contraseña (mín. 5 caracteres).","Abre puertos 2456-2458 UDP en firewall + túnel Playit UDP.","Comparte IP o únete por Steam → Unirse por IP."],
  config:'./valheim_server.x86_64 -nographics -batchmode -name "Musu Vikingos" -port 2456 -world MundoMusu -password secreto123 -public 1',
  errors:[["Servidor no visible: usa conexión directa por IP en Steam, no el navegador.","Contraseña rechazada: debe tener 5+ caracteres y el nombre no puede incluir la contraseña."]]},
 {id:"factorio",name:"Factorio",icon:"🏭",players:"Hasta 255",diff:"media",tags:["cooperativo","mods","24/7"],ram:"2 GB",cpu:"2 vCPU",disk:"2 GB",port:34197,
  dl:"Descarga headless en factorio.com/download (requiere cuenta con juego) · o SteamCMD AppID 427520",
  steps:["Descarga factorio headless y descomprime.","Genera mapa: ./bin/x64/factorio --create saves/musu.zip","Lanza: ./bin/x64/factorio --start-server musu.zip --server-settings server-settings.json","Comparte IP con ZeroTier/Tailscale o Playit UDP 34197."],
  config:'{\n  "name": "Musu Factory",\n  "max_players": 8,\n  "game_password": "",\n  "visibility": "public"\n}',
  errors:[["Desync por mods: todos con la misma versión y mismo pack de mods.","No conecta: abre UDP 34197 en firewall y túnel."]]},
 {id:"zomboid",name:"Project Zomboid",icon:"🧟",players:"Hasta 32 (recomendado 8–16)",diff:"difícil",tags:["supervivencia","mods","24/7"],ram:"4 GB+",cpu:"2–4 vCPU",disk:"5 GB",port:16261,
  dl:"SteamCMD AppID 380870 (servidor dedicado, necesitas el juego en la cuenta)",
  steps:["Instala servidor: app_update 380870 validate","Edita servertest.ini: MaxPlayers, Password, Port=16261.","Abre TCP+UDP 16261 y 16262 en firewall.","Invita por Steam → Unirse o IP directa + contraseña."],
  config:"MaxPlayers=16\nPassword=musu123\nPort=16261\nOpen=true\nPVP=false",
  errors:[["RAM insuficiente: sube a 4 GB en ProjectZomboid64.json (-Xmx4g).","Mods rotos: desactiva mods y añade de uno en uno por Workshop ID."]]},
 {id:"palworld",name:"Palworld",icon:"🐾",players:"Hasta 32",diff:"difícil",tags:["supervivencia","cooperativo","24/7"],ram:"8–16 GB",cpu:"4 vCPU",disk:"10 GB",port:8211,
  dl:"SteamCMD AppID 2394010 (PalServer). Ojo: exige bastante RAM",
  steps:["Instala: app_update 2394010 validate","Edita PalWorldSettings.ini (nombre, contraseña, max jugadores).","Abre UDP 8211 y 27015.","No recomendado en e2-micro: usa tu PC u Oracle ARM."],
  config:'[/Script/Pal.PalGameWorldSettings]\nServerName="Musu Pals"\nServerPassword=""\nMaxPlayers=8\nServerPort=8211',
  errors:[["Se cierra solo: falta RAM (mínimo 8 GB reales).","No aparece online: espera 5 min tras arrancar, el servidor tarda."]]},
];

const $ = s => document.querySelector(s);
const toast = m => { const t=$("#toast"); t.textContent=m; t.style.display="block"; setTimeout(()=>t.style.display="none",2200); };
async function copyText(txt){
  try { await navigator.clipboard.writeText(txt); toast("Copiado ✅"); }
  catch {
    const ta=document.createElement("textarea"); ta.value=txt; document.body.appendChild(ta);
    ta.select(); try{document.execCommand("copy"); toast("Copiado ✅");}catch{toast("No se pudo copiar 😕");}
    ta.remove();
  }
}
const esc = s => String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const store = {
  get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};

// Tema + idioma
$("#themeBtn").onclick = () => { const h=document.documentElement; h.dataset.theme = h.dataset.theme==="dark"?"light":"dark"; $("#themeBtn").textContent = h.dataset.theme==="dark"?"🌙":"☀️"; };
const I18N = { en:{ "hero.title":"Create your free server in minutes","hero.sub":"Step-by-step guides to play with friends in Terraria, Minecraft, Valheim, Stardew Valley and more. No port forwarding, no paying.","hero.cta1":"Choose a game","hero.cta2":"How it works","nav.games":"Games","nav.hosting":"Hosting","nav.net":"Connection","nav.wizard":"Assistant","nav.gen":"Generator" } };
let lang="es";
$("#langBtn").onclick = () => {
  lang = lang==="es"?"en":"es"; $("#langBtn").textContent = lang==="es"?"ES / EN":"EN / ES";
  document.querySelectorAll("[data-i18n]").forEach(el=>{ const k=el.dataset.i18n; if(lang==="en"&&I18N.en[k]){el.dataset.es??=el.textContent;el.textContent=I18N.en[k];} else if(el.dataset.es){el.textContent=el.dataset.es;} });
  toast(lang==="es"?"Idioma: Español":"Language: English");
};

// Catálogo
let favs = store.get("musu_favs",[]);
function renderGames(filter="all", diff="all", q=""){
  const grid=$("#gameGrid"); grid.innerHTML="";
  GAMES.filter(g=>(filter==="all"||g.tags.includes(filter))&&(diff==="all"||g.diff===diff)&&((g.name+g.id).toLowerCase().includes(q.toLowerCase()))).forEach(g=>{
    const d=document.createElement("div"); d.className="card"; d.id="card-"+g.id;
    const dc = g.diff==="fácil"?"easy":g.diff==="media"?"mid":"hard";
    d.innerHTML=`<div class="cover">${g.icon}</div><h3>${g.name}</h3>
      <div class="meta"><span class="tag ${dc}">${g.diff}</span><span class="tag">👥 ${g.players}</span>${g.tags.map(t=>`<span class="tag">#${t}</span>`).join("")}</div>
      <p class="muted small">RAM ${g.ram} · Puerto ${g.port}</p>
      <div class="card-actions"><button class="btn primary small" data-guide="${g.id}">Ver guía</button><button class="btn ghost small" data-fav="${g.id}">${favs.includes(g.id)?"⭐":"☆"}</button></div>`;
    grid.appendChild(d);
  });
  $("#favCount").textContent=favs.length;
}
document.querySelectorAll("#catalogo .chip").forEach(c=>c.onclick=()=>{document.querySelectorAll("#catalogo .chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");renderGames(c.dataset.filter,$("#diffFilter").value,$("#globalSearch").value);});
$("#diffFilter").onchange=e=>renderGames(document.querySelector("#catalogo .chip.active").dataset.filter,e.target.value,$("#globalSearch").value);
$("#globalSearch").oninput=e=>{renderGames(document.querySelector("#catalogo .chip.active").dataset.filter,$("#diffFilter").value,e.target.value);};
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-fav]"); if(f){const id=f.dataset.fav; favs=favs.includes(id)?favs.filter(x=>x!==id):[...favs,id]; store.set("musu_favs",favs); renderGames(document.querySelector("#catalogo .chip.active")?.dataset.filter||"all",$("#diffFilter").value,$("#globalSearch").value); toast("Favoritos guardados ⭐"); return;}
  const g=e.target.closest("[data-guide]"); if(g){showGuide(g.dataset.guide); document.querySelector("#guia").scrollIntoView({behavior:"smooth"}); return;}
  const c=e.target.closest("[data-copy]"); if(c){copyText(c.dataset.copy); return;}
  if(e.target.closest("#guideCopy")){copyText(currentGuideConfig); return;}
  const chk=e.target.closest("[data-check]"); if(chk){checkServer(+chk.dataset.check); return;}
  const tog=e.target.closest("[data-toggle]"); if(tog){toggleServer(+tog.dataset.toggle); return;}
});
$("#favBtn").onclick=()=>{ if(!favs.length) return toast("Aún no tienes favoritos — pulsa ☆"); renderGames(); toast("Mostrando todo · tus ⭐: "+favs.length); };

// Buscador hero
$("#heroSearch").oninput=e=>{ const q=e.target.value.toLowerCase(); const box=$("#heroResults");
  if(!q){box.style.display="none";return;}
  const m=GAMES.filter(g=>(g.name+g.id).toLowerCase().includes(q)).slice(0,5);
  box.innerHTML=m.map(g=>`<button data-guide="${g.id}">${g.icon} ${g.name} — ${g.diff} · 👥 ${g.players}</button>`).join("")||"<button disabled>Sin resultados, prueba 'Minecraft'</button>";
  box.style.display="block";
};

// Guía
let currentGuideConfig = "";
function renderPicker(){ $("#guidePicker").innerHTML=GAMES.map(g=>`<button class="chip" data-guide="${g.id}">${g.icon} ${g.name}</button>`).join(""); }
function showGuide(id){
  const g=GAMES.find(x=>x.id===id); if(!g) return;
  currentGuideConfig = g.config;
  const errs = g.errors.flat();
  $("#guideContent").innerHTML=`
    <h3>${g.icon} ${g.name} — guía completa</h3>
    <div class="meta"><span class="tag">RAM ${g.ram}</span><span class="tag">CPU ${g.cpu}</span><span class="tag">Disco ${g.disk}</span><span class="tag">Puerto ${g.port}</span></div>
    <h4>⬇️ Descarga</h4><p>${g.dl}</p>
    <h4>🧭 Pasos</h4><ol>${g.steps.map((s,i)=>`<li><strong>Paso ${i+1}.</strong> ${s}<br><span class="muted small">[captura ${i+1}: aquí iría imagen del paso]</span></li>`).join("")}</ol>
    <h4>⚙️ Configuración (puerto, contraseña, jugadores)</h4><pre>${esc(g.config)}</pre>
    <button class="btn small" id="guideCopy">Copiar configuración</button>
    <h4>🩹 Errores comunes</h4><ul>${errs.map(x=>`<li>${x}</li>`).join("")}</ul>`;
}

// Asistente
$("#wGo").onclick=()=>{
  const game=$("#wGame").value, n=+$("#wFriends").value, all=$("#w247").checked, pc=$("#wPC").checked;
  let r="";
  if(game==="Stardew Valley"||n<=4&&!all) r=`✅ <strong>Tailscale + tu PC.</strong> Para ${game} con ${n} amigos no necesitas servidor 24/7. Todos instalan Tailscale y el anfitrión hospeda.`;
  else if(all&&n>6) r=`✅ <strong>Oracle Cloud Always Free + Playit.gg.</strong> Para ${game} con ${n} amigos y 24/7 necesitas 4 CPU / 24 GB de Oracle. Sigue la guía de “Oracle” + túnel Playit.`;
  else if(all) r=`✅ <strong>Oracle Cloud u Google e2-micro + Playit.gg.</strong> 24/7 barato para ${game}. Si es Minecraft usa Aternos; si es Terraria/Valheim usa Oracle.`;
  else if(!pc) r=`✅ <strong>Aternos / FalixNodes.</strong> Sin PC potente, usa hosting con panel web gratis para ${game}.`;
  else r=`✅ <strong>Tu PC + Playit.gg.</strong> Lo más rápido para ${game} con ${n} amigos. Monta el servidor hoy y si crece, migra a Oracle.`;
  $("#wResult").innerHTML=r;
};

// Generador
const GEN_FILES={Minecraft:"server.properties",Terraria:"serverconfig.txt",Valheim:"start_headless.sh","Stardew Valley":"nota.txt",Factorio:"server-settings.json"};
function genConfig(){
  const game=$("#gGame").value,name=$("#gName").value,pass=$("#gPass").value,pl=$("#gPlayers").value,diff=$("#gDiff").value,port=$("#gPort").value;
  $("#genFileName").textContent=GEN_FILES[game]||"config.txt";
  let out="";
  if(game==="Minecraft") out=`# Generado por ServerGratis Musu\nmotd=${name}\nmax-players=${pl}\nserver-port=${port}\ndifficulty=${diff.toLowerCase()}\nwhite-list=false`;
  else if(game==="Factorio") out=JSON.stringify({name,description:"Servidor creado con Musu",max_players:+pl,visibility:"public",game_password:pass},null,2);
  else out=`# ${game} — generado por Musu\nnombre="${name}"\ncontraseña="${pass||"(sin contraseña)"}"\nmax_jugadores=${pl}\ndificultad=${diff}\npuerto=${port}`;
  $("#genOut").textContent=out;
}
$("#genForm").onsubmit=e=>{e.preventDefault();genConfig();toast("Configuración generada ⚙️");};
$("#genCopy").onclick=()=>copyText($("#genOut").textContent);
$("#genDl").onclick=()=>{ const b=new Blob([$("#genOut").textContent],{type:"text/plain"}); const a=document.createElement("a"); a.href=URL.createObjectURL(b); a.download=$("#genFileName").textContent; a.click(); };

// --- Servidores públicos reales (estilo lista TerraForge): IP + estado en vivo ---
const PUB_SERVERS=[
 {name:"TerraForge",addr:"TerraForge.Aquatis.io",mode:"Survival · Towny · Lifesteal",desc:"Supervivencia con towns, economía de jugadores y crossplay Java+Bedrock.",icon:"🌍"},
 {name:"2b2t",addr:"2b2t.org",mode:"Anarquía",desc:"El servidor anárquico más famoso: sin reglas, mapa desde 2010.",icon:"⚔️"},
 {name:"Mineverso",addr:"mc.mineverso.com",mode:"Survival · SkyBlock",desc:"Red en español con Survival, SkyBlock y minijuegos.",icon:"🌟"},
 {name:"Librecraft",addr:"librecraft.com",mode:"Survival · No premium",desc:"Network clásica en español, admite cuentas no premium.",icon:"🔓"},
 {name:"CubeCraft",addr:"play.cubecraft.net",mode:"Minijuegos",desc:"Gigante de minijuegos: SkyWars, EggWars, BedWars y más.",icon:"🎮"},
];
let pubState=PUB_SERVERS.map(s=>({...s,checking:true,online:null,players:null,max:null,version:null,error:null}));
async function fetchPubStatus(p){
  try{
    const r=await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(p.addr)}`,{cache:"no-store"});
    if(!r.ok) throw new Error("API "+r.status);
    const d=await r.json();
    p.checking=false;
    if(d.online===true){ p.online=true; p.players=d.players?.online??null; p.max=d.players?.max??null; p.version=Array.isArray(d.version)?d.version.join(" / "):(d.version||null); }
    else { p.online=false; p.error="sin respuesta al ping ahora mismo"; }
  }catch(err){ p.checking=false; p.online=false; p.error="no se pudo comprobar ("+String(err.message||err).slice(0,50)+")"; }
  renderPub(false);
}
function renderPub(stamp=true){
  const l=$("#pubList"); if(!l) return;
  l.innerHTML=pubState.map(p=>`
    <div class="card"><div class="cover">${p.icon}</div><h3><span class="dot ${p.online===true?"on":p.online===false?"off":""}"></span>${esc(p.name)}</h3>
      <div class="meta"><span class="tag">${esc(p.mode)}</span><span class="tag">Java</span></div>
      <p class="muted small"><code>${esc(p.addr)}</code></p>
      <p class="muted small">${esc(p.desc)}</p>
      ${p.checking?`<p>⏳ Comprobando…</p>`:p.online===true?`<p>🟢 En línea · 👥 <strong>${p.players??"?"}</strong>${p.max!=null?" / "+p.max:""}${p.version?` · <span class="muted small">${esc(String(p.version).slice(0,40))}</span>`:""}</p>`:`<p>🔴 Offline${p.error?` — <span class="muted small">${esc(p.error)}</span>`:""}</p>`}
      <div class="card-actions"><button class="btn primary small" data-copy="${esc(p.addr)}">📋 Copiar IP</button>${/terraforge/i.test(p.addr)?`<a class="btn ghost small" href="terraforge.html">Ver ficha</a>`:""}</div>
    </div>`).join("");
  if(stamp){ const t=new Date(); $("#pubUpdated").textContent="Actualizado: "+t.toLocaleTimeString(); }
}
function refreshPub(){ pubState.forEach(p=>{p.checking=true;}); renderPub(false); pubState.forEach((p,i)=>setTimeout(()=>fetchPubStatus(p),i*700)); }

// Estado servidores — comprobación REAL para Minecraft Java (mcsrvstat.us).
// Otros juegos no exponen ping web desde el navegador: se guardan y se marcan manualmente.
let srvs=store.get("musu_srvs",null);
// Migración: el ejemplo antiguo (musu.playit.gg, aleatorio) siempre salía offline → sustituir por ejemplo real
if(!Array.isArray(srvs)||!srvs.length||srvs.some(s=>/musu\.playit\.gg|hypixel/i.test(s.addr||""))){
  srvs=[{name:"2b2t (ejemplo real)",addr:"2b2t.org",game:"Minecraft",online:null,players:null}];
  store.set("musu_srvs",srvs);
}
function parseAddr(a){ a=String(a||"").trim().replace(/\s+/g,""); const m=a.match(/^([^:]+)(?::(\d{1,5}))?$/); if(!m) return null; const port=m[2]?+m[2]:25565; if(port<1||port>65535) return null; return {host:m[1].toLowerCase(),port}; }
function renderSrvs(){
  const l=$("#srvList");
  l.innerHTML=srvs.map((s,i)=>{
    let status="";
    if(s.checking) status=`<p>⏳ Comprobando <code>${esc(s.addr)}</code>…</p>`;
    else if(s.online===true) status=`<p>🟢 En línea${s.players!=null?` · 👥 ${s.players}${s.max!=null?" / "+s.max:""} jugadores`:""}${s.version?` · <span class="muted small">${esc(s.version)}</span>`:""}</p>`;
    else if(s.online===false) status=`<p>🔴 Offline${s.error?` — <span class="muted small">${esc(s.error)}</span>`:""}</p><p class="muted small">¿Es tu servidor? Revisa: 1) PC/servidor encendido 2) puerto <code>${s.port||""}</code> abierto o túnel Playit activo 3) dirección con puerto (<code>xxx.playit.gg:1234</code>).</p>`;
    else status=`<p>⚪ Sin comprobar — pulsa <strong>Comprobar</strong>.</p>`;
    const isMc=/minecraft/i.test(s.game||"");
    return `<div class="card"><h3><span class="dot ${s.online===true?"on":s.online===false?"off":""}"></span>${esc(s.name)}</h3>
      <p class="muted small">${esc(s.game)} · <code>${esc(s.addr)}</code></p>${status}
      <div class="card-actions"><button class="btn small" data-check="${i}">🔄 Comprobar</button><button class="btn small" data-copy="${esc(s.addr)}">Copiar IP</button>${isMc?"":`<button class="btn ghost small" data-toggle="${i}">Marcar on/off</button>`}<button class="btn ghost small" data-del="${i}">Borrar</button></div>
      ${isMc?"":`<p class="muted small">Nota: solo Minecraft Java se comprueba automáticamente. Otros juegos se marcan a mano.</p>`}</div>`;
  }).join("")||"<p class='muted'>Sin servidores. Registra el tuyo arriba 👆</p>";
}
async function checkServer(i){
  const s=srvs[i]; if(!s) return;
  const p=parseAddr(s.addr);
  if(!p){ s.online=false; s.error="dirección inválida (usa host o host:puerto)"; store.set("musu_srvs",srvs); renderSrvs(); return; }
  s.host=p.host; s.port=p.port;
  if(!/minecraft/i.test(s.game||"")){ // sin API pública: validación de formato + toggle manual
    s.online=s.online===true?true:null; s.error=null; s.checking=false;
    store.set("musu_srvs",srvs); renderSrvs(); toast("Dirección válida — márcala on/off a mano");
    return;
  }
  s.checking=true; s.error=null; renderSrvs();
  try{
    const r=await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(s.addr.trim())}`,{cache:"no-store"});
    if(!r.ok) throw new Error("API "+r.status);
    const d=await r.json();
    s.checking=false;
    if(d.online===true){ s.online=true; s.players=d.players?.online??null; s.max=d.players?.max??null; s.version=d.version||d.protocol?.name||null; }
    else { s.online=false; s.players=null; s.error=d.debug?.error||"no responde al ping"; }
  }catch(err){ s.checking=false; s.online=false; s.error="sin conexión a la API ("+String(err.message||err).slice(0,60)+")"; }
  store.set("musu_srvs",srvs); renderSrvs();
}
function toggleServer(i){ const s=srvs[i]; if(!s) return; s.online=s.online===true?false:true; if(s.online){s.players=s.players??0;} store.set("musu_srvs",srvs); renderSrvs(); }
document.addEventListener("click",e=>{const d=e.target.closest("[data-del]"); if(d){srvs.splice(+d.dataset.del,1);store.set("musu_srvs",srvs);renderSrvs();}});
$("#srvForm").onsubmit=e=>{e.preventDefault();
  const entry={name:$("#sName").value.trim(),addr:$("#sAddr").value.trim(),game:$("#sGame").value.trim()||"Minecraft",online:null,players:null,checking:false};
  if(!parseAddr(entry.addr)){ toast("Dirección inválida — usa host o host:puerto"); return; }
  srvs.push(entry); store.set("musu_srvs",srvs); renderSrvs(); e.target.reset(); toast("Servidor registrado 📡 — comprobando…");
  checkServer(srvs.length-1);
};
$("#reportForm").onsubmit=e=>{e.preventDefault();$("#rOk").hidden=false;e.target.reset();};
$("#donate").onclick=e=>{e.preventDefault();toast("💚 ¡Gracias! Próximamente: Ko-fi / PayPal");};

$("#pubRefresh").onclick=()=>{ refreshPub(); toast("Actualizando estados 🔄"); };
renderGames(); renderPicker(); showGuide("minecraft"); renderSrvs(); genConfig(); renderPub(false); refreshPub();
// Auto-comprobar mis servidores Minecraft al cargar (sin bloquear la página)
srvs.forEach((s,i)=>{ if(/minecraft/i.test(s.game||"") && !s.checking) setTimeout(()=>checkServer(i), PUB_SERVERS.length*700+300); });
