const $=id=>document.getElementById(id);
let candidates=[],liveSignals=[],signalFilter="all";

const ALIASES={
 "figure":"Figure AI","figure ai":"Figure AI","physical intelligence":"Physical Intelligence",
 "skild ai":"Skild AI","sanctuary ai":"Sanctuary AI","sanctuary":"Sanctuary AI",
 "nvidia":"NVIDIA","google deepmind":"Google DeepMind","toyota":"Toyota","dexterity":"Dexterity",
 "covariant":"Covariant","robust.ai":"Robust.AI","robust ai":"Robust.AI","unitree":"Unitree Robotics",
 "unitree robotics":"Unitree Robotics","limx":"LimX Dynamics","limx dynamics":"LimX Dynamics",
 "genesis embodied ai":"Genesis Embodied AI","typesafe ai":"TypeSafe AI","fluxdyne":"Fluxdyne"
};
const KNOWN=new Set(Object.values(ALIASES).map(x=>x.toLowerCase()));
const NOISE=/^(physical|physical ai|embodied|embodied ai|robotics|robot|ai|artificial intelligence|machine learning|open source|github|workshop|simulator|tutorial|demo|project|making|agentic|learning|software engineer|ai researcher|intern|portfolio|research|engineering)$/i;

function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function norm(v){return String(v||"").replace(/[-_]+/g," ").replace(/\s+/g," ").trim();}
function ageDays(v){const t=new Date(v||0).getTime();return isFinite(t)?Math.max(0,(Date.now()-t)/86400000):9999;}
function canonical(v){
  const raw=norm(v), key=raw.toLowerCase();
  if(ALIASES[key]) return ALIASES[key];
  const n=raw.replace(/^the\s+/i,"");
  if(!n || n.length<3 || n.length>70 || NOISE.test(n)) return "";
  if(/^(?:[a-z]+\s+){0,2}(?:r&d|research|project|portfolio|workshop|simulator)$/i.test(n)) return "";
  return n;
}

function inferAssetProfile(asset,query){
  const text=(asset+" "+query).toLowerCase(), themes=[];
  if(/humanoid|embodied|robot/.test(text)) themes.push("Humanoid / Embodied AI");
  if(/behavior|planning|intelligence/.test(text)) themes.push("Robot intelligence layer");
  if(/manipulation|control/.test(text)) themes.push("Manipulation / control");
  if(/ui|interface/.test(text)) themes.push("Robot interface");
  if(/stack|platform/.test(text)) themes.push("Robotics platform");
  if(!themes.length) themes.push("Physical AI / robotics");
  const core=(asset||"").split(".")[0].replace(/[-_]+/g," ").trim();
  const concepts=core.split(/\s+/).filter(Boolean);
  return {name:asset||"Asset",core,themes:[...new Set(themes)],concepts};
}
function assetFitText(asset,query){
  const p=inferAssetProfile(asset,query);
  return p.themes.slice(0,3).join(" · ");
}
function renderAssetIntelligence(asset,query){
  const box=$("assetProfile"); if(!box)return;
  const p=inferAssetProfile(asset,query);
  box.innerHTML='<div class="asset-profile-grid"><div><span>ASSET</span><strong>'+esc(p.name)+'</strong></div><div><span>CORE CONCEPT</span><strong>'+esc(p.core||"—")+'</strong></div><div><span>MARKET LAYER</span><strong>'+esc(p.themes.join(" · "))+'</strong></div></div>'+
  '<div class="asset-themes">'+p.themes.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div>'+
  '<div class="asset-uses"><span class="intel-label">POTENTIAL JOBS FOR THIS ASSET</span><div><span>Product / platform name</span><span>Research property</span><span>Category authority</span><span>Launch / campaign property</span></div></div>'+
  '<small>The engine treats this as a positioning hypothesis. Buyer evidence must independently support the opportunity.</small>';
}

