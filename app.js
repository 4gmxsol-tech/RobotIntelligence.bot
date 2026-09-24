let domains=[];
const grid=document.querySelector("#domainGrid"),search=document.querySelector("#search"),count=document.querySelector("#domainCount");
const pilot="RobotIntelligence.bot";
const profiles={"RobotIntelligence.bot":{category:"AI / Robotics",tld:"bot",signals:["Robot intelligence","AI agents","Robotics"],notes:"Pilot asset for the intelligence engine."}};
let buyerResearch={candidates:[]};
let marketSignals={signals:[]};
let opportunities={opportunities:[]};
let decisionMakers={contacts:[]};
let outreach={leads:[]};
let researchJobs={jobs:[]}, agentEvents={events:[]}, portfolioMetrics={}, valuationModel={};
let liveValuation=null;
let livePortfolio={domains:[]};
let memorySnapshot={memories:[]};

function analyzeDomain(domain){
  const [name,tld]=domain.toLowerCase().split(".");
  const tokens=name.split(/[-_]/).filter(Boolean);
  const dictionary=["robot","intelligence","humanoid","behavior","planning","context","ui","embodiment","robotics","agents","physical","manipulation","stack","world","publication"];
  const matches=tokens.flatMap(t=>dictionary.filter(k=>t.includes(k)));
  const length=name.length;
  const keywordScore=Math.min(100,40+matches.length*18);
  const structureScore=Math.max(35,100-Math.max(0,length-8)*4-(tokens.length-1)*8);
  const tldScore={com:100,ai:95,bot:88,co:76,xyz:55,today:58}[tld]||50;
  const relevance=Math.min(100,Math.round((keywordScore+structureScore+tldScore)/3));
  return {domain,category:profiles[domain]?.category||"Unclassified",tld,keywordMatches:[...new Set(matches)],scores:{keyword:keywordScore,structure:structureScore,tld:tldScore,relevance},evidence:["Lexical analysis","TLD fit","Portfolio taxonomy"],confidence:"baseline"};
}

function render(filter){
  const source=livePortfolio.domains.length?livePortfolio.domains.map(x=>x.domain):domains;
  const list=source.filter(d=>d.toLowerCase().includes((filter||"").toLowerCase()));
  count.textContent=domains.length;
  grid.innerHTML=list.map(d=>{
    const live=livePortfolio.domains.find(x=>x.domain===d);
    const a=live||analyzeDomain(d);
    const relevance=a.opportunityScore??a.scores?.relevance??0;
    const updated=live?.updated_at?" · updated "+new Date(live.updated_at).toLocaleString():"";
    return '<article class="domain-card" data-domain="'+d+'"><strong>'+d+'</strong><small><span class="dot"></span>'+(d===pilot?"Agent pilot":"Portfolio domain")+' · live relevance '+relevance+'/100'+updated+'</small></article>';
  }).join("");
}

function showAnalysis(domain){
  const a=analyzeDomain(domain);
  const old=document.querySelector("#analysisModal"); if(old) old.remove();
  const modal=document.createElement("div"); modal.id="analysisModal"; modal.className="modal";
  modal.innerHTML='<div class="modal-card"><button class="close" aria-label="Close">×</button><span class="eyebrow">DOMAIN INTELLIGENCE</span><h2>'+a.domain+'</h2><p class="muted">'+a.category+' · .'+a.tld+'</p><div class="score-grid"><div><small>Relevance</small><strong>'+a.scores.relevance+'</strong></div><div><small>Keyword</small><strong>'+a.scores.keyword+'</strong></div><div><small>Structure</small><strong>'+a.scores.structure+'</strong></div><div><small>TLD fit</small><strong>'+a.scores.tld+'</strong></div></div><h4>Detected concepts</h4><p>'+((a.keywordMatches.length?a.keywordMatches:["No controlled keyword match"]).join(" · "))+'</p><h4>Evidence layer</h4><p class="muted">'+a.evidence.join(" · ")+' · baseline confidence: '+a.confidence+'</p><div class="next-box"><strong>Next agent step</strong><span>Buyer research is now attached. Next: enrich companies, verify decision-makers and collect live market signals.</span></div></div>';
  document.body.appendChild(modal);
  modal.querySelector(".close").onclick=()=>modal.remove();
  modal.onclick=e=>{if(e.target===modal)modal.remove();};
}

