const domains=["RobotIntelligence.bot","RobotEmbodiment.com","HumanoidUI.com","HumanoidBehavior.com","HumanoidPlanning.com","HumanoidIntelligenceAI.com","HumanoidIntelligenceLab.com","HumanoidContext.com","RoboticsBehavior.com","RobotIntelligenceAI.com","RobotIntelligenceLab.com","RobotStack.co","WorldAgents.co","PhysicalManipulation.com","publication.today","Xanvora.com","Czeal.com","ContextShip.com","Dexation.com","Rexation.com","ReasonFlow.xyz","Aividyou.com"];
const grid=document.querySelector("#domainGrid"),search=document.querySelector("#search"),count=document.querySelector("#domainCount");
const pilot="RobotIntelligence.bot";
const profiles={"RobotIntelligence.bot":{category:"AI / Robotics",tld:"bot",signals:["Robot intelligence","AI agents","Robotics"],notes:"Pilot asset for the intelligence engine."}};
let buyerResearch={candidates:[]};
let marketSignals={signals:[]};
let opportunities={opportunities:[]};
let decisionMakers={contacts:[]};

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
  const list=domains.filter(d=>d.toLowerCase().includes((filter||"").toLowerCase()));
  count.textContent=domains.length;
  grid.innerHTML=list.map(d=>{
    const a=analyzeDomain(d);
    return '<article class="domain-card" data-domain="'+d+'"><strong>'+d+'</strong><small><span class="dot"></span>'+(d===pilot?"Agent pilot":"Portfolio domain")+' · relevance '+a.scores.relevance+'/100</small></article>';
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

function renderContacts(){
  const container=document.querySelector("#contactList"), empty=document.querySelector("#contactEmpty");
  if(!container||!empty)return;
  if(!decisionMakers.contacts.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=decisionMakers.contacts.map(c=>'<article class="contact-card"><div class="contact-top"><div><strong>'+c.person+'</strong><small>'+c.role+' · '+c.company+'</small></div><span class="contact-confidence">'+c.confidence+'</span></div><p>'+c.reason+'</p><div class="contact-route"><strong>Public route</strong><span>'+c.contact_route+'</span></div><a href="'+c.source+'" target="_blank" rel="noopener">Verify source ↗</a></article>').join("");
  const n=document.querySelector("#contactCount");if(n)n.textContent=decisionMakers.contacts.length;
}

function renderOpportunities(){
  const container=document.querySelector("#opportunityList");
  const empty=document.querySelector("#opportunityEmpty");
  if(!container||!empty)return;
  if(!opportunities.opportunities.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=opportunities.opportunities.map(o=>'<article class="opp-card"><div class="opp-top"><div><span class="eyebrow">OPPORTUNITY</span><strong>'+o.company+' × '+o.domain+'</strong></div><span class="opp-score">'+o.opportunityScore+'</span></div><p>'+o.thesis+'</p><div class="trigger-row">'+o.triggers.map(t=>'<span>'+t+'</span>').join("")+'</div><div class="next-action"><strong>Next action</strong><span>'+o.nextAction+'</span></div></article>').join("");
  const n=document.querySelector("#opportunityCount"); if(n)n.textContent=opportunities.opportunities.length;
}

function renderSignals(){
  const container=document.querySelector("#signalList");
  const empty=document.querySelector("#signalEmpty");
  if(!container||!empty)return;
  if(!marketSignals.signals.length){empty.style.display="block";container.innerHTML="";return;}
  empty.style.display="none";
  container.innerHTML=marketSignals.signals.map(s=>'<article class="signal-card"><div class="signal-top"><div><strong>'+s.company+'</strong><small>'+s.type+' · '+s.date+'</small></div><span class="signal-strength">'+s.strength+'</span></div><p>'+s.headline+'</p><small class="why">'+s.why_it_matters+'</small><br><a href="'+s.source+'" target="_blank" rel="noopener">Source ↗</a></article>').join("");
  const n=document.querySelector("#signalCount"); if(n)n.textContent=marketSignals.signals.length;
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

async function loadDecisionMakers(){
  try{const response=await fetch("data/decision-makers.json",{cache:"no-store"});if(!response.ok)throw new Error("contacts unavailable");decisionMakers=await response.json();renderContacts();}catch(error){console.warn("Decision-maker data unavailable:",error);}
}

async function loadOpportunities(){
  try{const response=await fetch("data/opportunities.json",{cache:"no-store"});if(!response.ok)throw new Error("opportunities unavailable");opportunities=await response.json();renderOpportunities();}catch(error){console.warn("Opportunities unavailable:",error);}
}

async function loadMarketSignals(){
  try{const response=await fetch("data/market-signals.json",{cache:"no-store"});if(!response.ok)throw new Error("signals unavailable");marketSignals=await response.json();renderSignals();}catch(error){console.warn("Market signals unavailable:",error);}
}

async function loadBuyerResearch(){
  try{
    const response=await fetch("data/buyer-research.json",{cache:"no-store"});
    if(!response.ok)throw new Error("research dataset unavailable");
    buyerResearch=await response.json();
    renderBuyers();
  }catch(error){
    console.warn("Buyer research unavailable:",error);
  }
}

search.addEventListener("input",e=>render(e.target.value));
document.querySelector("#analyzeBtn").addEventListener("click",()=>showAnalysis(pilot));
grid.addEventListener("click",e=>{const card=e.target.closest(".domain-card");if(card)showAnalysis(card.dataset.domain);});
render("");
loadBuyerResearch();
loadMarketSignals();
loadOpportunities();
loadDecisionMakers();