const demo=[
{name:"Figure AI",keywords:["humanoid","robot","robotics","embodied","physical ai","intelligence"],reason:"Strong overlap with humanoid robotics and embodied intelligence.",signal:"Humanoid deployment and robot-learning activity.",profile:{buyerRelevance:25,assetFit:30,recentActivity:18,evidenceStrength:14,commercialProximity:9}},
{name:"Skild AI",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],reason:"Strong overlap with general-purpose robot intelligence and embodied AI.",signal:"Robot foundation-model activity.",profile:{buyerRelevance:24,assetFit:29,recentActivity:18,evidenceStrength:14,commercialProximity:9}},
{name:"Physical Intelligence",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],reason:"Strong overlap with physical AI, robot learning and general-purpose models.",signal:"Foundation-model approach to physical tasks.",profile:{buyerRelevance:24,assetFit:29,recentActivity:17,evidenceStrength:14,commercialProximity:9}},
{name:"NVIDIA",keywords:["robot","robotics","simulation","physical ai","ai","intelligence"],reason:"Relevant robotics infrastructure and physical-AI ecosystem activity.",signal:"Robotics platforms and physical-AI infrastructure.",profile:{buyerRelevance:22,assetFit:27,recentActivity:18,evidenceStrength:13,commercialProximity:9}},
{name:"Google DeepMind",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],reason:"Relevant embodied-AI, robot-learning and foundation-model research.",signal:"Embodied AI and robotics research.",profile:{buyerRelevance:23,assetFit:28,recentActivity:16,evidenceStrength:13,commercialProximity:8}}
];
let candidates=[],liveSignals=[],signalFilter="all";
const $=id=>document.getElementById(id);
function tokenize(v){return String(v||"").toLowerCase().replace(/[^a-z0-9.\s-]/g," ").split(/[\s-]+/).filter(Boolean)}
function scoreCandidate(b,asset,query,signalCount){
 const text=(asset+" "+query).toLowerCase();
 const hits=b.keywords.filter(k=>text.includes(k)).length;
 const profile={buyerRelevance:Math.min(25,12+hits*3),assetFit:Math.min(30,10+hits*4),recentActivity:Math.min(20,8+signalCount*3),evidenceStrength:Math.min(15,5+signalCount*2),commercialProximity:hits>=2?8:4};
 return Object.assign({},b,{score:Object.values(profile).reduce((a,v)=>a+v,0),profile,hits,liveEvidence:signalCount});
}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function renderMetrics(){
 const avg=candidates.length?Math.round(candidates.reduce((s,x)=>s+x.score,0)/candidates.length):0;
 const providers=new Set(liveSignals.map(x=>x.sourceType)).size;
 $("metrics").innerHTML='<div class="metric"><b>'+candidates.length+'</b><span>BUYER CANDIDATES</span></div><div class="metric"><b>'+liveSignals.length+'</b><span>LIVE SIGNALS</span></div><div class="metric"><b>'+avg+'/100</b><span>AVG BUYER FIT</span></div><div class="metric"><b>'+providers+'</b><span>LIVE SOURCES</span></div>';
}
function factor(label,value,max){return '<div class="factor"><div class="factor-head"><span>'+label+'</span><b>'+value+'/'+max+'</b></div><div class="bar"><i style="width:'+Math.round(value/max*100)+'%"></i></div></div>'}
function renderCandidates(){
 $("candidates").innerHTML=candidates.map((x,i)=>'<article class="candidate"><div class="candidate-top"><span class="rank">DISCOVERED CANDIDATE '+String(i+1).padStart(2,"0")+'</span><span class="score">'+x.score+'/100</span></div><h3>'+esc(x.name)+'</h3><p>'+esc(x.reason)+'</p>'+factor("BUYER RELEVANCE",x.profile.buyerRelevance,25)+factor("ASSET FIT",x.profile.assetFit,30)+factor("RECENT ACTIVITY",x.profile.recentActivity,20)+factor("EVIDENCE STRENGTH",x.profile.evidenceStrength,15)+factor("COMMERCIAL PROXIMITY",x.profile.commercialProximity,10)+'<div class="candidate-foot">'+x.liveEvidence+' live signal(s) support this entity.<br><small>Discovered from public evidence; not purchase-intent evidence.</small></div></article>').join("")||'<div class="empty">No commercial entities discovered yet. Run the Radar.</div>';
}
function renderSignals(){
 const visible=signalFilter==="all"?liveSignals:liveSignals.filter(x=>x.sourceType===signalFilter);
 $("signalsGrid").innerHTML=visible.map(x=>'<article class="signal-card"><div class="signal-meta"><span>'+esc(x.sourceTypeLabel)+'</span><span>'+esc(x.dateLabel)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><p><b>Entity:</b> '+esc(x.entity||"Unattributed public signal")+'</p><a class="signal-link" href="'+esc(x.source)+'" target="_blank" rel="noopener">'+esc(x.sourceLabel)+' ↗</a></article>').join("")||'<div class="empty">No live signals for this source filter.</div>';
}
function generateBrief(asset,query){
 const top=candidates[0];
 if(!top){$("buyerBrief").textContent="Run the Radar to generate a structured buyer brief.";return}
 $("buyerBrief").innerHTML='<div class="brief-grid"><div><span>ASSET</span><strong>'+esc(asset)+'</strong></div><div><span>TOP DISCOVERED ENTITY</span><strong>'+esc(top.name)+'</strong></div><div><span>BUYER FIT</span><strong>'+top.score+'/100</strong></div><div><span>LIVE EVIDENCE</span><strong>'+top.liveEvidence+' signals</strong></div></div><p><b>Why surfaced:</b> '+esc(top.reason)+'</p><p><b>Evidence:</b> '+esc(top.signal)+'</p><p><b>Next:</b> Verify the entity as a commercial organization, identify the relevant decision-maker and validate current strategic activity.</p><small>Scores are discovery/research heuristics, not purchase probability.</small>';
}
function normalizeName(name){
 return String(name||"").replace(/[-_]+/g," ").replace(/\\.(ai|com|io|co|org)$/i,"").replace(/\\s+/g," ").trim();
}
function extractEntities(signal){
 const title=String(signal.title||"");
 const desc=String(signal.description||"");
 const full=title+" "+desc;
 const found=[];
 const explicit=[
  /(?:Launch HN:\s*)([^–-]+?)(?:\s*\(|\s*[–-])/i,
  /\\b([A-Z][A-Za-z0-9&]+(?:\\s+[A-Z][A-Za-z0-9&]+){0,3})\\b(?:\\s+is|\\s+develops|\\s+builds|\\s+—)/g,
  /\\b([A-Z][A-Za-z0-9&]+(?:\\s+[A-Z][A-Za-z0-9&]+){0,3})\\b(?:\\s+AI|\\s+Robotics|\\s+robotics)/g
 ];
 explicit.forEach(re=>{let m;while((m=re.exec(full))!==null){if(m[1])found.push(normalizeName(m[1]))}});
 const repoName=title.split("/").pop().replace(/[-_]+/g," ");
 if(repoName && !/^(awesome|demo|test|landingpage|portfolio|sdk|website)$/i.test(repoName)) found.push(normalizeName(repoName));
 return [...new Set(found)].filter(n=>{
   if(n.length<3 || n.length>60)return false;
   if(/^(github|hacker news|ask hn|show hn|readme|source code|public repository|ai|robotics)$/i.test(n))return false;
   if(/(?:username|student|enthusiast|developer|engineer|portfolio)/i.test(n))return false;
   return true;
 });
}
function entityQuality(entity,signals){
 const text=(entity+" "+signals.map(s=>s.title+" "+s.description).join(" ")).toLowerCase();
 const commercialTerms=["company","inc","robotics","ai","automation","platform","product","startup","founded","funding","yc ","physical world","brand","enterprise","software"];
 const noiseTerms=["student","my portfolio","i'm ","my dream","tutorial","course","assignment","personal","enthusiast","fictional"];
 const commercial=commercialTerms.filter(k=>text.includes(k)).length;
 const noise=noiseTerms.filter(k=>text.includes(k)).length;
 return commercial-noise*3;
}
function buildCandidates(asset,query){
 const groups={};
 liveSignals.forEach(sig=>{
   extractEntities(sig).forEach(entity=>{
     const key=entity.toLowerCase();
     if(!groups[key])groups[key]={name:entity,signals:[]};
     groups[key].signals.push(sig);
   });
 });
 return Object.values(groups).map(g=>{
   const evidence=g.signals.map(s=>s.title+" "+s.description).join(" ");
   const text=(asset+" "+query+" "+g.name+" "+evidence).toLowerCase();
   const keywords=["brand","robot","robotics","ai","intelligence","embodied","physical","humanoid","foundation","automation"];
   const hits=keywords.filter(k=>text.includes(k)).length;
   const quality=entityQuality(g.name,g.signals);
   if(quality<0)return null;
   const profile={
     buyerRelevance:Math.min(25,8+hits*2+Math.max(0,quality)),
     assetFit:Math.min(30,8+hits*2),
     recentActivity:Math.min(20,8+g.signals.length*4),
     evidenceStrength:Math.min(15,5+g.signals.length*3),
     commercialProximity:Math.min(10,Math.max(2,5+Math.min(5,quality)))
   };
   return {name:g.name,score:Object.values(profile).reduce((a,v)=>a+v,0),profile,reason:"Entity extracted from live public evidence and filtered for commercial relevance.",signal:g.signals[0].title,live:true,liveEvidence:g.signals.length};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
}
function showLocal(){
 candidates=[];liveSignals=[];renderMetrics();renderCandidates();renderSignals();
 $("buyerBrief").textContent="Run the Radar to discover buyer candidates from live evidence.";
 $("status").textContent="READY · ENTER AN ASSET AND RUN RADAR";
}
function getJSON(url){return fetch(url).then(r=>{if(!r.ok)throw new Error(r.status+" "+r.statusText);return r.json()})}
function runLive(){
 const asset=$("asset").value.trim(),query=$("query").value.trim();
 if(!asset){$("status").textContent="ENTER AN ASSET FIRST";return}
 $("status").textContent="LIVE RADAR · DISCOVERING ENTITIES…";
 const searchQuery=(query||asset)+" robotics AI";
 const gh=getJSON("https://api.github.com/search/repositories?q="+encodeURIComponent(searchQuery)+"&sort=updated&order=desc&per_page=10").then(data=>(data.items||[]).map(repo=>({sourceType:"github",sourceTypeLabel:"GITHUB SIGNAL",source:repo.html_url,sourceLabel:"GitHub",dateLabel:repo.updated_at?new Date(repo.updated_at).toLocaleDateString():"recent",title:repo.full_name,description:repo.description||"Public repository activity matching the research query.",entity:"",live:true})));
 const hn=getJSON("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(searchQuery)+"&tags=story&hitsPerPage=10").then(data=>(data.hits||[]).map(hit=>({sourceType:"hackernews",sourceTypeLabel:"HACKER NEWS",source:hit.url||("https://news.ycombinator.com/item?id="+hit.objectID),sourceLabel:"Hacker News",dateLabel:hit.created_at?new Date(hit.created_at).toLocaleDateString():"recent",title:hit.title||"Hacker News signal",description:hit.title||"Recent public discussion/news signal.",entity:"",live:true})));
 Promise.allSettled([gh,hn]).then(results=>{
   liveSignals=[];let providers=0;
   results.forEach(r=>{if(r.status==="fulfilled"){providers++;liveSignals=liveSignals.concat(r.value)}});
   liveSignals.forEach(sig=>{const e=extractEntities((sig.title||"")+" "+(sig.description||""));sig.entity=e[0]||"Unattributed public signal"});
   candidates=buildCandidates(asset,query);
   renderMetrics();renderCandidates();renderSignals();generateBrief(asset,query);
   $("status").textContent="LIVE RADAR · "+providers+"/2 SOURCES · "+liveSignals.length+" SIGNALS · "+candidates.length+" ENTITIES";
 });
}
$("run").addEventListener("click",runLive);
document.querySelectorAll("#signalFilters button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#signalFilters button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");signalFilter=btn.dataset.signalFilter;renderSignals()}));
showLocal();
showLocal();