function renderJobs(){
 const box=document.querySelector("#jobList"),empty=document.querySelector("#jobEmpty");if(!box||!empty)return;
 if(!researchJobs.jobs.length){empty.style.display="block";box.innerHTML="";return;} empty.style.display="none";
 box.innerHTML=researchJobs.jobs.map(j=>'<article class="job-card"><div class="job-top"><div><strong>'+j.id+' · '+j.domain+'</strong><small>'+j.goal+'</small></div><span class="job-status">'+j.status+'</span></div><div class="progress"><span style="width:'+Math.round(j.completed_steps/j.steps.length*100)+'%"></span></div><small>'+j.completed_steps+'/'+j.steps.length+' steps completed · '+j.result+'</small></article>').join("");
}
function renderEvents(){
 const box=document.querySelector("#eventList"),empty=document.querySelector("#eventEmpty");if(!box||!empty)return;
 if(!agentEvents.events.length){empty.style.display="block";box.innerHTML="";return;} empty.style.display="none";
 box.innerHTML=agentEvents.events.slice().reverse().map(e=>'<article class="event-row"><span class="event-dot"></span><div><strong>'+e.type.replaceAll("_"," ")+'</strong><small>'+e.entity+' · '+e.timestamp.replace("T"," ").replace("Z"," UTC")+'</small><p>'+e.message+'</p></div></article>').join("");
}

async function loadLivePortfolio(){
  try{
    const response=await fetch("/api/memory/portfolio?limit=50",{cache:"no-store"});
    if(!response.ok)throw new Error("live_portfolio_unavailable");
    livePortfolio=await response.json();
    const liveNames=livePortfolio.domains.map(x=>x.domain);
    if(liveNames.length){
      document.querySelector("#domainCount").textContent=liveNames.length;
      render(document.querySelector("#search")?.value||"");
      const updated=livePortfolio.domains.reduce((n,x)=>n+(x.news?.count||0),0);
      const signals=document.querySelector("#signalMetric"); if(signals)signals.textContent=updated;
    }
  }catch(error){console.warn("Live portfolio unavailable",error);}
}
async function loadMemorySnapshot(){
  try{
    const response=await fetch("/api/memory?limit=12",{cache:"no-store"});
    if(!response.ok)throw new Error("memory_unavailable");
    memorySnapshot=await response.json();
    const activity=document.querySelector("#eventList");
    const empty=document.querySelector("#eventEmpty");
    if(activity&&empty&&memorySnapshot.memories?.length){
      empty.style.display="none";
      activity.innerHTML=memorySnapshot.memories.map(m=>'<article class="event-row"><span class="event-dot"></span><div><strong>'+String(m.kind).replaceAll("_"," ")+'</strong><small>'+new Date(m.created_at).toLocaleString()+'</small><p>'+((m.payload?.domains||[]).join(" · ")||"Agent memory record")+'</p></div></article>').join("");
    }
  }catch(error){console.warn("Live memory unavailable",error);}
}