function signalType(s){
  const t=(s.title+" "+s.description).toLowerCase();
  if(/fund|raised|funding|investment|acqui|acquisition|partner|partnership|launch|launched|contract|customer|order|expands|expansion/.test(t))return"COMMERCIAL";
  if(/hire|hiring|job|recruit|joins|joined|team/.test(t))return"HIRING";
  if(/robot|robotics|humanoid|embodied|manipulation|reinforcement|simulation|foundation model|behavior|planning|autonomy/.test(t))return"TECHNICAL";
  return"MARKET";
}
function triggerFor(signals){
  const ranked=signals.slice().sort((a,b)=>{
    const weight=s=>({COMMERCIAL:5,HIRING:4,TECHNICAL:3,MARKET:1}[signalType(s)]||1);
    return weight(b)-weight(a) || new Date(b.publishedAt||0)-new Date(a.publishedAt||0);
  });
  const s=ranked[0];
  if(!s)return{label:"NO VERIFIED TRIGGER",strength:"NONE",signal:null,reason:"No source-backed event was detected."};
  const type=signalType(s);
  const label={COMMERCIAL:"COMMERCIAL EVENT",HIRING:"HIRING / TEAM EVENT",TECHNICAL:"TECHNICAL EVENT",MARKET:"MARKET EVENT"}[type];
  const strength=ageDays(s.publishedAt)<=30?"FRESH":ageDays(s.publishedAt)<=90?"RECENT":"OLDER";
  return{label,strength,signal:s,reason:s.title||s.description};
}
function roleMap(name,signals){
  const text=(name+" "+signals.map(s=>s.title+" "+s.description).join(" ")).toLowerCase();
  if(/robot|humanoid|embodied|manipulation/.test(text))return["Founder / CEO","Head of Robotics / AI","Product / Partnerships"];
  if(/platform|software|api|developer/.test(text))return["Founder / CEO","VP Product","Developer / Partnerships"];
  return["Founder / CEO","Product leadership","Business Development / Partnerships"];
}
function resolveEntities(sig){
  const out=[],push=x=>{x=canonical(x);if(x&&!out.some(y=>y.toLowerCase()===x.toLowerCase()))out.push(x);};
  const title=String(sig.title||""),desc=String(sig.description||"");
  let m;
  const launch=/Launch HN:\s*([^–-]+?)(?:\s*\(|\s*[–-]|$)/i.exec(title);if(launch)push(launch[1]);
  const patterns=[
    /\b([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,4}),?\s+(?:Inc\.?|Corp\.?|Corporation|Company|Robotics|AI|Labs?|Dynamics|Technologies)\b/g,
    /\b([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,4})\s+(?:is|was|builds|develops|makes|creates|founded|launches|announces|raises|partners)\b/g
  ];
  for(const re of patterns)while((m=re.exec(desc)))push(m[1]);
  if(sig.ownerType==="Organization"&&sig.ownerLogin&&ALIASES[sig.ownerLogin.toLowerCase()])push(sig.ownerLogin);
  if(sig.sourceType==="hackernews"){
    const hn=/\b([A-Z][A-Za-z0-9&.\-]{2,40})\s+(?:launches?|announces?|builds?|develops?|raises?|partners?|hires?|opens?)\b/i.exec(title);
    if(hn)push(hn[1]);
  }
  const full=title+" "+desc;
  const known=/\b(Figure AI|Physical Intelligence|Skild AI|Sanctuary AI|NVIDIA|Google DeepMind|Toyota|Dexterity|Covariant|Robust\.AI|LimX Dynamics|Genesis Embodied AI|Unitree Robotics|TypeSafe AI|Fluxdyne)\b/gi;
  while((m=known.exec(full)))push(m[1]);
  return out;
}
function verify(name,sig){
  const text=(name+" "+sig.title+" "+sig.description).toLowerCase();
  const known=KNOWN.has(name.toLowerCase());
  const commercial=/\b(company|inc\.?|corp\.?|corporation|startup|founded|funded|funding|enterprise|product|platform|commercial|robotics company|ai company)\b/i.test(text);
  const identity=/\b(?:is|was|builds|develops|makes|creates|founded)\s+(?:a|an)?\s*(?:company|startup|platform|business)\b/i.test(sig.description||"");
  const shape=/\b(robotics|robot|ai|labs?|dynamics|technologies|systems|automation|industrial)\b/i.test(name);
  const project=/\b(portfolio|student|internship|course|tutorial|workshop|assignment|simulator|demo|personal)\b/i.test(text);
  return !project&&!NOISE.test(name)&&(known||commercial||identity||(sig.sourceType==="github"&&sig.ownerType==="Organization"&&shape));
}
function relevance(name,signals,asset,query){
  const text=(name+" "+signals.map(s=>s.title+" "+s.description).join(" ")).toLowerCase();
  const terms=["robot","robotics","humanoid","embodied","physical ai","robot learning","manipulation","autonomy","simulation","reinforcement","foundation model","intelligence","behavior","planning"];
  const hits=terms.filter(t=>text.includes(t)).length;
  const assetTerms=(asset+" "+query).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>3);
  const assetHits=[...new Set(assetTerms)].filter(t=>text.includes(t)).length;
  return hits+Math.min(4,assetHits);
}
function buildCandidates(asset,query){
  const groups={};
  for(const sig of liveSignals)for(const raw of resolveEntities(sig)){
    const name=canonical(raw);if(!name||!verify(name,sig))continue;
    const key=name.toLowerCase();if(!groups[key])groups[key]={name,signals:[]};
    if(!groups[key].signals.includes(sig))groups[key].signals.push(sig);
  }
  return Object.values(groups).map(g=>{
    const rel=relevance(g.name,g.signals,asset,query),recent=g.signals.filter(s=>ageDays(s.publishedAt)<=90).length;
    const commercial=g.signals.filter(s=>signalType(s)==="COMMERCIAL").length;
    const trigger=triggerFor(g.signals);
    const evidence=g.signals.length;
    const fit=Math.min(100,Math.round(30+rel*5+recent*7+commercial*10+Math.min(15,evidence*3)));
    return {name:g.name,signals:g.signals,relevance:rel,recent,commercial,evidence,trigger,roles:roleMap(g.name,g.signals),priority:fit};
  }).sort((a,b)=>b.priority-a.priority);
}

