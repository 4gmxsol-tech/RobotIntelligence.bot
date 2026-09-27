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
function scoreCandidate(b,asset,query){
 const tokens=new Set(tokenize(asset+" "+query));
 const hits=b.keywords.filter(k=>k.split(" ").some(w=>tokens.has(w))).length;
 const profile=Object.assign({},b.profile);
 profile.assetFit=Math.min(30,profile.assetFit+Math.min(3,hits));
 profile.buyerRelevance=Math.min(25,profile.buyerRelevance+Math.min(2,hits));
 const score=profile.buyerRelevance+profile.assetFit+profile.recentActivity+profile.evidenceStrength+profile.commercialProximity;
 return Object.assign({},b,{score,profile,hits});
}
function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function renderMetrics(){
 const avg=candidates.length?Math.round(candidates.reduce((s,x)=>s+x.score,0)/candidates.length):0;
 const providers=new Set(liveSignals.map(x=>x.sourceType)).size;
 $("metrics").innerHTML='<div class="metric"><b>'+candidates.length+'</b><span>BUYER CANDIDATES</span></div><div class="metric"><b>'+liveSignals.length+'</b><span>LIVE SIGNALS</span></div><div class="metric"><b>'+avg+'/100</b><span>AVG BUYER FIT</span></div><div class="metric"><b>'+providers+'</b><span>LIVE SOURCES</span></div>';
}
function factor(label,value,max){return '<div class="factor"><div class="factor-head"><span>'+label+'</span><b>'+value+'/'+max+'</b></div><div class="bar"><i style="width:'+Math.round(value/max*100)+'%"></i></div></div>'}
function renderCandidates(){
 $("candidates").innerHTML=candidates.map((x,i)=>'<article class="candidate"><div class="candidate-top"><span class="rank">CANDIDATE '+String(i+1).padStart(2,"0")+'</span><span class="score">'+x.score+'/100</span></div><h3>'+esc(x.name)+'</h3><p>'+esc(x.reason)+'</p>'+factor("BUYER RELEVANCE",x.profile.buyerRelevance,25)+factor("ASSET FIT",x.profile.assetFit,30)+factor("RECENT ACTIVITY",x.profile.recentActivity,20)+factor("EVIDENCE STRENGTH",x.profile.evidenceStrength,15)+factor("COMMERCIAL PROXIMITY",x.profile.commercialProximity,10)+'<div class="candidate-foot">'+esc(x.signal)+'<br><small>Candidate profile + research heuristic. Not purchase-intent evidence.</small></div></article>').join("")||'<div class="empty">No commercial candidates found.</div>';
}
function renderSignals(){
 const visible=signalFilter==="all"?liveSignals:liveSignals.filter(x=>x.sourceType===signalFilter);
 $("signalsGrid").innerHTML=visible.map(x=>'<article class="signal-card"><div class="signal-meta"><span>'+esc(x.sourceTypeLabel)+'</span><span>'+esc(x.dateLabel)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><p><b>Entity:</b> '+esc(x.entity||"Unattributed public signal")+'</p><a class="signal-link" href="'+esc(x.source)+'" target="_blank" rel="noopener">'+esc(x.sourceLabel)+' ↗</a></article>').join("")||'<div class="empty">No live signals for this source filter.</div>';
}
function generateBrief(asset,query){
 const top=candidates[0];
 if(!top){$("buyerBrief").textContent="Run the Radar to generate a buyer brief.";return}
 const attributed=liveSignals.filter(x=>x.entity&&x.entity.toLowerCase().includes(top.name.toLowerCase())).length;
 $("buyerBrief").innerHTML='<div class="brief-grid"><div><span>ASSET</span><strong>'+esc(asset)+'</strong></div><div><span>TOP CANDIDATE</span><strong>'+esc(top.name)+'</strong></div><div><span>BUYER FIT</span><strong>'+top.score+'/100</strong></div><div><span>LIVE EVIDENCE</span><strong>'+attributed+' attributed / '+liveSignals.length+' total</strong></div></div><p><b>Why:</b> '+esc(top.reason)+'</p><p><b>Research signal:</b> '+esc(top.signal)+'</p><p><b>Evidence status:</b> Live public signals are kept separate from the candidate list and are not treated as proof of buying intent.</p><p><b>Next:</b> Verify current positioning, decision-maker ownership and recent strategic activity before outreach.</p><small>Buyer-fit score = Buyer Relevance + Asset Fit + Recent Activity + Evidence Strength + Commercial Proximity. It is a research heuristic, not a purchase probability.</small>';
}
function showLocal(){
 const asset=$("asset").value.trim()||"RobotIntelligence.bot",query=$("query").value.trim()||"robot intelligence physical AI";
 candidates=demo.map(b=>scoreCandidate(b,asset,query)).sort((a,b)=>b.score-a.score);
 liveSignals=[];renderMetrics();renderCandidates();renderSignals();generateBrief(asset,query);$("status").textContent="LOCAL ENGINE READY · RUN RADAR FOR LIVE EVIDENCE";
}
function getJSON(url){return fetch(url).then(r=>{if(!r.ok)throw new Error(r.status+" "+r.statusText);return r.json()})}
function runLive(){
 const asset=$("asset").value.trim()||"RobotIntelligence.bot",query=$("query").value.trim()||"robot intelligence physical AI";
 $("status").textContent="LIVE RADAR · QUERYING…";
 const gh=getJSON("https://api.github.com/search/repositories?q="+encodeURIComponent(query+" robotics")+"&sort=updated&order=desc&per_page=8").then(data=>(data.items||[]).map(repo=>({sourceType:"github",sourceTypeLabel:"GITHUB SIGNAL",source:repo.html_url,sourceLabel:"GitHub",dateLabel:repo.updated_at?new Date(repo.updated_at).toLocaleDateString():"recent",title:repo.full_name,description:repo.description||"Public repository activity matching the research query.",entity:(repo.owner&&repo.owner.type==="Organization")?((repo.owner.login)||"Organization signal"):"Unattributed public project",live:true})));
 const hn=getJSON("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(query+" robotics")+"&tags=story&hitsPerPage=8").then(data=>(data.hits||[]).map(hit=>({sourceType:"hackernews",sourceTypeLabel:"HACKER NEWS",source:hit.url||("https://news.ycombinator.com/item?id="+hit.objectID),sourceLabel:"Hacker News",dateLabel:hit.created_at?new Date(hit.created_at).toLocaleDateString():"recent",title:hit.title||"Hacker News signal",description:"Recent public discussion/news signal matching the research query.",entity:"Unattributed public signal",live:true})));
 Promise.allSettled([gh,hn]).then(results=>{
   liveSignals=[];let providers=0;
   results.forEach(r=>{if(r.status==="fulfilled"){providers++;liveSignals=liveSignals.concat(r.value)}})
   candidates=demo.map(b=>scoreCandidate(b,asset,query)).sort((a,b)=>b.score-a.score);
   renderMetrics();renderCandidates();renderSignals();generateBrief(asset,query);
   $("status").textContent="LIVE RADAR · "+providers+"/2 SOURCES · "+liveSignals.length+" LIVE SIGNALS";
 });
}
$("run").addEventListener("click",runLive);
document.querySelectorAll("#signalFilters button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#signalFilters button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");signalFilter=btn.dataset.signalFilter;renderSignals()}));
showLocal();