async function loadPortfolioMetrics(){
 try{const r=await fetch("data/portfolio-metrics.json",{cache:"no-store"});if(!r.ok)throw Error();portfolioMetrics=await r.json();const m=portfolioMetrics.portfolio_metrics;document.querySelector("#domainCount").textContent=m.total_domains;document.querySelector("#leadCount").textContent=m.active_opportunities;document.querySelector("#opportunityCount").textContent=m.active_opportunities;}catch(e){console.warn("Portfolio metrics unavailable",e);}
}
async function loadValuationModel(){
 try{const r=await fetch("data/valuation-model.json",{cache:"no-store"});if(!r.ok)throw Error();valuationModel=await r.json();const el=document.querySelector("#valuationStatus");if(el)el.textContent="LIVE COMPS REQUIRED";}catch(e){console.warn("Valuation model unavailable",e);}
}
async function loadJobs(){
 try{const r=await fetch("data/research-jobs.json",{cache:"no-store"});if(!r.ok)throw Error();researchJobs=await r.json();renderJobs();}catch(e){console.warn("Research jobs unavailable",e);}
}
async function loadEvents(){
 try{const r=await fetch("data/events.json",{cache:"no-store"});if(!r.ok)throw Error();agentEvents=await r.json();renderEvents();}catch(e){console.warn("Agent events unavailable",e);}
}
function renderOutreach(){
  const container=document.querySelector("#outreachList"),empty=document.querySelector("#outreachEmpty");
  if(!container||!empty)return;
  if(!outreach.leads.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=outreach.leads.map((l,i)=>'<article class="outreach-card"><div class="outreach-top"><div><strong>'+l.company+'</strong><small>'+l.person+' · '+l.role+'</small></div><span class="status-pill">'+l.status+'</span></div><div class="outreach-angle"><strong>Why this angle</strong><span>'+l.outreach_angle+'</span></div><div class="draft"><small>'+l.draft_subject+'</small><p>'+l.draft+'</p><button class="copy-btn" data-index="'+i+'">Copy draft</button></div></article>').join("");
  container.querySelectorAll(".copy-btn").forEach(btn=>btn.addEventListener("click",async()=>{const text=outreach.leads[Number(btn.dataset.index)].draft;try{await navigator.clipboard.writeText(text);btn.textContent="Copied ✓";setTimeout(()=>btn.textContent="Copy draft",1200)}catch(e){btn.textContent="Select manually"}}));
  const n=document.querySelector("#outreachCount");if(n)n.textContent=outreach.leads.length;
}
function renderContacts(){
  const container=document.querySelector("#contactList"), empty=document.querySelector("#contactEmpty");
  if(!container||!empty)return;
  if(!decisionMakers.contacts.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=decisionMakers.contacts.map(c=>'<article class="contact-card"><div class="contact-top"><div><strong>'+(c.person||"Unknown")+'</strong><small>'+(c.role||"Decision maker")+' · '+(c.company||"Unknown company")+'</small></div><span class="contact-confidence">'+(c.confidence||c.match_confidence||"RESEARCH")+'</span></div><p>'+(c.reason||((c.email?("Work email: "+c.email):"No email revealed")))+'</p><div class="contact-route"><strong>Contact intelligence</strong><span>'+(c.email||"Email not available")+(c.email_status?" · "+c.email_status:"")+(c.linkedin_url?" · LinkedIn available":"")+'</span></div>'+(c.linkedin_url?'<a href="'+c.linkedin_url+'" target="_blank" rel="noopener">LinkedIn ↗</a>':"")+(c.source?' <a href="'+c.source+'" target="_blank" rel="noopener">Source ↗</a>':"")+'</article>').join("");
  const n=document.querySelector("#contactCount");if(n)n.textContent=decisionMakers.contacts.length;
}

function renderOpportunities(){
  const container=document.querySelector("#opportunityList");
  const empty=document.querySelector("#opportunityEmpty");
  if(!container||!empty)return;
  if(!opportunities.opportunities.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=opportunities.opportunities.map(o=>'<article class="opp-card"><div class="opp-top"><div><span class="eyebrow">OPPORTUNITY</span><strong>'+o.company+' × '+o.domain+'</strong></div><span class="opp-score">'+o.opportunityScore+'</span></div><p>'+o.thesis+'</p><div class="trigger-row">'+o.triggers.map(t=>'<span>'+t+'</span>').join("")+'</div><div class="next-action"><strong>Next action</strong><span>'+o.nextAction+'</span></div></article>').join("");
  const n=document.querySelector("#opportunityCount"); if(n)n.textContent=opportunities.opportunities.length; const m=document.querySelector("#opportunityMetric"); if(m)m.textContent=opportunities.opportunities.length;
}

function renderSignals(){
  const container=document.querySelector("#signalList");
  const empty=document.querySelector("#signalEmpty");
  if(!container||!empty)return;
  if(!marketSignals.signals.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=marketSignals.signals.map(s=>'<article class="signal-card"><div class="signal-top"><div><strong>'+s.company+'</strong><small>'+s.type+' · '+s.date+'</small></div><span class="signal-strength">'+s.strength+'</span></div><p>'+s.headline+'</p><small class="why">'+s.why_it_matters+'</small><br><a href="'+s.source+'" target="_blank" rel="noopener">Source ↗</a></article>').join("");
  const n=document.querySelector("#signalCount"); if(n)n.textContent=marketSignals.signals.length; const m=document.querySelector("#signalMetric"); if(m)m.textContent=marketSignals.signals.length;
}

function renderBuyers(){
  const container=document.querySelector("#buyerList");
  const empty=document.querySelector("#buyerEmpty");
  if(!container||!empty)return;
  if(!buyerResearch.candidates.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=buyerResearch.candidates.map((b,i)=>'<article class="buyer-card"><div class="buyer-top"><div><strong>'+b.company+'</strong><small>Research target · hypothesis</small></div><span class="fit">'+b.fit+' fit</span></div><p>'+b.reason+'</p><div class="signal-row">'+b.signals.map(s=>'<span>'+s+'</span>').join("")+'</div><a href="'+b.source+'" target="_blank" rel="noopener">Evidence source ↗</a></article>').join("");
  const hot=buyerResearch.candidates.filter(b=>b.fit>=90).length;
  const leadCount=document.querySelector("#leadCount"); if(leadCount)leadCount.textContent=hot;
  const top=buyerResearch.candidates[0];
  const opp=document.querySelector("#opportunityContent");
  if(opp&&top)opp.innerHTML='<span class="op-icon">✦</span><div><strong>Research '+top.company+' for '+pilot+'</strong><p>High semantic fit. Verify current naming, brand usage, corporate structure and the appropriate decision-maker before any outreach.</p></div><span class="tag">RESEARCH</span>';
}

async function loadOutreach(){
  try{const response=await fetch("data/outreach.json",{cache:"no-store"});if(!response.ok)throw new Error("outreach unavailable");outreach=await response.json();renderOutreach();}catch(error){console.warn("Outreach data unavailable:",error);}
}
async function loadDecisionMakers(){
  try{const response=await fetch("data/decision-makers.json",{cache:"no-store"});if(!response.ok)throw new Error("contacts unavailable");decisionMakers=await response.json();renderContacts();}catch(error){console.warn("Decision-maker data unavailable:",error);}
}
async function enrichDecisionMakers(){
  const button=document.querySelector("#enrichContactsBtn"),out=document.querySelector("#contactEnrichmentResult");
  if(!button||!out)return;
  button.disabled=true;button.textContent="Disabled";out.textContent="Apollo contact enrichment is disabled. No paid enrichment is used.";return;
  try{
    const response=await fetch("/api/contacts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({domain:pilot,maxPeople:5})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"enrichment_failed");
    decisionMakers={contacts:(data.contacts||[]).map(c=>({...c,confidence:c.match_confidence||c.email_status||"ENRICHED",reason:c.email?("Apollo returned a work email with status: "+(c.email_status||"unknown")):"Apollo matched the decision-maker but returned no email." ,source:c.linkedin_url||"https://www.apollo.io/" }))};
    renderContacts();
    out.textContent="Enriched "+decisionMakers.contacts.length+" decision-makers · "+(data.meta?.credits||"credits may apply")+" · manual action only";
    button.textContent="Enrichment complete ✓";
  }catch(error){
    out.textContent=error.message==="apollo_not_configured"?"Apollo is not configured on the server.":"Enrichment unavailable: "+error.message;
    button.textContent="Enrich Decision Makers";
  }finally{
    setTimeout(()=>{button.disabled=false;if(button.textContent==="Enrichment complete ✓")button.textContent="Enrich Decision Makers";},1800);
  }
}

async function loadOpportunities(){
  try{const response=await fetch("data/opportunities.json",{cache:"no-store"});if(!response.ok)throw new Error("opportunities unavailable");opportunities=await response.json();renderOpportunities();}catch(error){console.warn("Opportunities unavailable:",error);}
}

async function loadMarketSignals(){
  try{const response=await fetch("data/market-signals.json",{cache:"no-store"});if(!response.ok)throw new Error("signals unavailable");marketSignals=await response.json();renderSignals();}catch(error){console.warn("Market signals unavailable:",error);}
}

async function loadBuyerResearch(){
  try{
    const response=await fetch("/api/buyers?domain="+encodeURIComponent(pilot),{cache:"no-store"});
    if(response.ok){
      const live=await response.json();
      buyerResearch={candidates:(live.companies||live.organizations||[]).map(c=>({
        company:c.name,fit:c.fit||0,reason:c.description||"Public research candidate matched to the domain's semantic terms.",
        signals:[...(c.matched_terms||[]),c.industry].filter(Boolean).slice(0,4),
        source:c.website_url||"https://www.apollo.io/",
        live:true
      }))};
      renderBuyers();
      return;
    }
    throw new Error("live_buyer_unavailable");
  }catch(error){
    console.warn("Live buyer research unavailable; using evidence-backed static research:",error);
    try{
      const response=await fetch("data/buyer-research.json",{cache:"no-store"});
      if(!response.ok)throw new Error("research dataset unavailable");
      buyerResearch=await response.json(); renderBuyers();
    }catch(fallback){console.warn("Buyer research unavailable:",fallback);}
  }
}

async function runAgentResearch(){
  const button=document.querySelector("#researchBtn"),out=document.querySelector("#researchResult");
  if(!button||!out)return;
  button.disabled=true; button.textContent="Running…"; out.textContent="Queueing portfolio scan…";
  try{
    const response=await fetch("/api/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({domains:[pilot],persist:true})});
    if(!response.ok)throw new Error("scan_failed");
    const data=await response.json(),r=data.results&&data.results[0];
    out.textContent=r ? r.domain+" · "+r.priority+" priority · "+r.evidenceCount+" evidence records · "+r.mode+" mode"+(r.valuation?.benchmark_usd?" · benchmark $"+Number(r.valuation.benchmark_usd).toLocaleString():"")+(r.buyers?.count?" · "+r.buyers.count+" live buyer candidates":"") : "Scan completed";
    button.textContent="Research complete ✓";
    await loadJobs(); await loadEvents(); await loadLivePortfolio(); await loadMemorySnapshot();
  }catch(error){
    out.textContent="API not deployed or research runtime unavailable.";
    button.textContent="Run Agent Research";
  }finally{setTimeout(()=>{button.disabled=false;if(button.textContent==="Research complete ✓")button.textContent="Run Agent Research";},1600);}
}
async function loadDomainInventory(){
  try{
    const response=await fetch("data/domains.json",{cache:"no-store"});
    if(!response.ok)throw new Error("domain_inventory_unavailable");
    const data=await response.json();
    domains=Array.isArray(data.domains)?data.domains:[];
    document.querySelector("#domainCount").textContent=domains.length;
    render(document.querySelector("#search")?.value||"");
  }catch(error){console.warn("Domain inventory unavailable",error);}
}
search.addEventListener("input",e=>render(e.target.value));
document.querySelector("#analyzeBtn").addEventListener("click",()=>showAnalysis(pilot));
document.querySelector("#researchBtn")?.addEventListener("click",runAgentResearch);
grid.addEventListener("click",e=>{const card=e.target.closest(".domain-card");if(card)showAnalysis(card.dataset.domain);});
loadDomainInventory();
loadLivePortfolio();
loadMemorySnapshot();
loadBuyerResearch();
loadMarketSignals();
loadOpportunities();
loadDecisionMakers();
loadOutreach();
loadJobs();
loadEvents();
loadPortfolioMetrics();
loadValuationModel();
async function runValuation(){
 const button=document.querySelector("#valuationBtn"),out=document.querySelector("#valuationResult");
 if(!button||!out)return;
 button.disabled=true;button.textContent="Researching…";out.textContent="Querying NameBio live market benchmarks…";
 try{
   const r=await fetch("/api/valuation?domain="+encodeURIComponent(pilot),{cache:"no-store"});
   if(!r.ok)throw new Error("valuation_failed");
   liveValuation=await r.json();
   const range=liveValuation.indicative_range_usd;
   const benchmark=liveValuation.benchmark_usd;
   out.textContent=benchmark?"Live benchmark $"+Number(benchmark).toLocaleString()+(range?" · indicative research range $"+Number(range.low).toLocaleString()+"–$"+Number(range.high).toLocaleString():"")+" · aggregate data, not appraisal.":"No sufficient NameBio benchmark data found.";
   const status=document.querySelector("#valuationStatus");if(status)status.textContent=benchmark?"LIVE BENCHMARK":"NO DATA";
   button.textContent="Benchmark updated ✓";
 }catch(e){out.textContent="Valuation runtime unavailable or provider error.";button.textContent="Research Live Benchmark";}
 finally{setTimeout(()=>{button.disabled=false;if(button.textContent==="Benchmark updated ✓")button.textContent="Research Live Benchmark";},1600);}
}
document.querySelector("#valuationBtn")?.addEventListener("click",runValuation);
document.querySelector("#enrichContactsBtn")?.addEventListener("click",enrichDecisionMakers);
document.querySelector("#apiHealth")?.addEventListener("click",async()=>{
 const out=document.querySelector("#apiHealthResult");out.textContent="Checking…";
 try{const r=await fetch("/api/health");if(!r.ok)throw Error();const data=await r.json();out.textContent=data.ok?"API online · "+data.version:"API unavailable";}
 catch(e){out.textContent="UI ready · API runtime not deployed";} 
});
