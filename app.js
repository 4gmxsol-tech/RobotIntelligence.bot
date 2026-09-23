const domains=["RobotIntelligence.bot","RobotEmbodiment.com","HumanoidUI.com","HumanoidBehavior.com","HumanoidPlanning.com","HumanoidIntelligenceAI.com","HumanoidIntelligenceLab.com","HumanoidContext.com","RoboticsBehavior.com","RobotIntelligenceAI.com","RobotIntelligenceLab.com","RobotStack.co","WorldAgents.co","PhysicalManipulation.com","publication.today","Xanvora.com","Czeal.com","ContextShip.com","Dexation.com","Rexation.com","ReasonFlow.xyz","Aividyou.com"];
const grid=document.querySelector("#domainGrid"),search=document.querySelector("#search"),count=document.querySelector("#domainCount");
const pilot="RobotIntelligence.bot";
const profiles={"RobotIntelligence.bot":{category:"AI / Robotics",tld:"bot",signals:["Robot intelligence","AI agents","Robotics"],notes:"Pilot asset for the intelligence engine."}};
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
function render(filter){const list=domains.filter(d=>d.toLowerCase().includes((filter||"").toLowerCase()));count.textContent=domains.length;grid.innerHTML=list.map(d=>{const a=analyzeDomain(d);return '<article class="domain-card" data-domain="'+d+'"><strong>'+d+'</strong><small><span class="dot"></span>'+(d===pilot?"Agent pilot":"Portfolio domain")+' · relevance '+a.scores.relevance+'/100</small></article>';}).join("");}
function showAnalysis(domain){
  const a=analyzeDomain(domain);
  const old=document.querySelector("#analysisModal"); if(old) old.remove();
  const modal=document.createElement("div"); modal.id="analysisModal"; modal.className="modal";
  modal.innerHTML='<div class="modal-card"><button class="close" aria-label="Close">×</button><span class="eyebrow">DOMAIN INTELLIGENCE</span><h2>'+a.domain+'</h2><p class="muted">'+a.category+' · .'+a.tld+'</p><div class="score-grid"><div><small>Relevance</small><strong>'+a.scores.relevance+'</strong></div><div><small>Keyword</small><strong>'+a.scores.keyword+'</strong></div><div><small>Structure</small><strong>'+a.scores.structure+'</strong></div><div><small>TLD fit</small><strong>'+a.scores.tld+'</strong></div></div><h4>Detected concepts</h4><p>'+((a.keywordMatches.length?a.keywordMatches:["No controlled keyword match"]).join(" · "))+'</p><h4>Evidence layer</h4><p class="muted">'+a.evidence.join(" · ")+' · baseline confidence: '+a.confidence+'</p><div class="next-box"><strong>Next agent step</strong><span>Attach live market comps, company discovery and news signals.</span></div></div>';
  document.body.appendChild(modal); modal.querySelector(".close").onclick=()=>modal.remove(); modal.onclick=e=>{if(e.target===modal)modal.remove();};
}
search.addEventListener("input",e=>render(e.target.value));
document.querySelector("#analyzeBtn").addEventListener("click",()=>showAnalysis(pilot));
grid.addEventListener("click",e=>{const card=e.target.closest(".domain-card");if(card)showAnalysis(card.dataset.domain);});
render("");