function renderMetrics(){
  const fresh=liveSignals.filter(s=>ageDays(s.publishedAt)<=30).length;
  const triggers=candidates.filter(x=>x.trigger.strength!=="NONE"&&x.trigger.strength!=="OLDER").length;
  const queue=candidates.filter(x=>x.priority>=60).length;
  $("metrics").innerHTML=[
    ["ACTIONABLE OPPORTUNITIES",queue],["FRESH SIGNALS ≤30D",fresh],["TRIGGERS DETECTED",triggers],["EVIDENCE ITEMS",liveSignals.length]
  ].map(x=>'<div class="metric"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join("");
}
function renderActionQueue(asset){
  const box=$("actionQueue");
  if(!candidates.length){box.innerHTML='<div class="empty">No verified commercial opportunities yet. Broaden the market query or use a more specific asset.</div>';return;}
  box.innerHTML=candidates.slice(0,8).map((x,i)=>{
    const t=x.trigger,s=t.signal, freshness=t.strength==="FRESH"?"CONTACT WINDOW":t.strength==="RECENT"?"RECENT":"RESEARCH";
    const why=x.relevance>=5?"Direct thematic overlap is supported by the collected evidence.":"Relevant overlap is present but needs stronger verification.";
    const next=s?"Verify the event, then identify a public decision-maker channel.":"Find a current company source before outreach.";
    return '<article class="opportunity-card"><div class="opp-head"><div><span class="rank">OPPORTUNITY '+String(i+1).padStart(2,"0")+'</span><h3>'+esc(x.name)+'</h3></div><span class="opportunity-state '+freshness.toLowerCase().replace(/ /g,"-")+'">'+freshness+'</span></div>'+
    '<div class="opp-grid"><div><span>WHY THIS ASSET</span><strong>'+esc(assetFitText(asset,$("query").value))+'</strong></div><div><span>WHY NOW</span><strong>'+esc(t.label)+' · '+esc(t.strength)+'</strong></div><div><span>TARGET ROLES</span><strong>'+esc(x.roles.join(" · "))+'</strong></div></div>'+
    '<p><b>Evidence interpretation:</b> '+esc(why)+'</p><p><b>Next action:</b> '+esc(next)+'</p>'+
    (s?'<a class="signal-link" href="'+esc(s.source)+'" target="_blank" rel="noopener">OPEN TRIGGER EVIDENCE ↗</a>':'')+'</article>';
  }).join("");
}
function renderTriggers(){
  const box=$("triggerGrid");
  const rows=candidates.filter(x=>x.trigger.signal).slice(0,8);
  box.innerHTML=rows.map(x=>{const s=x.trigger.signal;return '<article class="trigger-card"><div class="trigger-top"><span>'+esc(x.name)+'</span><b>'+esc(x.trigger.label)+'</b></div><h3>'+esc(s.title)+'</h3><p>'+esc(s.description)+'</p><div class="trigger-foot"><span>'+esc(x.trigger.strength)+'</span><a href="'+esc(s.source)+'" target="_blank" rel="noopener">SOURCE ↗</a></div></article>';}).join("")||'<div class="empty">No event-backed triggers detected.</div>';
}
function renderSignals(){
  const visible=signalFilter==="all"?liveSignals:liveSignals.filter(x=>x.sourceType===signalFilter);
  $("signalsGrid").innerHTML=visible.map(x=>'<article class="signal-card"><div class="signal-meta"><span>'+esc(x.sourceTypeLabel)+'</span><span>'+esc(x.dateLabel)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><p><b>Resolved entity:</b> '+esc(x.entity||"Unattributed")+'</p><div class="signal-type">'+esc(signalType(x))+'</div><a class="signal-link" href="'+esc(x.source)+'" target="_blank" rel="noopener">'+esc(x.sourceLabel)+' ↗</a></article>').join("")||'<div class="empty">No live evidence for this filter.</div>';
}
function renderCompanyIntelligence(asset){
  const box=$("companyCards");
  box.innerHTML=candidates.slice(0,6).map(x=>{
    const ev=x.signals.slice().sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0)).slice(0,5);
    const ledger=ev.map(s=>'<li><span class="evidence-tag '+signalType(s).toLowerCase()+'">'+signalType(s)+'</span>'+esc(s.title)+' <a href="'+esc(s.source)+'" target="_blank" rel="noopener">↗</a></li>').join("");
    return '<article class="candidate intelligence-card"><div class="candidate-top"><span class="rank">BUYER RESEARCH</span><span class="score">'+x.priority+'/100</span></div>'+
    '<div class="intel-title"><h3>'+esc(x.name)+'</h3><span class="intel-level '+(x.trigger.strength==="FRESH"?"high":x.trigger.strength==="RECENT"?"medium":"early")+'">'+esc(x.trigger.strength)+' SIGNAL</span></div>'+
    '<div class="intel-grid"><div><span>EVIDENCE</span><strong>'+x.evidence+' items</strong></div><div><span>RECENT</span><strong>'+x.recent+' / 90d</strong></div><div><span>COMMERCIAL</span><strong>'+x.commercial+'</strong></div><div><span>RELEVANCE</span><strong>'+x.relevance+' hits</strong></div></div>'+
    '<div class="intel-columns"><div><span class="intel-label">EVIDENCE LEDGER</span><ul>'+ledger+'</ul></div><div><span class="intel-label">VERIFY BEFORE CONTACT</span><p>Confirm current company activity, the trigger, the product/team affected, and a public decision-maker channel.</p><p><b>Roles:</b> '+esc(x.roles.join(" · "))+'</p><small>The engine identifies research opportunities, not purchase intent.</small></div></div></article>';
  }).join("")||'<div class="empty">No buyer research cards yet.</div>';
}
function renderOutreach(asset){
  const box=$("outreachIntel"),x=candidates[0];
  if(!x){box.textContent="No verified opportunity yet.";return;}
  const s=x.trigger.signal||x.signals[0],hook=s?.title||"the activity detected in the market";
  box.innerHTML='<div class="outreach-grid"><div><span>COMPANY</span><strong>'+esc(x.name)+'</strong></div><div><span>OPENING HOOK</span><strong>'+esc(hook)+'</strong></div><div><span>DECISION-MAKER</span><strong>'+esc(x.roles[0])+'</strong></div></div>'+
  '<div class="outreach-draft"><span class="intel-label">RESEARCH-READY OPENING</span><p>“I noticed '+esc(x.name)+' is currently active around '+esc(hook)+'. I own '+esc(asset)+', a domain closely aligned with '+esc(assetFitText(asset,$("query").value))+'. Given the direction of the work, I thought it was worth putting the asset on your radar.”</p><small>Use only after verifying the source, current activity and recipient. This is an opening angle, not an inferred buying signal.</small></div>';
}
function renderBrief(asset){
  const x=candidates[0],box=$("buyerBrief");
  if(!x){box.textContent="No sufficiently verified opportunity was discovered from the current live evidence.";return;}
  const s=x.trigger.signal;
  box.innerHTML='<div class="brief-grid"><div><span>ASSET</span><strong>'+esc(asset)+'</strong></div><div><span>COMPANY</span><strong>'+esc(x.name)+'</strong></div><div><span>TRIGGER</span><strong>'+esc(x.trigger.label)+'</strong></div><div><span>NEXT ROLE</span><strong>'+esc(x.roles[0])+'</strong></div></div>'+
  '<p><b>Why it surfaced:</b> '+esc(assetFitText(asset,$("query").value))+' overlaps with '+esc(x.name)+' and the collected public evidence.</p>'+
  '<p><b>Why now:</b> '+esc(x.trigger.reason)+'</p>'+
  '<p><b>Evidence:</b> '+(s?'<a class="signal-link" href="'+esc(s.source)+'" target="_blank" rel="noopener">'+esc(s.sourceLabel)+' source ↗</a>':"No current trigger.")+'</p>'+
  '<p><b>Human action:</b> verify the event → identify the relevant role → check current company positioning → personalize outreach.</p>';
}

