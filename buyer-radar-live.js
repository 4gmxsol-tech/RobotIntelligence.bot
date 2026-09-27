const $=id=>document.getElementById(id);
let candidates=[],liveSignals=[],signalFilter="all";

function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function normalizeName(name){
  return String(name||"").replace(/[-_]+/g," ").replace(/\.(ai|com|io|co|org)$/i,"").replace(/\s+/g," ").trim();
}
function renderMetrics(){
  const avg=candidates.length?Math.round(candidates.reduce((s,x)=>s+x.score,0)/candidates.length):0;
  const providers=new Set(liveSignals.map(x=>x.sourceType)).size;
  $("metrics").innerHTML=[
    ["BUYER CANDIDATES",candidates.length],["LIVE SIGNALS",liveSignals.length],
    ["AVG BUYER FIT",avg+"/100"],["LIVE SOURCES",providers]
  ].map(x=>'<div class="metric"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join("");
}
function factor(label,value,max){
  return '<div class="factor"><div class="factor-head"><span>'+label+'</span><b>'+value+'/'+max+'</b></div><div class="bar"><i style="width:'+Math.round(value/max*100)+'%"></i></div></div>';
}
function renderCandidates(){
  $("candidates").innerHTML=candidates.map((x,i)=>'<article class="candidate"><div class="candidate-top"><span class="rank">DISCOVERED CANDIDATE '+String(i+1).padStart(2,"0")+'</span><span class="score">'+x.score+'/100</span></div><h3>'+esc(x.name)+'</h3><p>'+esc(x.reason)+'</p>'+
    factor("BUYER RELEVANCE",x.profile.buyerRelevance,25)+factor("ASSET FIT",x.profile.assetFit,30)+factor("RECENT ACTIVITY",x.profile.recentActivity,20)+factor("EVIDENCE STRENGTH",x.profile.evidenceStrength,15)+factor("COMMERCIAL PROXIMITY",x.profile.commercialProximity,10)+
    '<div class="candidate-foot">'+x.liveEvidence+' live signal(s) support this entity.<br><small>Discovered from public evidence; not purchase-intent evidence.</small></div></article>').join("")||
    '<div class="empty">No commercial entities discovered yet. Try a narrower research query.</div>';
}
function renderSignals(){
  const visible=signalFilter==="all"?liveSignals:liveSignals.filter(x=>x.sourceType===signalFilter);
  $("signalsGrid").innerHTML=visible.map(x=>'<article class="signal-card"><div class="signal-meta"><span>'+esc(x.sourceTypeLabel)+'</span><span>'+esc(x.dateLabel)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><p><b>Entity:</b> '+esc(x.entity||"Unattributed public signal")+'</p><a class="signal-link" href="'+esc(x.source)+'" target="_blank" rel="noopener">'+esc(x.sourceLabel)+' ↗</a></article>').join("")||
    '<div class="empty">No live signals for this source filter.</div>';
}
function generateBrief(asset){
  const top=candidates[0];
  $("buyerBrief").innerHTML=top?
    '<div class="brief-grid"><div><span>ASSET</span><strong>'+esc(asset)+'</strong></div><div><span>TOP DISCOVERED ENTITY</span><strong>'+esc(top.name)+'</strong></div><div><span>BUYER FIT</span><strong>'+top.score+'/100</strong></div><div><span>LIVE EVIDENCE</span><strong>'+top.liveEvidence+' signals</strong></div></div><p><b>Why surfaced:</b> '+esc(top.reason)+'</p><p><b>Evidence:</b> '+esc(top.signal)+'</p><p><b>Next:</b> Verify the entity as a commercial organization, identify the relevant decision-maker and validate current strategic activity.</p><small>Scores are discovery/research heuristics, not purchase probability.</small>':
    "No sufficiently verified commercial entity was discovered from the current live evidence.";
}

const GENERIC_ENTITY_NOISE=/^(physical|physical ai|embodied|embodied ai|robotics|robot|ai|artificial intelligence|machine learning|robot intelligence|open source|github|workshop|simulator|tutorial|demo|project|making|agentic|learning|remove|find|will open r&d|software engineer|ai researcher|intern|portfolio)$/i;
const KNOWN_ALIASES={
  "figure":"Figure AI","figure ai":"Figure AI",
  "genesis embodied ai":"Genesis Embodied AI",
  "limx dynamics":"LimX Dynamics","limxdynamics":"LimX Dynamics",
  "physical intelligence":"Physical Intelligence","skild ai":"Skild AI",
  "sanctuary":"Sanctuary AI","sanctuary ai":"Sanctuary AI",
  "nvidia":"NVIDIA","google deepmind":"Google DeepMind",
  "toyota":"Toyota",
  "robust.ai":"Robust.AI","robust ai":"Robust.AI",
  "covariant":"Covariant","covariant ai":"Covariant"
};
const KNOWN_COMPANIES=new Set(Object.values(KNOWN_ALIASES).map(x=>x.toLowerCase()));
const VERB_NOISE=/^(physical|remove|find|making|learning|agentic|will|open|build|develop|creates?|makes?|founded|official|software|technical|research|engineer)$/i;

function canonicalEntity(name){
  let n=normalizeName(name).replace(/^the\s+/i,"").trim();
  const key=n.toLowerCase();
  if(KNOWN_ALIASES[key]) return KNOWN_ALIASES[key];
  if(GENERIC_ENTITY_NOISE.test(n)) return "";
  if(VERB_NOISE.test(n)) return "";
  if(/^(?:[a-z]+\s+){0,2}(?:r&d|research|project|portfolio|workshop|simulator)$/i.test(n)) return "";
  return n;
}
function extractEntities(signal){
  if(typeof signal==="string") signal={title:signal,description:""};
  const title=String(signal?.title||""), desc=String(signal?.description||"");
  const found=[], push=n=>{
    n=canonicalEntity(n);
    if(n&&n.length>=3&&n.length<=60&&!found.some(x=>x.toLowerCase()===n.toLowerCase())) found.push(n);
  };
  let m;
  const launch=/Launch HN:\s*([^–-]+?)(?:\s*\(|\s*[–-]|$)/i.exec(title);
  if(launch) push(launch[1]);
  const explicitPatterns=[
    /\b([A-Z][A-Za-z0-9&.]+(?:\s+[A-Z][A-Za-z0-9&.]+){0,4}),?\s+(?:Inc\.?|Corp\.?|Corporation|Company|Robotics|AI|Labs?|Dynamics)\b/g,
    /\b([A-Z][A-Za-z0-9&.]+(?:\s+[A-Z][A-Za-z0-9&.]+){0,4})\s+(?:is|was|builds|develops|makes|creates|founded)\b/g
  ];
  for(const re of explicitPatterns) while((m=re.exec(desc))) push(m[1]);
  const sentenceCompany=/^\s*([A-Z][A-Za-z0-9&.\-]{2,50})\s+(?:is|was|builds|develops|makes|creates)\b/m.exec(desc);
  if(sentenceCompany) push(sentenceCompany[1]);
  // A GitHub owner is an account/container, not automatically the commercial entity.
  // Only curated/verified aliases may enter from ownerLogin.
  if(signal.ownerType==="Organization" && signal.ownerLogin){
    const ownerKey=signal.ownerLogin.toLowerCase();
    if(KNOWN_ALIASES[ownerKey]) push(signal.ownerLogin);
  }
  // Hacker News: resolve company names explicitly stated in story headlines.
  if(signal.sourceType==="hackernews"){
    const hnPatterns=[
      /(?:company|startup|firm)\s+([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,3})/i,
      /\b([A-Z][A-Za-z0-9&.\-]{2,30})\s+(?:launches?|launch|announces?|announced|builds?|develops?|raises?|partners?|hires?|opens?)\b/i
    ];
    for(const re of hnPatterns){ const hm=re.exec(title); if(hm) push(hm[1]); }
  }
  const full=title+" "+desc;
  const known=/\b(Generalist AI|THEKER Robotics|Rhoda AI|Eka Robotics|Cobalt Robotics|Physical Intelligence|Figure AI|Skild AI|NVIDIA|Google DeepMind|Salem Robotics|LimX Dynamics|Beyond Imagination|Sanctuary AI|Mireye|Azalea Robotics|Genesis Embodied AI|PhysiCar|Toyota|Robust\.AI|Robust AI|Covariant)\b/gi;
  while((m=known.exec(full))) push(m[1]);
  return found;
}
function verifyEntity(name,sig){
  const rawName=String(name||"").trim();
  const text=(rawName+" "+(sig.title||"")+" "+(sig.description||"")).toLowerCase();
  const known=KNOWN_COMPANIES.has(rawName.toLowerCase());
  const org=sig.ownerType==="Organization";
  const explicitCommercial=/\b(company|inc\.?|corp\.?|corporation|startup|founded|funded|funding|enterprise|product|platform|official home|commercial|robotics company|ai company)\b/i.test(text);
  const explicitIdentity=/\b(?:is|was|builds|develops|makes|creates|founded)\s+(?:a|an)?\s*(?:company|startup|platform|business)\b/i.test(sig.description||"");
  const companyShape=/\b(?:robotics|robot|ai|labs?|dynamics|technologies|technology|systems|automation|inc\.?|corp\.?|corporation|company|industrial)\b/i.test(rawName);
  const contaminated=/\bapi evangelist\b|[.:].*\b(?:dexterity|viam|valgo|uncovr)\b/i.test(rawName);
  const project=/\b(portfolio|student|internship|course|tutorial|workshop|assignment|simulator|demo|final project|personal)\b/i.test(text);
  const githubGate=sig.sourceType==="github"
    ? (known || (!contaminated && ((companyShape && explicitCommercial) || explicitIdentity)))
    : (known || explicitCommercial || explicitIdentity);
  const noise=GENERIC_ENTITY_NOISE.test(rawName)||VERB_NOISE.test(rawName);
  return {verified:!noise&&!project&&githubGate,known,org,explicitCommercial,explicitIdentity,companyShape,project};
}
function relevanceScore(asset,query,name,evidence){
  // Measure topical evidence from the signal itself. Asset/query terms must not
  // manufacture relevance for an otherwise generic repository description.
  const text=(name+" "+evidence).toLowerCase();
  const terms=["robot","robotics","humanoid","embodied","physical ai","robot learning","manipulation","autonomy","simulation","reinforcement learning","foundation model","intelligence","behavior"];
  return terms.filter(t=>text.includes(t)).length;
}
function gatedKnownEntity(name){ return KNOWN_COMPANIES.has(String(name||"").toLowerCase()); }
function buildCandidates(asset,query){
  const groups={};
  for(const sig of liveSignals){
    for(const raw of extractEntities(sig)){
      const name=canonicalEntity(raw), v=verifyEntity(name,sig);
      if(!v.verified) continue;
      const evidence=(sig.title||"")+" "+(sig.description||"");
      const relevance=relevanceScore(asset,query,name,evidence);
      if(relevance<2 && !gatedKnownEntity(name)) continue;
      const key=name.toLowerCase();
      if(!groups[key]) groups[key]={name,signals:[],verification:v,relevance:0};
      groups[key].signals.push(sig);
      groups[key].relevance=Math.max(groups[key].relevance,relevance);
    }
  }
  return Object.values(groups).map(g=>{
    const recent=g.signals.filter(s=>{
      const age=(Date.now()-new Date(s.publishedAt||0).getTime())/86400000;
      return isFinite(age)&&age>=0&&age<=180;
    }).length;
    const profile={
      buyerRelevance:Math.min(25,8+g.relevance*2),
      assetFit:Math.min(30,8+g.relevance*2),
      recentActivity:Math.min(20,7+recent*4),
      evidenceStrength:Math.min(15,5+g.signals.length*3),
      commercialProximity:g.verification.known?10:(g.verification.org?8:7)
    };
    return {name:g.name,score:Object.values(profile).reduce((a,v)=>a+v,0),profile,
      reason:g.verification.known?"Verified commercial entity with direct topical evidence.":"Verified organization with commercially relevant evidence.",
      signal:g.signals[0].title,liveEvidence:g.signals.length,confidence:g.verification.known?.95:(g.verification.org?.82:.72)};
  }).sort((a,b)=>b.score-a.score);
}
async function getJSON(url){
  const r=await fetch(url,{headers:{"Accept":"application/json"}});
  if(!r.ok) throw new Error(r.status+" "+r.statusText);
  return r.json();
}
async function fetchTechCrunch(query){
  const feeds=[
    "https://techcrunch.com/category/robotics/feed/",
    "https://techcrunch.com/category/artificial-intelligence/feed/"
  ];
  const results=[];
  for(const url of feeds){
    try{
      const xml=await getText(url);
      const doc=new DOMParser().parseFromString(xml,"text/xml");
      [...doc.querySelectorAll("item")].forEach(item=>{
        const title=item.querySelector("title")?.textContent?.trim()||"";
        const link=item.querySelector("link")?.textContent?.trim()||"";
        const pub=item.querySelector("pubDate")?.textContent?.trim()||"";
        const desc=item.querySelector("description")?.textContent?.replace(/<[^>]+>/g," ").trim()||"";
        if(title && new RegExp((query||"AI").split(/\s+/).filter(Boolean).join("|"),"i").test(title+" "+desc))
          results.push({sourceType:"techcrunch",sourceTypeLabel:"TECHCRUNCH",source:link,sourceLabel:"TechCrunch",dateLabel:pub?new Date(pub).toLocaleDateString():"recent",publishedAt:pub||null,title,description:desc,entity:""});
      });
    }catch(e){}
  }
  return results.slice(0,12);
}
async function getText(url){
  const r=await fetch(url,{headers:{"Accept":"application/rss+xml, application/xml, text/xml"}});
  if(!r.ok) throw new Error(r.status+" "+r.statusText);
  return r.text();
}
async function runLive(){
  const asset=$("asset").value.trim(),query=$("query").value.trim();
  if(!asset){$("status").textContent="ENTER AN ASSET FIRST";return;}
  $("status").textContent="LIVE RADAR · DISCOVERING…";
  liveSignals=[]; candidates=[]; renderMetrics(); renderCandidates(); renderSignals();
  const q=(query||asset).trim();
  const ghQueries=[
    q+" robotics AI",
    q+" humanoid embodied robotics",
    q+" robot learning physical AI"
  ];
  const gh=Promise.all(ghQueries.map(searchQuery=>
    getJSON("https://api.github.com/search/repositories?q="+encodeURIComponent(searchQuery)+"&sort=updated&order=desc&per_page=10")
      .then(d=>(d.items||[]).map(repo=>({sourceType:"github",sourceTypeLabel:"GITHUB SIGNAL",source:repo.html_url,sourceLabel:"GitHub",
        dateLabel:repo.updated_at?new Date(repo.updated_at).toLocaleDateString():"recent",publishedAt:repo.updated_at||null,title:repo.full_name,description:repo.description||"Public repository activity matching the research query.",
        ownerLogin:repo.owner?.login||"",ownerType:repo.owner?.type||"",entity:""})))
  )).then(parts=>{
    const seen=new Set();
    return parts.flat().filter(x=>{if(seen.has(x.source))return false;seen.add(x.source);return true;}).slice(0,15);
  });
  const hnQueries=[q+" robotics",q+" embodied AI",q+" robot learning"];
  const hn=Promise.all(hnQueries.map(searchQuery=>
    getJSON("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(searchQuery)+"&tags=story&hitsPerPage=10")
      .then(d=>(d.hits||[]).map(hit=>({sourceType:"hackernews",sourceTypeLabel:"HACKER NEWS",source:hit.url||("https://news.ycombinator.com/item?id="+hit.objectID),
        sourceLabel:"Hacker News",dateLabel:hit.created_at?new Date(hit.created_at).toLocaleDateString():"recent",publishedAt:hit.created_at||null,title:hit.title||"Hacker News signal",
        description:hit.title||"Recent public discussion/news signal.",entity:""})))
  )).then(parts=>{
    const seen=new Set();
    return parts.flat().filter(x=>{if(seen.has(x.source))return false;seen.add(x.source);return true;}).slice(0,15);
  });
  const tc=fetchTechCrunch(q);
  const results=await Promise.allSettled([gh,hn,tc]);
  let providers=0;
  for(const r of results) if(r.status==="fulfilled"){providers++;liveSignals.push(...r.value);}
  const seenSignals=new Set();
  liveSignals=liveSignals.filter(s=>{const k=s.source+"|"+s.title;if(seenSignals.has(k))return false;seenSignals.add(k);return true;}).slice(0,40);
  for(const sig of liveSignals) sig.entity=extractEntities(sig)[0]||"Unattributed public signal";
  candidates=buildCandidates(asset,query);
  renderMetrics();renderCandidates();renderSignals();generateBrief();
  $("status").textContent="LIVE RADAR · "+providers+"/3 SOURCES · "+liveSignals.length+" SIGNALS · "+candidates.length+" ENTITIES";
}

