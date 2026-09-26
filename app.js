(() => {
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const state={tab:"companies",query:"",filter:"all",data:null};
async function boot(){
 try{
  const r=await fetch("data/platform.json",{cache:"no-store"});
  if(!r.ok)throw new Error("platform data unavailable");
  state.data=await r.json();
  renderCapabilities(state.data.capabilities||[]);
  renderResearch(state.data.research||[]);
  renderIndex();
 }catch(e){console.warn("Robot Intelligence data layer:",e);const n=document.querySelector("#index-notice");if(n)n.textContent="Index data is temporarily unavailable."}
}
function renderCapabilities(items){
 document.querySelectorAll(".cap-card").forEach((card,i)=>{const x=items[i];if(!x)return;card.querySelector("h3").textContent=x.name;card.querySelector("p").textContent=x.description;});
}
function records(tab){
 const d=state.data||{};
 if(tab==="research")return (d.research||[]).map(x=>({...x,name:x.title,focus:x.description,category:x.type}));
 return d[tab]||[];
}
function renderIndex(){
 const list=records(state.tab), q=state.query.trim().toLowerCase();
 const filters=[...new Set(list.map(x=>x.category||x.type).filter(Boolean))];
 const fr=document.querySelector("#index-filters");
 fr.innerHTML='<button class="filter active" data-filter="all">All</button>'+filters.map(x=>'<button class="filter" data-filter="'+esc(x)+'">'+esc(x)+'</button>').join("");
 if(state.filter!=="all"&&!filters.includes(state.filter))state.filter="all";
 fr.querySelectorAll(".filter").forEach(b=>{b.classList.toggle("active",b.dataset.filter===state.filter);b.onclick=()=>{state.filter=b.dataset.filter;renderIndex();}});
 const filtered=list.filter(x=>{
  const hay=[x.name,x.title,x.category,x.type,x.focus,x.description].join(" ").toLowerCase();
  return (!q||hay.includes(q))&&(state.filter==="all"||(x.category||x.type)===state.filter);
 });
 document.querySelector("#index-count").textContent=filtered.length+" of "+list.length+" records";
 document.querySelector("#index-results").innerHTML=filtered.length?filtered.map((x,i)=>card(x,i)).join(""):'<div class="empty-state full"><strong>No matching records.</strong><small>Try another search or filter.</small></div>';
 document.querySelector("#index-notice").textContent=state.data.notice||"Source-linked records. Verify claims at the linked source.";
}
function card(x,i){
 const name=x.name||x.title, cat=x.category||x.type||"Index";
 const url=x.url||x.source||"#";
 return '<article class="index-card"><div class="index-card-top"><span>'+String(i+1).padStart(2,"0")+'</span><b>'+esc(cat)+'</b></div><h3>'+esc(name)+'</h3><p>'+esc(x.focus||x.description||"")+'</p><div class="index-card-bottom"><span>'+esc(x.company||"Robot Intelligence Index")+'</span><a href="'+esc(url)+'" target="_blank" rel="noopener">Source ↗</a></div></article>';
}
function renderResearch(items){
 const grid=document.querySelector("#research-grid");if(!grid)return;
 grid.innerHTML=items.map(x=>'<article class="signal"><span class="signal-type">'+esc(x.type)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><a class="signal-meta source-link" href="'+esc(x.source)+'" target="_blank" rel="noopener">'+esc(x.label)+' · source ↗</a></article>').join("");
}
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll("#index-tabs button").forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;state.filter="all";document.querySelectorAll("#index-tabs button").forEach(x=>x.classList.toggle("active",x===b));renderIndex();});
 document.querySelector("#index-search").addEventListener("input",e=>{state.query=e.target.value;renderIndex();});
});
boot();
})();