async function getJSON(url){
  const r=await fetch(url,{headers:{"Accept":"application/json"}});
  if(!r.ok)throw new Error(r.status+" "+r.statusText);
  return r.json();
}
function dedupe(items){
  const seen=new Set();return items.filter(x=>{const k=(x.sourceType+"|"+x.source+"|"+x.title).toLowerCase();if(seen.has(k))return false;seen.add(k);return true;});
}
function githubQuery(q){
  return getJSON("https://api.github.com/search/repositories?q="+encodeURIComponent(q)+"&sort=updated&order=desc&per_page=10")
  .then(d=>(d.items||[]).map(r=>({sourceType:"github",sourceTypeLabel:"GITHUB",source:r.html_url,sourceLabel:"GitHub",dateLabel:r.updated_at?new Date(r.updated_at).toLocaleDateString():"recent",publishedAt:r.updated_at,title:r.full_name,description:r.description||"Public repository activity.",ownerLogin:r.owner?.login||"",ownerType:r.owner?.type||""})));
}
function hnQuery(q){
  return getJSON("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(q)+"&tags=story&hitsPerPage=10")
  .then(d=>(d.hits||[]).map(h=>({sourceType:"hackernews",sourceTypeLabel:"HACKER NEWS",source:h.url||("https://news.ycombinator.com/item?id="+h.objectID),sourceLabel:"Hacker News",dateLabel:h.created_at?new Date(h.created_at).toLocaleDateString():"recent",publishedAt:h.created_at,title:h.title||"Untitled story",description:h.title||"Public discussion signal."})));
}
async function runLive(){
  const asset=$("asset").value.trim(),query=$("query").value.trim();
  if(!asset){$("status").textContent="ENTER AN ASSET FIRST";return;}
  $("status").textContent="SCANNING · DISCOVERING…";
  liveSignals=[];candidates=[];renderMetrics();renderActionQueue(asset);renderTriggers();renderSignals();
  const base=query||asset, terms=[base,asset.replace(/\.[a-z0-9]+$/i,"").replace(/[._-]/g," "),base+" humanoid",base+" embodied AI",base+" robot behavior",base+" robotics company"];
  const urls=[...new Set(terms.map(x=>x.trim()).filter(Boolean))];
  const jobs=[];
  for(const q of urls){jobs.push(githubQuery(q));jobs.push(hnQuery(q));}
  const results=await Promise.allSettled(jobs);
  for(const r of results)if(r.status==="fulfilled")liveSignals.push(...r.value);
  liveSignals=dedupe(liveSignals).filter(s=>ageDays(s.publishedAt)<=730).sort((a,b)=>new Date(b.publishedAt||0)-new Date(a.publishedAt||0)).slice(0,80);
  for(const s of liveSignals)s.entity=resolveEntities(s)[0]||"Unattributed public signal";
  candidates=buildCandidates(asset,query);
  renderAssetIntelligence(asset,query);renderMetrics();renderActionQueue(asset);renderTriggers();renderSignals();renderCompanyIntelligence(asset);renderOutreach(asset);renderBrief(asset);
  $("status").textContent="SCAN COMPLETE · "+liveSignals.length+" EVIDENCE ITEMS · "+candidates.length+" VERIFIED ENTITIES";
}
function init(){
  $("run")?.addEventListener("click",()=>runLive().catch(e=>{$("status").textContent="SCAN ERROR · "+e.message;console.error(e);}));
  document.querySelectorAll("#signalFilters button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#signalFilters button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");signalFilter=btn.dataset.signalFilter;renderSignals();}));
  renderAssetIntelligence($("asset")?.value||"",$("query")?.value||"");renderMetrics();renderActionQueue("");renderTriggers();renderSignals();renderCompanyIntelligence("");renderOutreach("");renderBrief("");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();