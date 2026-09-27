const demo = [
  {name:"Figure AI",keywords:["humanoid","robot","robotics","embodied","physical ai","intelligence"],base:96,type:"company",reason:"Strong semantic overlap with humanoid robotics and embodied intelligence.",signal:"Humanoid deployment and robot-learning activity."},
  {name:"Skild AI",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],base:94,type:"company",reason:"Strong overlap with general-purpose robot intelligence and embodied AI.",signal:"Robot foundation-model activity."},
  {name:"Physical Intelligence",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],base:92,type:"company",reason:"Strong overlap with physical AI, robot learning and general-purpose models.",signal:"Foundation-model approach to physical tasks."},
  {name:"NVIDIA",keywords:["robot","robotics","simulation","physical ai","ai","intelligence"],base:89,type:"company",reason:"Relevant robotics infrastructure, simulation and physical-AI ecosystem activity.",signal:"Robotics platforms and physical-AI infrastructure."},
  {name:"Google DeepMind",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],base:87,type:"company",reason:"Relevant embodied-AI, robot-learning and foundation-model research.",signal:"Embodied AI and robotics research."}
];

const $ = id => document.getElementById(id);
const API_TIMEOUT = 7000;
let currentResults = [];
let currentFilter = "all";

function tokenize(value){return value.toLowerCase().replace(/[^a-z0-9.\s-]/g," ").split(/[\s-]+/).filter(Boolean)}

function scoreBuyer(buyer,asset,query){
  const tokens=new Set(tokenize(asset+" "+query));
  const hits=buyer.keywords.filter(k=>k.split(" ").some(w=>tokens.has(w)));
  return Math.min(100,buyer.base+Math.min(8,hits.length*2));
}

async function fetchJSON(url){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),API_TIMEOUT);
  try{
    const response=await fetch(url,{headers:{"Accept":"application/vnd.github+json"}});
    if(!response.ok)throw new Error(response.status+" "+response.statusText);
    return await response.json();
  }finally{clearTimeout(timer)}
}

async function githubSignals(query){
  const q=encodeURIComponent(query+" robotics");
  const data=await fetchJSON("https://api.github.com/search/repositories?q="+q+"&sort=updated&order=desc&per_page=8");
  return (data.items||[]).map(repo=>({
    name:repo.owner?.login||repo.name,type:"signal",score:Math.min(88,50+Math.min(38,(repo.stargazers_count||0)/100)),
    reason:"Public GitHub activity matching the research query.",
    signal:repo.full_name+" · updated "+new Date(repo.updated_at).toLocaleDateString(),
    evidence:repo.description||"Public repository signal.",source:repo.html_url,sourceLabel:"GitHub",companyHint:repo.owner?.login||repo.name
  }));
}

async function hackerNewsSignals(query){
  const q=encodeURIComponent(query+" robotics");
  const data=await fetchJSON("https://hn.algolia.com/api/v1/search?query="+q+"&tags=story&hitsPerPage=8");
  return (data.hits||[]).map(hit=>({
    name:hit.title||"Hacker News signal",type:"signal",score:58,
    reason:"Recent public discussion/news signal matching the query.",
    signal:hit.title||"Recent Hacker News result",
    evidence:"Published "+(hit.created_at?new Date(hit.created_at).toLocaleDateString():"recently"),
    source:hit.url||("https://news.ycombinator.com/item?id="+hit.objectID),sourceLabel:"Hacker News"
  }));
}

function dedupeSignals(items){
  const seen=new Set();
  return items.filter(x=>{const key=(x.source||x.name).toLowerCase();if(seen.has(key))return false;seen.add(key);return true});
}

function renderMetrics(items,providers){
  const companies=items.filter(x=>x.type==="company").length;
  const live=items.filter(x=>x.live).length;
  const avg=items.length?Math.round(items.reduce((s,x)=>s+x.score,0)/items.length):0;
  $("metrics").innerHTML=[
    ["CANDIDATES",companies],["LIVE SIGNALS",live],["AVG RELEVANCE",avg+"/100"],["SOURCES",providers]
  ].map(x=>"<div class="metric"><b>"+x[1]+"</b><span>"+x[0]+"</span></div>").join("");
}

