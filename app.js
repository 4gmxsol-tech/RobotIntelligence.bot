(() => {
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function boot(){
  try{
    const r=await fetch("data/platform.json",{cache:"no-store"});
    if(!r.ok) throw new Error("platform data unavailable");
    const d=await r.json();
    renderCapabilities(d.capabilities||[]);
    renderCompanies(d.companies||[]);
    renderResearch(d.research||[]);
  }catch(e){ console.warn("Robot Intelligence data layer:",e); }
}
function renderCapabilities(items){
  const cards=document.querySelectorAll(".cap-card");
  items.forEach((x,i)=>{ if(!cards[i])return; cards[i].querySelector("h3").textContent=x.name; cards[i].querySelector("p").textContent=x.description; cards[i].dataset.slug=x.slug; });
}
function renderCompanies(items){
  const grid=document.querySelector(".company-grid"); if(!grid)return;
  grid.innerHTML=items.map((x,i)=>'<a class="company-card" href="'+esc(x.url)+'" target="_blank" rel="noopener"><span>'+String(i+1).padStart(2,"0")+'</span><strong>'+esc(x.name)+'</strong><small>'+esc(x.focus)+'</small><b>'+esc(x.category)+' ↗</b></a>').join("");
}
function renderResearch(items){
  const grid=document.querySelector(".research-grid"); if(!grid)return;
  grid.innerHTML=items.map(x=>'<article class="signal"><span class="signal-type">'+esc(x.type)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><a class="signal-meta source-link" href="'+esc(x.source)+'" target="_blank" rel="noopener">'+esc(x.label)+' · source ↗</a></article>').join("");
}
boot();
})();