(() => {
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={tab:"all",query:"",filter:"all",data:null};

function allRecords(){
 const d=state.data||{};
 const groups=["companies","models","robots"];
 return groups.flatMap(tab=>(d[tab]||[]).map(x=>({...x,kind:tab,type:tab.slice(0,-1).toUpperCase()})));
}
function records(tab){
 const d=state.data||{};
 if(tab==="all") return allRecords();
 if(tab==="research") return (d.research||[]).map(x=>({...x,name:x.title,focus:x.description,category:x.type,kind:"research",type:"RESEARCH"}));
 return (d[tab]||[]).map(x=>({...x,kind:tab,type:tab.slice(0,-1).toUpperCase()}));
}
function renderCapabilities(items){
 document.querySelectorAll(".cap-card").forEach((card,i)=>{const x=items[i];if(!x)return;card.querySelector("h3").textContent=x.name;card.querySelector("p").textContent=x.description;});
}
function renderIndex(){
 const list=records(state.tab),q=state.query.trim().toLowerCase();
 const filters=[...new Set(list.map(x=>x.category||x.type).filter(Boolean))];
 const fr=document.querySelector("#index-filters");
 fr.innerHTML='<button class="filter active" data-filter="all">All</button>'+filters.map(x=>'<button class="filter" data-filter="'+esc(x)+'">'+esc(x)+'</button>').join("");
 if(state.filter!=="all"&&!filters.includes(state.filter))state.filter="all";
 fr.querySelectorAll(".filter").forEach(b=>{b.classList.toggle("active",b.dataset.filter===state.filter);b.onclick=()=>{state.filter=b.dataset.filter;renderIndex();}});
 const filtered=list.filter(x=>{
  const hay=[x.name,x.title,x.category,x.type,x.focus,x.description,x.company].join(" ").toLowerCase();
  return (!q||hay.includes(q))&&(state.filter==="all"||(x.category||x.type)===state.filter);
 });
 document.querySelector("#index-count").textContent=filtered.length+" of "+list.length+" records";
 document.querySelector("#index-results").innerHTML=filtered.length?filtered.map((x,i)=>card(x,i)).join(""):'<div class="empty-state full"><strong>No matching intelligence.</strong><small>Try a model, company, robot or capability.</small></div>';
 document.querySelector("#index-notice").textContent=state.data.notice||"Source-linked records. Verify claims at the linked source.";
 document.querySelectorAll(".entity-open").forEach(b=>b.onclick=()=>openEntity(b.dataset.kind,b.dataset.name));
}
function card(x,i){
 const name=x.name||x.title,cat=x.category||x.type||"Index";
 const url=x.url||x.source||"#";
 return '<article class="index-card entity-open" data-kind="'+esc(x.kind)+'" data-name="'+esc(name)+'" tabindex="0"><div class="index-card-top"><span>'+String(i+1).padStart(2,"0")+'</span><b>'+esc(cat)+'</b></div><h3>'+esc(name)+'</h3><p>'+esc(x.focus||x.description||"")+'</p><div class="index-card-bottom"><span>'+esc(x.company||"Robot Intelligence Index")+'</span><a href="'+esc(url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">Source ↗</a></div></article>';
}
function findEntity(kind,name){
 return records(kind==="research"?"research":kind+"s").find(x=>(x.name||x.title)===name) || allRecords().find(x=>x.name===name);
}
function openEntity(kind,name){
 const x=findEntity(kind,name);if(!x)return;
 const panel=document.querySelector("#entity-panel");panel.hidden=false;
 const related=allRecords().filter(y=>y.company&&x.name&&y.company===x.name);
 const sources=x.source||x.url;
 panel.innerHTML='<div class="entity-head"><div><span class="eyebrow">ENTITY INTELLIGENCE / '+esc(String(kind).toUpperCase())+'</span><h3>'+esc(x.name||x.title)+'</h3><p>'+esc(x.focus||x.description||"")+'</p></div><button class="entity-close" aria-label="Close">×</button></div>'+
 '<div class="entity-grid"><div><span>TYPE</span><strong>'+esc(x.category||x.type||kind)+'</strong></div><div><span>COMPANY</span><strong>'+esc(x.company||"Independent / not specified")+'</strong></div><div><span>EVIDENCE</span><strong>Source-linked</strong></div></div>'+
 (related.length?'<div class="entity-related"><span class="eyebrow">CONNECTED ENTITIES</span><div>'+related.slice(0,6).map(y=>'<button class="related-chip entity-open" data-kind="'+esc(y.kind)+'" data-name="'+esc(y.name)+'">'+esc(y.name)+'</button>').join("")+'</div></div>':"")+
 '<div class="entity-evidence"><span class="eyebrow">EVIDENCE</span><p>Observed record from the curated intelligence index. This interface does not infer claims beyond the linked source.</p>'+(sources?'<a href="'+esc(sources)+'" target="_blank" rel="noopener">Open primary source ↗</a>':"")+'</div>';
 panel.querySelector(".entity-close").onclick=()=>panel.hidden=true;
 panel.querySelectorAll(".related-chip").forEach(b=>b.onclick=()=>openEntity(b.dataset.kind,b.dataset.name));
 panel.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function renderResearch(items){
 const grid=document.querySelector("#research-grid");if(!grid)return;
 grid.innerHTML=items.map(x=>'<article class="signal"><span class="signal-type">'+esc(x.type)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><a class="signal-meta source-link" href="'+esc(x.source)+'" target="_blank" rel="noopener">'+esc(x.label)+' · source ↗</a></article>').join("");
 const strip=document.querySelector("#live-strip");
 if(strip)strip.innerHTML=items.map((x,i)=>'<div class="live-item"><span class="live-dot"></span><div><b>'+esc(x.type)+" / "+esc(x.title)+'</b><small>'+esc(x.label||"Source-linked signal")+'</small></div></div>').join("");
}
function renderMarket(){const el=document.querySelector("#market-map");if(!el)return;const layers=[["01","FOUNDATION MODELS","VLA · embodied reasoning"],["02","WORLD MODELS","simulation · prediction · synthetic data"],["03","ROBOT INTELLIGENCE","planning · learning · manipulation"],["04","EMBODIMENT","humanoids · arms · mobile robots"],["05","INFRASTRUCTURE","compute · simulation · datasets · tooling"],["06","DEPLOYMENT","factories · logistics · homes · field systems"]];el.innerHTML=layers.map((x,i)=>'<div class="market-layer '+(i===2?"active":"")+'"><span>'+x[0]+'</span><div><b>'+x[1]+'</b><small>'+x[2]+'</small></div><strong>'+String(i+1).padStart(2,"0")+'</strong></div>').join("");}
function renderOpportunities(items){const el=document.querySelector("#opportunity-grid");if(!el)return;el.innerHTML=(items||[]).map(x=>'<article class="opportunity-card"><div class="opp-top"><span>RESEARCH LEAD</span><b>'+esc(x.company)+'</b></div><h3>'+esc(x.domain)+'</h3><p>'+esc(x.thesis)+'</p><div class="opp-tags">'+(x.triggers||[]).slice(0,4).map(t=>'<span>'+esc(t)+'</span>').join("")+'</div><div class="opp-bottom"><small>'+esc(x.status||"monitor")+'</small><a href="#contact">Discuss ↗</a></div></article>').join("");}
function renderPortfolio(domains,opps){const head=document.querySelector("#portfolio-head"),grid=document.querySelector("#portfolio-grid");if(!head||!grid)return;head.innerHTML='<div><strong>'+domains.length+'</strong><span>DOMAINS IN PORTFOLIO</span></div><div><strong>'+opps.length+'</strong><span>ACTIVE RESEARCH LEADS</span></div><div><strong>PHYSICAL AI</strong><span>CORE THEME</span></div>';const signals=new Set(opps.map(x=>x.domain));grid.innerHTML=domains.map((d,i)=>{const active=signals.has(d);const words=d.toLowerCase().replace(/\.(com|bot|co|xyz|today)$/,"").split(/[-.]/);const fit=words.some(w=>["robot","humanoid","intelligence","behavior","planning","embodiment","manipulation","context","stack","agents"].includes(w));return '<article class="portfolio-card '+(active?"hot ":"")+(fit?"fit":"")+'"><span>'+String(i+1).padStart(2,"0")+'</span><h3>'+esc(d)+'</h3><small>'+(active?"OPPORTUNITY LINKED":fit?"SEMANTIC FIT":"PORTFOLIO ASSET")+'</small></article>';}).join("");}
async function boot(){
 try{
  const r=await fetch("data/platform.json",{cache:"no-store"});if(!r.ok)throw new Error("platform data unavailable");
  state.data=await r.json();
  renderCapabilities(state.data.capabilities||[]);
  document.querySelector("#metric-entities").textContent=(state.data.companies?.length||0)+(state.data.models?.length||0)+(state.data.robots?.length||0);
  document.querySelector("#metric-signals").textContent=(state.data.research?.length||0);
  document.querySelector("#metric-assets").textContent="22";
  renderResearch(state.data.research||[]);
  renderMarket();
  renderIndex();
  try{
    const [dr,or]=await Promise.all([
      fetch("data/domains.json",{cache:"no-store"}),
      fetch("data/opportunities.json",{cache:"no-store"})
    ]);
    const domains=(await dr.json()).domains||[];
    const opps=(await or.json()).opportunities||[];
    renderOpportunities(opps);
    renderPortfolio(domains,opps);
  }catch(e){console.warn("Portfolio intelligence:",e)}
 }catch(e){console.warn("Robot Intelligence data layer:",e);const n=document.querySelector("#index-notice");if(n)n.textContent="Index data is temporarily unavailable."}
}
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll("#index-tabs button").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;state.filter="all";document.querySelectorAll("#index-tabs button").forEach(x=>x.classList.toggle("active",x===b));renderIndex();});
 document.querySelector("#index-search").addEventListener("input",e=>{state.query=e.target.value;state.tab="all";document.querySelectorAll("#index-tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="all"));renderIndex();});
});
boot();
})();