function render(items){
  currentResults=items;
  const visible=currentFilter==="all"?items:items.filter(x=>x.type===currentFilter);
  $("results").innerHTML=visible.map(x=>`
    <article class="card">
      <div class="score">${x.score}/100 · ${x.live?"LIVE SIGNAL":"CANDIDATE"}</div>
      <h3>${x.name}</h3>
      <p>${x.reason}</p>
      <div class="evidence"><b>SIGNAL</b><br>${x.signal}<br><br><b>EVIDENCE</b><br>${x.evidence}
      ${x.source?`<br><br><a href="${x.source}" target="_blank" rel="noopener">${x.sourceLabel} ↗</a>`:""}</div>
    </article>`).join("")||"<div class='empty'>No results for this filter.</div>";
}

function generateBrief(items,asset,query){
  const companies=items.filter(x=>x.type==="company").sort((a,b)=>b.score-a.score);
  const signals=items.filter(x=>x.type==="signal").slice(0,5);
  const top=companies[0];
  $("buyerBrief").innerHTML=top?`
    <div class="brief-grid">
      <div><span>ASSET</span><strong>${asset}</strong></div>
      <div><span>TOP CANDIDATE</span><strong>${top.name}</strong></div>
      <div><span>RELEVANCE</span><strong>${top.score}/100</strong></div>
      <div><span>RESEARCH QUERY</span><strong>${query}</strong></div>
    </div>
    <p><b>Why this candidate:</b> ${top.reason}</p>
    <p><b>Known signal:</b> ${top.signal}</p>
    <p><b>Next research:</b> verify current company positioning, relevant product/domain usage, decision-maker ownership and recent strategic activity before outreach.</p>
    <small>${signals.length} live signals were available in this run. Scores are research heuristics, not evidence of purchase intent.</small>`:"Run the Radar to generate a structured brief.";
}

async function runRadar(){
  const asset=$("asset").value.trim()||"RobotIntelligence.bot";
  const query=$("query").value.trim()||"robot intelligence physical AI";
  $("status").textContent="LIVE RADAR · COLLECTING…";

  const [gh,hn]=await Promise.allSettled([githubSignals(query),hackerNewsSignals(query)]);
  const live=dedupeSignals([
    ...(gh.status==="fulfilled"?gh.value:[]),
    ...(hn.status==="fulfilled"?hn.value:[])
  ]).map(x=>({...x,live:true}));

  const companies=demo.map(b=>({...b,score:scoreBuyer(b,asset,query),live:false,evidence:"Local benchmark candidate profile."}));
  const ranked=[...companies,...live].sort((a,b)=>b.score-a.score);
  const providerCount=(gh.status==="fulfilled"?1:0)+(hn.status==="fulfilled"?1:0);

  renderMetrics(ranked,providerCount);
  render(ranked);
  generateBrief(ranked,asset,query);
  $("status").textContent=`LIVE RADAR · ${providerCount}/2 PUBLIC SOURCES · ${live.length} LIVE SIGNALS`;
}

$("run").addEventListener("click",()=>runRadar().catch(error=>{
  $("status").textContent="LIVE RADAR ERROR · FALLBACK";
  const asset=$("asset").value.trim()||"RobotIntelligence.bot";
  const query=$("query").value.trim()||"robot intelligence physical AI";
  const ranked=demo.map(b=>({...b,score:scoreBuyer(b,asset,query),live:false,evidence:"Live sources unavailable; local benchmark retained."}));
  renderMetrics(ranked,0);render(ranked);generateBrief(ranked,asset,query);
}));

document.querySelectorAll("#filters button").forEach(button=>button.addEventListener("click",()=>{
  document.querySelectorAll("#filters button").forEach(b=>b.classList.remove("active"));
  button.classList.add("active");currentFilter=button.dataset.filter;render(currentResults);
}));

renderMetrics(demo,0);
render(demo.map(b=>({...b,score:b.base,live:false,evidence:"Local benchmark candidate profile."})));
generateBrief(demo,"robotembodiment.com","humanoid robotics embodied AI robot learning");
$("status").textContent="LIVE RADAR READY · PUBLIC SOURCES · NO API KEY";