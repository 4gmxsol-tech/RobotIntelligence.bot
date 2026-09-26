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
 if(kind==="capability")return (state.data?.capabilities||[]).find(x=>x.name===name)||null;
 if(kind==="signal"||kind==="research")return (state.data?.research||[]).map(x=>({...x,name:x.title,kind:"research",type:"RESEARCH"})).find(x=>x.name===name)||null;
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
function renderKnowledgeGraph(){
 const el=document.querySelector("#knowledge-graph");if(!el||!state.data)return;
 const d=state.data, nodes=[], edges=[], seen=new Set();
 const add=(id,label,type,meta={})=>{if(seen.has(id))return;seen.add(id);nodes.push({id,label,type,...meta});};
 const addEdge=(a,b,label)=>{if(a&&b&&seen.has(a)&&seen.has(b))edges.push({a,b,label})};
 (d.companies||[]).forEach(x=>add("company:"+x.name,x.name,"COMPANY",{focus:x.focus||x.description||""}));
 (d.models||[]).forEach(x=>{add("model:"+x.name,x.name,"MODEL",{company:x.company||"",focus:x.focus||x.description||""});if(x.company&&seen.has("company:"+x.company))addEdge("company:"+x.company,"model:"+x.name,"BUILDS")});
 (d.robots||[]).forEach(x=>{add("robot:"+x.name,x.name,"ROBOT",{company:x.company||"",focus:x.focus||x.description||""});if(x.company&&seen.has("company:"+x.company))addEdge("company:"+x.company,"robot:"+x.name,"BUILDS")});
 (d.capabilities||[]).forEach(x=>add("cap:"+x.name,x.name,"CAPABILITY",{focus:x.description||""}));
 (d.models||[]).forEach(x=>(x.capabilities||[]).forEach(cap=>{const cid="cap:"+cap;if(seen.has(cid))addEdge("model:"+x.name,cid,"ENABLES")}));
 (d.research||[]).forEach(x=>{add("research:"+x.title,x.title,"SIGNAL",{focus:x.description||"",source:x.source||""});const text=(x.title+" "+x.description).toLowerCase();nodes.filter(n=>n.type!=="SIGNAL"&&text.includes(n.label.toLowerCase())).slice(0,4).forEach(n=>addEdge(n.id,"research:"+x.title,"EVIDENCE"))});
 const W=el.clientWidth||900,H=Math.max(520,Math.min(680,el.clientWidth*.58));let scale=1,offsetX=0,offsetY=0,drag=null,selected=null;
 const palette={COMPANY:"#b9ff3d",MODEL:"#54d6ff",ROBOT:"#ffb86b",CAPABILITY:"#d08cff",SIGNAL:"#ffffff"};
 const pos={};nodes.forEach((n,i)=>{const layer={COMPANY:0,MODEL:1,ROBOT:2,CAPABILITY:3,SIGNAL:4}[n.type]??2;const count=nodes.filter(x=>({COMPANY:0,MODEL:1,ROBOT:2,CAPABILITY:3,SIGNAL:4}[x.type]??2)===layer).length;const idx=nodes.slice(0,i+1).filter(x=>({COMPANY:0,MODEL:1,ROBOT:2,CAPABILITY:3,SIGNAL:4}[x.type]??2)===layer).length-1;pos[n.id]={x:90+layer*((W-180)/4),y:55+(idx+1)*(H-100)/Math.max(count,2)}});
 const svg=()=>'<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none"><g transform="translate('+offsetX+' '+offsetY+') scale('+scale+')">'+edges.map(e=>'<line class="g-edge '+(selected&&(e.a===selected||e.b===selected)?"hot":"")+'" x1="'+pos[e.a].x+'" y1="'+pos[e.a].y+'" x2="'+pos[e.b].x+'" y2="'+pos[e.b].y+'"/>').join("")+nodes.map(n=>'<g class="g-node '+(selected===n.id?"selected":"")+'" data-id="'+esc(n.id)+'" transform="translate('+pos[n.id].x+' '+pos[n.id].y+')"><circle r="'+(selected===n.id?12:8)+'" fill="'+palette[n.type]+'"/><text x="15" y="3">'+esc(n.label.length>22?n.label.slice(0,21)+"…":n.label)+'</text><small x="15" y="15">'+esc(n.type)+'</small></g>').join("")+'</g></svg>';
 const draw=()=>{el.innerHTML=svg();el.querySelectorAll(".g-node").forEach(g=>g.onclick=()=>{selected=g.dataset.id;const n=nodes.find(x=>x.id===selected);document.querySelector("#graph-status").textContent=n.label+" / "+n.type;openEntity(n.type.toLowerCase(),n.label);draw()});};
 draw();
 document.querySelector("#graph-reset").onclick=()=>{scale=1;offsetX=offsetY=0;selected=null;document.querySelector("#graph-status").textContent="SELECT A NODE";draw()};
 document.querySelector("#graph-zoom-in").onclick=()=>{scale=Math.min(1.8,scale+.15);draw()};
 document.querySelector("#graph-zoom-out").onclick=()=>{scale=Math.max(.65,scale-.15);draw()};
}
function graphQuery(name){
 const q=String(name||"").trim().toLowerCase();if(!q)return;
 const d=state.data||{},all=allRecords();
 const root=all.find(x=>String(x.name||"").toLowerCase()===q)||all.find(x=>String(x.name||"").toLowerCase().includes(q));
 if(!root)return;
 const connected=[];
 const rootName=root.name;
 all.forEach(x=>{if(x.name===rootName)return;const hay=JSON.stringify(x).toLowerCase();if(hay.includes(rootName.toLowerCase())||String(root.company||"").toLowerCase()===String(x.name||"").toLowerCase()||String(x.company||"").toLowerCase()===String(root.company||"").toLowerCase())connected.push(x);});
 const research=(d.research||[]).filter(x=>JSON.stringify(x).toLowerCase().includes(String(rootName).toLowerCase()));
 const panel=document.querySelector("#graph-query"),body=document.querySelector("#graph-query-body");if(!panel||!body)return;
 panel.hidden=false;
 body.innerHTML='<div class="gq-root"><span>'+esc(root.kind||root.type)+'</span><h3>'+esc(root.name)+'</h3><p>'+esc(root.focus||root.description||"")+'</p></div>'+
 '<div class="gq-columns"><div><span class="eyebrow">CONNECTED ENTITIES</span><div class="gq-chips">'+(connected.slice(0,10).map(x=>'<button class="gq-chip" data-name="'+esc(x.name)+'"><b>'+esc(x.name)+'</b><small>'+esc(x.kind||x.type)+'</small></button>').join("")||'<small>No explicit relationship recorded.</small>')+'</div></div>'+
 '<div><span class="eyebrow">RELATED SIGNALS</span><div class="gq-signals">'+(research.map(x=>'<a href="'+esc(x.source||"#")+'" target="_blank" rel="noopener"><b>'+esc(x.title)+'</b><small>'+esc(x.label||x.type||"source")+' ↗</small></a>').join("")||'<small>No directly linked signal in the curated dataset.</small>')+'</div></div></div>';
 body.querySelectorAll(".gq-chip").forEach(b=>b.onclick=()=>graphQuery(b.dataset.name));
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
  renderKnowledgeGraph();
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
 document.querySelector("#index-search").addEventListener("input",e=>{state.query=e.target.value;state.tab="all";document.querySelectorAll("#index-tabs button").forEach(x=>x.classList.toggle("active",x.dataset.tab==="all"));renderIndex();if(e.target.value.trim())graphQuery(e.target.value);});
 const qc=document.querySelector("#graph-query-close");if(qc)qc.onclick=()=>document.querySelector("#graph-query").hidden=true;
});
boot();
})();