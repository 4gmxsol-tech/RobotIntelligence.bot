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

const genericNoise=/^(embodied ai|physical ai|robotics|humanoid|robot|ai|artificial intelligence|machine learning|robot intelligence|open source|github|workshop|simulator|tutorial|demo|project|making|agentic|learning)$/i;
const knownNames=/\\b(Generalist AI|THEKER Robotics|Rhoda AI|Eka Robotics|Cobalt Robotics|Physical Intelligence|Figure AI|Skild AI|NVIDIA|Google DeepMind|Salem Robotics|LimX Dynamics|Beyond Imagination|Sanctuary AI|Mireye|Azalea Robotics|Genesis Embodied AI|PhysiCar)\\b/gi;

function extractEntities(signal){
  if(typeof signal==="string") signal={title:signal,description:""};
  const title=String(signal?.title||"");
  const desc=String(signal?.description||"");
  const found=[], push=n=>{
    n=normalizeName(n);
    if(n&&n.length>=3&&n.length<=60&&!genericNoise.test(n)&&!/^\\d/.test(n)&&!found.some(x=>x.toLowerCase()===n.toLowerCase())) found.push(n);
  };
  let m;
  const launch=/Launch HN:\\s*([^–-]+?)(?:\\s*\\(|\\s*[–-]|$)/i.exec(title);
  if(launch) push(launch[1]);
  const patterns=[
    /\\b([A-Z][A-Za-z0-9&.]+(?:\\s+[A-Z][A-Za-z0-9&.]+){0,4}),?\\s+(?:Inc\\.?|Corp\\.?|Corporation|Company|Robotics|AI|Labs?|Dynamics)\\b/g,
    /\\b([A-Z][A-Za-z0-9&.]+(?:\\s+[A-Z][A-Za-z0-9&.]+){0,4})\\s+(?:is|was|builds|develops|makes|creates|founded)\\b/g
  ];
  for(const re of patterns) while((m=re.exec(desc))) push(m[1]);
  // A GitHub organization is only a candidate signal when its repository description is commercially explicit.
  if(signal.ownerType==="Organization" && signal.ownerLogin && /\\b(company|startup|founded|funding|product|platform|enterprise|official|robotics|ai company|inc\\.?|corp\\.?)\\b/i.test(desc)) push(signal.ownerLogin);
  knownNames.lastIndex=0;
  while((m=knownNames.exec(title+" "+desc))) push(m[1]);
  knownNames.lastIndex=0;
  return found;
}

function entityVerification(name,sig){
  const text=(name+" "+(sig.title||"")+" "+(sig.description||"")).toLowerCase();
  const explicit=/(company|inc\\.?|corp\\.?|corporation|startup|founded|funded|funding|enterprise|product|platform|official home|builds robots|robotics company|ai company|commercial)/i.test(text);
  const org=sig.ownerType==="Organization";
  const known=/^(Genesis Embodied AI|Physical Intelligence|Figure AI|Skild AI|NVIDIA|Google DeepMind|Generalist AI|THEKER Robotics|Rhoda AI|Eka Robotics|Cobalt Robotics|Salem Robotics|LimX Dynamics|Beyond Imagination|Sanctuary AI|Mireye|Azalea Robotics|PhysiCar)$/i.test(name);
  const noise=genericNoise.test(name) || /^(making|agentic|learning|software engineer|ai researcher|intern|portfolio)$/i.test(name);
  return {verified:!noise&&(known||explicit||org), explicit, org, known, noise};
}

function assetRelevance(asset,query,name,evidence){
  const text=(asset+" "+query+" "+name+" "+evidence).toLowerCase();
  const terms=["robot","robotics","humanoid","embodied","physical ai","robot learning","manipulation","autonomy","simulation","reinforcement learning","foundation model","intelligence"];
  return terms.filter(t=>text.includes(t)).length;
}

function buildCandidates(asset,query){
  const groups={};
  for(const sig of liveSignals){
    for(const entity of extractEntities(sig)){
      const v=entityVerification(entity,sig);
      if(!v.verified) continue;
      const relevance=assetRelevance(asset,query,entity,(sig.title||"")+" "+(sig.description||""));
      if(relevance<2) continue;
      const key=entity.toLowerCase();
      if(!groups[key]) groups[key]={name:entity,signals:[],verification:v,relevance:0};
      groups[key].signals.push(sig);
      groups[key].relevance=Math.max(groups[key].relevance,relevance);
    }
  }
  return Object.values(groups).map(g=>{
    const evidence=g.signals.map(s=>(s.title||"")+" "+(s.description||"")).join(" ");
    const recent=g.signals.reduce((n,s)=>{
      const age=(Date.now()-new Date(s.dateLabel||Date.now()).getTime())/86400000;
      return n+(isFinite(age)&&age<=180?1:0);
    },0);
    const signalCount=g.signals.length;
    const profile={
      buyerRelevance:Math.min(25,8+g.relevance*2),
      assetFit:Math.min(30,7+g.relevance*2),
      recentActivity:Math.min(20,7+recent*4),
      evidenceStrength:Math.min(15,5+signalCount*3),
      commercialProximity:Math.min(10,g.verification.known?10:(g.verification.org?8:7))
    };
    return {name:g.name,score:Object.values(profile).reduce((a,v)=>a+v,0),profile,
      reason:g.verification.known?"Known commercial entity with direct topical evidence.":"Verified organization with commercially relevant public evidence.",
      signal:g.signals[0].title,liveEvidence:signalCount,confidence:g.verification.known?0.95:(g.verification.org?0.82:0.72)};
  }).sort((a,b)=>b.score-a.score);
}
async function getJSON(url){
  const r=await fetch(url,{headers:{"Accept":"application/json"}});
  if(!r.ok) throw new Error(r.status+" "+r.statusText);
  return r.json();
}
async function runLive(){
  const asset=$("asset").value.trim(),query=$("query").value.trim();
  if(!asset){$("status").textContent="ENTER AN ASSET FIRST";return;}
  $("status").textContent="LIVE RADAR · DISCOVERING…";
  liveSignals=[]; candidates=[]; renderMetrics(); renderCandidates(); renderSignals();
  const searchQuery=(query||asset)+" robotics AI";
  const gh=getJSON("https://api.github.com/search/repositories?q="+encodeURIComponent(searchQuery)+"&sort=updated&order=desc&per_page=10")
    .then(d=>(d.items||[]).map(repo=>({sourceType:"github",sourceTypeLabel:"GITHUB SIGNAL",source:repo.html_url,sourceLabel:"GitHub",
      dateLabel:repo.updated_at?new Date(repo.updated_at).toLocaleDateString():"recent",title:repo.full_name,description:repo.description||"Public repository activity matching the research query.",
      ownerLogin:repo.owner?.login||"",ownerType:repo.owner?.type||"",entity:""})));
  const hn=getJSON("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(searchQuery)+"&tags=story&hitsPerPage=10")
    .then(d=>(d.hits||[]).map(hit=>({sourceType:"hackernews",sourceTypeLabel:"HACKER NEWS",source:hit.url||("https://news.ycombinator.com/item?id="+hit.objectID),
      sourceLabel:"Hacker News",dateLabel:hit.created_at?new Date(hit.created_at).toLocaleDateString():"recent",title:hit.title||"Hacker News signal",
      description:hit.title||"Recent public discussion/news signal.",entity:""})));
  const results=await Promise.allSettled([gh,hn]);
  let providers=0;
  for(const r of results) if(r.status==="fulfilled"){providers++;liveSignals.push(...r.value);}
  for(const sig of liveSignals) sig.entity=extractEntities(sig)[0]||"Unattributed public signal";
  candidates=buildCandidates(asset,query);
  renderMetrics();renderCandidates();renderSignals();generateBrief(asset);
  $("status").textContent="LIVE RADAR · "+providers+"/2 SOURCES · "+liveSignals.length+" SIGNALS · "+candidates.length+" ENTITIES";
}
function init(){
  $("run")?.addEventListener("click",()=>runLive().catch(err=>{$("status").textContent="RADAR ERROR · "+err.message;console.error(err);}));
  document.querySelectorAll("#signalFilters button").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll("#signalFilters button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");signalFilter=btn.dataset.signalFilter;renderSignals();
  }));
  renderMetrics();renderCandidates();renderSignals();
  $("buyerBrief").textContent="Run the Radar to discover buyer candidates from live evidence.";
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
