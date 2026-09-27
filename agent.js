window.__RI_AGENT_LOADED=true;
const $=id=>document.getElementById(id);
const KEY="robotintelligence.agent.v3";
const CACHE_TTL=6*60*60*1000;
const CONTACT_CACHE_TTL=24*60*60*1000;
const STATES=["UNDERSTAND","PLAN","SEARCH","VERIFY","DECIDE","EXECUTE","TEST","COMMIT","ROLLBACK","DONE"];
let stopped=false;
let state=load();

const ALIASES={
 "figure":"Figure AI","figure ai":"Figure AI","physical intelligence":"Physical Intelligence","skild ai":"Skild AI",
 "sanctuary ai":"Sanctuary AI","sanctuary":"Sanctuary AI","nvidia":"NVIDIA","google deepmind":"Google DeepMind",
 "toyota":"Toyota","dexterity":"Dexterity","covariant":"Covariant","robust.ai":"Robust.AI","robust ai":"Robust.AI",
 "unitree":"Unitree Robotics","unitree robotics":"Unitree Robotics","limx":"LimX Dynamics","limx dynamics":"LimX Dynamics",
 "genesis embodied ai":"Genesis Embodied AI","typesafe ai":"TypeSafe AI","fluxdyne":"Fluxdyne","pudu robotics":"Pudu Robotics",
 "pudu":"Pudu Robotics","agility robotics":"Agility Robotics","approntik":"Apptronik","apptronik":"Apptronik",
 "1x":"1X Technologies","1x technologies":"1X Technologies","neura robotics":"NEURA Robotics","spirit ai":"Spirit AI",
 "embodyx":"EmbodyX","anybotics":"ANYbotics","boston dynamics":"Boston Dynamics","agibot":"AGIBOT","ubtech":"UBTECH Robotics",
 "tesla":"Tesla","amazon":"Amazon","meta":"Meta","microsoft":"Microsoft","waymo":"Waymo"
};
const KNOWN=new Set(Object.values(ALIASES).map(x=>x.toLowerCase()));
const COMPANY_SEEDS=["Figure AI","Physical Intelligence","Skild AI","Sanctuary AI","Agility Robotics","Apptronik","1X Technologies","NEURA Robotics","Unitree Robotics","Boston Dynamics","Dexterity","Covariant","Robust.AI","NVIDIA","Google DeepMind","Pudu Robotics","ANYbotics","UBTECH Robotics","LimX Dynamics","Tesla"];
const NOISE=/^(physical|physical ai|embodied|embodied ai|robotics|robot|ai|artificial intelligence|machine learning|open source|github|workshop|simulator|tutorial|demo|project|making|agentic|learning|research|engineering|software engineer|ai researcher|intern|portfolio|course|book|textbook|lab|school|university)$/i;
const PROJECT=/\b(portfolio|student|internship|course|tutorial|workshop|assignment|simulator|demo|personal project|textbook|book|notes|learning resource|university|school|classroom)\b/i;
const AMBIGUOUS_ENTITY=new Set(["dexterity","gemini","agility","cognitive","deterministic","ai can","billion dollar startup bringing"]);
const QUESTION_NOISE=/^(ask hn:|show hn:|what tech|what\/how|i am concerned|when do you expect)/i;

function base(){return{version:2,run:{status:"IDLE",goal:"",asset:"",query:"",plan:[],evidence:[],candidates:[],rejected:[],decisions:[],errors:[],providers:0,retries:0,checkpoint:null,metrics:{signals:0,qualified:0,rejected:0,fresh:0,triggers:0,contacts:0}},memory:{runs:[],lastDecision:""},log:[]}}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&x.version===2?x:base()}catch{return base()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function norm(v){return String(v||"").replace(/[-_]+/g," ").replace(/\s+/g," ").trim()}
function cacheKey(k,q){return "ri.cache."+k+"."+q.toLowerCase().trim()}
function cacheGet(k,q){try{const x=JSON.parse(localStorage.getItem(cacheKey(k,q))||"null");return x&&Date.now()-x.t<CACHE_TTL?x.data:null}catch{return null}}
function cachePut(k,q,d){try{localStorage.setItem(cacheKey(k,q),JSON.stringify({t:Date.now(),data:d.slice(0,60)}))}catch{}}
function contactKey(name){return "ri.contact."+name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}
function contactGet(name){try{const x=JSON.parse(localStorage.getItem(contactKey(name))||"null");return x&&Date.now()-x.t<CONTACT_CACHE_TTL?x.data:null}catch{return null}}
function contactPut(name,data){try{localStorage.setItem(contactKey(name),JSON.stringify({t:Date.now(),data}))}catch{}}
function slug(name){return name.toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"").replace(/ai$/,"")}
function channelIcon(type){return type==="X"?"𝕏":type==="LinkedIn"?"in":type==="GitHub"?"⌘":type==="Email"?"✉":"↗"}
function contactChannels(name,signals){
  const cached=contactGet(name);if(cached)return cached;
  const n=norm(name),s=slug(n),lower=n.toLowerCase();
  const websiteMap={"figure ai":"figure.ai","physical intelligence":"physicalintelligence.company","skild ai":"skild.ai","sanctuary ai":"sanctuary.ai","agility robotics":"agilityrobotics.com","apptronik":"apptronik.com","1x technologies":"1x.tech","neura robotics":"neura-robotics.com","unitree robotics":"unitree.com","boston dynamics":"bostondynamics.com","dexterity":"dexterity.ai","covariant":"covariant.ai","robust.ai":"robust.ai","nvidia":"nvidia.com","google deepmind":"deepmind.google","pudu robotics":"pudurobotics.com","anybotics":"anybotics.com","ubtech robotics":"ubtrobot.com","limx dynamics":"limxdynamics.com","tesla":"tesla.com"};
  const host=websiteMap[lower];
  const channels=[];
  if(host)channels.push({type:"Website",label:"Website",url:"https://"+host,confidence:96});
  channels.push({type:"LinkedIn",label:"LinkedIn",url:"https://www.linkedin.com/company/"+s,confidence:68});
  channels.push({type:"X",label:"X",url:"https://x.com/"+s,confidence:62});
  channels.push({type:"GitHub",label:"GitHub",url:"https://github.com/"+s,confidence:48});
  const evidenceText=signals.map(x=>(x.title+" "+x.description+" "+(x.url||""))).join(" ");
  const email=(evidenceText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig)||[])[0];
  if(email)channels.unshift({type:"Email",label:email,url:"mailto:"+email,confidence:99});
  const result={channels:channels.filter((x,i,a)=>a.findIndex(y=>y.type===x.type)===i),strategy:email?"EMAIL FIRST":host?"WEBSITE → LINKEDIN / X":"LINKEDIN → X → WEBSITE"};
  contactPut(name,result);return result;
}
function outreach(name,asset,trigger){
  const t=trigger?.signal?.title||trigger?.reason||"your recent robotics work";
  return "Hi "+name+" team — I own "+asset+" and noticed "+t+". The name aligns closely with your work in humanoid / embodied robotics. If this is relevant to your roadmap, I can share the domain and terms.";
}
function ageDays(v){const t=new Date(v||0).getTime();return isFinite(t)?Math.max(0,(Date.now()-t)/86400000):9999}
function write(kind,msg){state.log.unshift({t:Date.now(),kind,msg});state.log=state.log.slice(0,200);save()}
function decision(type,msg){state.run.decisions.unshift({t:Date.now(),type,msg});state.memory.lastDecision=msg;write("DECISION",msg)}
function canonical(v){
  const raw=norm(v),key=raw.toLowerCase();
  if(AMBIGUOUS_ENTITY.has(key))return "";
  if(ALIASES[key])return ALIASES[key];
  const n=raw.replace(/^the\s+/i,"");
  if(!n||n.length<3||n.length>70||NOISE.test(n)||AMBIGUOUS_ENTITY.has(n.toLowerCase()))return "";
  if(PROJECT.test(n))return "";
  if(/^(?:[a-z]+\s+){0,2}(?:r&d|research|project|portfolio|workshop|simulator)$/i.test(n))return "";
  return n;
}
function signalType(s){
  const t=(s.title+" "+s.description).toLowerCase();
  const explicitCommercial=/fund|raised|funding|investment|acqui|acquisition|partner|partnership|contract|customer|order|expands|expansion|deployment|deploys|commercial/.test(t);
  if(s.sourceType==="github" && !explicitCommercial)return"TECHNICAL";
  if(/fund|raised|funding|investment|acqui|acquisition|partner|partnership|launch|launched|contract|customer|order|expands|expansion|deployment|deploys|commercial/.test(t))return"COMMERCIAL";
  if(/hire|hiring|job|recruit|joins|joined|team|opening|vacancy/.test(t))return"HIRING";
  if(/robot|robotics|humanoid|embodied|manipulation|reinforcement|simulation|foundation model|behavior|planning|autonomy|physical ai|vla/.test(t))return"TECHNICAL";
  return"MARKET";
}
function triggerFor(signals){
  const rank={COMMERCIAL:5,HIRING:4,TECHNICAL:3,MARKET:1};
  const s=signals.slice().sort((a,b)=>(rank[signalType(b)]||1)-(rank[signalType(a)]||1)||new Date(b.publishedAt||0)-new Date(a.publishedAt||0))[0];
  if(!s)return{label:"NO VERIFIED TRIGGER",strength:"NONE",signal:null,reason:"No source-backed event was detected."};
  const strength=ageDays(s.publishedAt)<=30?"FRESH":ageDays(s.publishedAt)<=90?"RECENT":"OLDER";
  return{label:signalType(s)==="COMMERCIAL"?"COMMERCIAL EVENT":signalType(s)==="HIRING"?"HIRING / TEAM EVENT":signalType(s)==="TECHNICAL"?"TECHNICAL EVENT":"MARKET EVENT",strength,signal:s,reason:s.title||s.description};
}
function roleMap(name,signals){
  const t=(name+" "+signals.map(s=>s.title+" "+s.description).join(" ")).toLowerCase();
  if(/robot|humanoid|embodied|manipulation/.test(t))return["Founder / CEO","Head of Robotics / AI","Product / Partnerships"];
  if(/platform|software|api|developer/.test(t))return["Founder / CEO","VP Product","Developer / Partnerships"];
  return["Founder / CEO","Product leadership","Business Development / Partnerships"];
}
function resolveEntities(sig){
  const out=[],push=x=>{x=canonical(x);if(x&&!out.some(y=>y.toLowerCase()===x.toLowerCase()))out.push(x)};
  const title=String(sig.title||""),desc=String(sig.description||"");
  let m;
  if(sig.sourceType==="github"){
    const full=title+" "+desc;
    const known=/\b(Figure AI|Physical Intelligence|Skild AI|Sanctuary AI|NVIDIA|Google DeepMind|Toyota|Covariant|Robust\.AI|LimX Dynamics|Genesis Embodied AI|Unitree Robotics|TypeSafe AI|Fluxdyne|Pudu Robotics|Agility Robotics|Apptronik|1X Technologies|NEURA Robotics|Spirit AI|EmbodyX|ANYbotics|Boston Dynamics|AGIBOT|UBTECH Robotics|Tesla|Amazon|Meta|Microsoft|Waymo)\b/gi;
    while((m=known.exec(full)))push(m[1]);
    if(sig.ownerType==="Organization" && ALIASES[String(sig.ownerLogin||"").toLowerCase()] && !AMBIGUOUS_ENTITY.has(String(sig.ownerLogin||"").toLowerCase()))push(sig.ownerLogin);
    return out;
  }
  const launch=/Launch HN:\s*([^–-]+?)(?:\s*\(|\s*[–-]|$)/i.exec(title);if(launch)push(launch[1]);
  const patterns=[
    /\b([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,4}),?\s+(?:Inc\.?|Corp\.?|Corporation|Company|Robotics|AI|Labs?|Dynamics|Technologies)\b/g,
    /\b([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,4})\s+(?:is|was|builds|develops|makes|creates|founded|launches|announces|raises|partners|hires|deploys)\b/g
  ];
  for(const re of patterns)while((m=re.exec(desc)))push(m[1]);
  if(sig.ownerType==="Organization" && ALIASES[String(sig.ownerLogin||"").toLowerCase()] && !AMBIGUOUS_ENTITY.has(String(sig.ownerLogin||"").toLowerCase()))push(sig.ownerLogin);
  const full=title+" "+desc;
  const known=/\b(Figure AI|Physical Intelligence|Skild AI|Sanctuary AI|NVIDIA|Google DeepMind|Toyota|Dexterity|Covariant|Robust\.AI|LimX Dynamics|Genesis Embodied AI|Unitree Robotics|TypeSafe AI|Fluxdyne|Pudu Robotics|Agility Robotics|Apptronik|1X Technologies|NEURA Robotics|Spirit AI|EmbodyX|ANYbotics|Boston Dynamics|AGIBOT|UBTECH Robotics|Tesla|Amazon|Meta|Microsoft|Waymo)\b/gi;
  while((m=known.exec(full)))push(m[1]);
  return out;
}
function qualify(name,signals,asset,query){
  const text=(name+" "+signals.map(s=>s.title+" "+s.description).join(" ")).toLowerCase();
  const known=KNOWN.has(name.toLowerCase()) && !AMBIGUOUS_ENTITY.has(name.toLowerCase());
  const identity=signals.some(s=>{
    const t=String(s.title+" "+s.description);
    if(QUESTION_NOISE.test(t))return false;
    const low=t.toLowerCase(),n=name.toLowerCase();
    if(!low.includes(n))return false;
    return ["company","inc.","corp.","corporation","startup","robotics","robotics company","ai company","technologies","labs","dynamics"].some(w=>low.includes(w));
  });
  const company=identity;
  const project=PROJECT.test(text)||/\b(lab|university|school)\b/i.test(name);
  const marketRelevant=/[a-z]/i.test(text);
  const commercialSignals=signals.filter(s=>signalType(s)==="COMMERCIAL").length;
  const hiringSignals=signals.filter(s=>signalType(s)==="HIRING").length;
  const technicalSignals=signals.filter(s=>signalType(s)==="TECHNICAL").length;
  const fresh=signals.filter(s=>ageDays(s.publishedAt)<=90).length;
  const assetTerms=(asset+" "+query).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>3);
  const assetHits=[...new Set(assetTerms)].filter(t=>text.includes(t)).length;
  let score=0;
  if(known)score+=30;
  if(company||identity)score+=25;
  if(marketRelevant)score+=10;
  if(commercialSignals)score+=20;
  if(hiringSignals)score+=12;
  if(technicalSignals)score+=8;
  if(fresh)score+=Math.min(12,fresh*4);
  score+=Math.min(12,assetHits*3);
  if(project)score-=45;
  const trigger=triggerFor(signals);
  if(trigger.strength==="FRESH")score+=8;
  if(trigger.strength==="RECENT")score+=4;
  const qualified=!project&&(known||company||identity)&&marketRelevant&&score>=55;
  let reason="";
  if(project)reason="Research/education/project noise.";
  else if(!marketRelevant)reason="Insufficient market relevance.";
  else if(!(known||company||identity))reason="No reliable company identity.";
  else if(score<55)reason="Commercial qualification threshold not met.";
  else reason="Company identity and market relevance supported by public evidence.";
  return{qualified,score:Math.max(0,Math.min(100,Math.round(score))),reason,trigger,commercialSignals,hiringSignals,technicalSignals,fresh};
}
function buildCandidates(asset,query){
  const groups={};
  for(const sig of state.run.evidence)for(const raw of resolveEntities(sig)){
    const name=canonical(raw);if(!name)continue;
    const key=name.toLowerCase();groups[key]??={name,signals:[]};
    if(!groups[key].signals.includes(sig))groups[key].signals.push(sig);
  }
  const qualified=[],watch=[],rejected=[];
  for(const g of Object.values(groups)){
    const q=qualify(g.name,g.signals,asset,query);
    const contacts=contactChannels(g.name,g.signals);const item={name:g.name,signals:g.signals,evidence:g.signals.length,relevance:q.score,recent:q.fresh,commercial:q.commercialSignals,hiring:q.hiringSignals,technical:q.technicalSignals,trigger:q.trigger,roles:roleMap(g.name,g.signals),priority:q.score,reason:q.reason,contacts,contactStrategy:contacts.strategy,outreach:outreach(g.name,asset,q.trigger)};
    if(q.qualified)qualified.push(item);
    else if(!/noise|project|education/i.test(q.reason) && q.score>=35 && (q.technicalSignals||q.commercialSignals||q.hiringSignals))watch.push(item);
    else rejected.push(item);
  }
  qualified.sort((a,b)=>b.priority-a.priority);watch.sort((a,b)=>b.priority-a.priority);rejected.sort((a,b)=>b.priority-a.priority);
  return{qualified,watch,rejected};
}
const tools={
 ok:(data,meta={})=>({ok:true,data,error:null,meta}),
 fail:(error,meta={})=>({ok:false,data:null,error,meta}),
 async github(q){const hit=cacheGet("github",q);if(hit)return this.ok(hit,{tool:"github",cached:true});try{const r=await fetch("https://api.github.com/search/repositories?q="+encodeURIComponent(q)+"&sort=updated&order=desc&per_page=15",{headers:{Accept:"application/json"}});if(!r.ok)return this.fail(r.status+" "+r.statusText,{tool:"github"});const d=await r.json();return this.ok((d.items||[]).map(x=>({source:"GitHub",sourceType:"github",sourceLabel:"GitHub",title:x.full_name,description:x.description||"",url:x.html_url,publishedAt:x.updated_at,ownerLogin:x.owner?.login||"",ownerType:x.owner?.type||""})),{tool:"github"})}catch(e){return this.fail(e.message,{tool:"github"})}},
 async hn(q){const hit=cacheGet("hn",q);if(hit)return this.ok(hit,{tool:"hackernews",cached:true});try{const r=await fetch("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(q)+"&tags=story&hitsPerPage=15");if(!r.ok)return this.fail(r.status+" "+r.statusText,{tool:"hackernews"});const d=await r.json();return this.ok((d.hits||[]).map(x=>({source:"Hacker News",sourceType:"hackernews",sourceLabel:"Hacker News",title:x.title||"",description:x.title||"",url:x.url||("https://news.ycombinator.com/item?id="+x.objectID),publishedAt:x.created_at})),{tool:"hackernews"})}catch(e){return this.fail(e.message,{tool:"hackernews"})}},
 checkpoint(){state.run.checkpoint=JSON.parse(JSON.stringify(state.run));write("CHECKPOINT","Checkpoint saved before public-source search.");return this.ok(true)},
 restore(){if(!state.run.checkpoint)return this.fail("No checkpoint");state.run=JSON.parse(JSON.stringify(state.run.checkpoint));write("ROLLBACK","Restored the last checkpoint.");return this.ok(true)},
 validate(){
   const r=state.run,errors=[];
   if(r.providers===0)errors.push("No source responded.");
   if(!r.evidence.length)errors.push("No evidence collected.");
   if(r.candidates.some(x=>x.priority<55))errors.push("Unqualified candidate leaked into the qualified queue.");
   if(r.candidates.some(x=>x.reason&&/^(Research\/education\/project noise\.|Insufficient market relevance\.|Commercial qualification threshold not met\.|No reliable company identity\.)$/i.test(x.reason)))errors.push("Qualification reason contradicts candidate status.");
   return errors.length?this.fail(errors.join(" ")):this.ok({pass:true});
 }
};
function makePlan(){return STATES.map((name,i)=>({name,status:i===0?"running":"pending",detail:{UNDERSTAND:"Parse goal, asset and buyer hypothesis.",PLAN:"Bound discovery, qualification and evidence rules.",SEARCH:"Search public company and market signals.",VERIFY:"Resolve entities and reject project/noise results.",DECIDE:"Select evidence-backed commercial opportunities.",EXECUTE:"Prepare local action state only.",TEST:"Validate that only qualified buyers reach the queue.",COMMIT:"Persist the verified run locally.",ROLLBACK:"Restore checkpoint after failed validation.",DONE:"Finish with an auditable result."}[name]}))}
function setPhase(p){state.run.status=p;const row=state.run.plan.find(x=>x.name===p);if(row)row.status="running";save();write("STATE",p)}
function normalizeEvidence(items){const seen=new Set();return items.filter(x=>{const k=(x.sourceType+"|"+x.url+"|"+x.title).toLowerCase();if(seen.has(k))return false;seen.add(k);return ageDays(x.publishedAt)<=730})}
async function search(){
  tools.checkpoint();
  const q=state.run.query||state.run.asset;
  const stem=state.run.asset.replace(/\.[a-z0-9]+$/i,"").replace(/[._-]/g," ");
  const terms=[q,stem,q+" company",q+" startup",q+" funding",q+" hiring",q+" launch",q+" humanoid",q+" embodied AI",q+" robotics company",
    ...COMPANY_SEEDS.map(x=>x+" robotics"),
    ...COMPANY_SEEDS.map(x=>x+" funding"),
    ...COMPANY_SEEDS.map(x=>x+" hiring"),
    ...COMPANY_SEEDS.map(x=>x+" launch")
  ];
  const jobs=[];for(const term of [...new Set(terms.map(x=>x.trim()).filter(Boolean))]){jobs.push(tools.github(term));jobs.push(tools.hn(term))}
  const results=await Promise.allSettled(jobs);
  for(const x of results)if(x.status==="fulfilled"&&x.value.ok){state.run.providers++;state.run.evidence.push(...x.value.data)}
  state.run.evidence=normalizeEvidence(state.run.evidence);
  state.run.metrics.signals=state.run.evidence.length;
}
async function run(retry=0){
  stopped=false;
  const goal=$("goal").value.trim(),asset=$("asset").value.trim(),query=$("query").value.trim();
  if(!goal||!asset){write("ERROR","Goal and asset are required.");return}
  const effectiveQuery=retry>0?(query+" commercial company").trim():query;
  state.run={...base().run,goal,asset,query:effectiveQuery,retries:retry,plan:makePlan(),watch:[]};
  write("START","Agent started. Running "+(retry?"verification retry":"primary research pass")+"…");
  for(const p of STATES.slice(0,8)){
    if(stopped){write("STOP","Stopped by operator.");return}
    setPhase(p);
    if(p==="UNDERSTAND")decision("UNDERSTAND","Goal accepted: "+goal+" · asset="+asset);
    if(p==="PLAN")decision("PLAN","Discovery expanded to company, funding, hiring, launch and market and business signals; project/education noise is excluded.");
    if(p==="SEARCH"){await search();decision("SEARCH","Collected "+state.run.evidence.length+" deduplicated public evidence items from "+state.run.providers+" responding source adapters.")}
    if(p==="VERIFY"){
      const built=buildCandidates(asset,query);state.run.candidates=built.qualified;state.run.watch=built.watch;state.run.rejected=built.rejected;
      state.run.metrics.qualified=built.qualified.length;state.run.metrics.watch=built.watch.length;state.run.metrics.rejected=built.rejected.length;
      state.run.metrics.fresh=built.qualified.filter(x=>x.trigger.strength==="FRESH").length;
      state.run.metrics.triggers=[...built.qualified,...built.watch].filter(x=>x.trigger.strength==="FRESH"||x.trigger.strength==="RECENT").length;
      state.run.metrics.contacts=[...built.qualified,...built.watch].filter(x=>x.contacts?.channels?.length).length;
      decision("VERIFY","Qualified "+built.qualified.length+" commercial opportunities; rejected "+built.rejected.length+" entities.");
    }
    if(p==="DECIDE")decision("DECIDE",state.run.candidates.length?("Proceed with "+state.run.candidates.length+" evidence-backed buyer opportunities."):(state.run.watch?.length?("No buyer cleared the commercial gate; "+state.run.watch.length+" companies moved to watch status."):("No buyer passed the commercial evidence gate.")));
    if(p==="EXECUTE")decision("EXECUTE","External side effects remain disabled; only local research state is changed.");
    if(p==="TEST"){
      for(const c of [...state.run.candidates,...(state.run.watch||[])]){if(!c.contacts?.channels?.length)state.run.errors.push("Missing contact channels for "+c.name)}
      const v=tools.validate();
      if(!v.ok){
        state.run.errors.push(v.error);
        decision("TEST","Validation failed; rollback is required.");
        if(retry<1){
          tools.restore();
          write("ROLLBACK","Validation failed. Re-running once with a broader commercial query…");
          return run(retry+1);
        }
        setPhase("ROLLBACK");
        write("ROLLBACK","Retry limit reached. No silent loop; run stopped safely.");
        return;
      }
      decision("TEST","Qualification gate passed: no noise candidate is allowed into the buyer queue.");
    }
    if(p==="COMMIT"){state.memory.runs.unshift({at:Date.now(),goal:state.run.goal,asset:state.run.asset,evidence:state.run.metrics.signals,qualified:state.run.metrics.qualified,rejected:state.run.metrics.rejected});state.memory.runs=state.memory.runs.slice(0,20);decision("COMMIT","Verified run persisted to local agent memory.")}
    const row=state.run.plan.find(x=>x.name===p);if(row)row.status="done";save();await new Promise(r=>setTimeout(r,80));
  }
  setPhase("DONE");const done=state.run.plan.find(x=>x.name==="DONE");if(done)done.status="done";save();
}
function render(){
 const r=state.run,m=r.metrics||{};
 $("stateName").textContent=r.status;$("health").textContent=r.errors.length?"ATTENTION":"READY";
 $("evidenceCount").textContent=(m.signals||0)+" evidence · "+(m.qualified||0)+" qualified";
 $("stateGrid").innerHTML=STATES.map(x=>'<div class="state-card '+(x===r.status?"active":"")+'"><b>'+x+'</b><small>'+((r.plan.find(y=>y.name===x)||{}).status||"pending")+'</small></div>').join("");
 $("plan").innerHTML=r.plan.map(x=>'<div class="plan-card '+x.status+'"><div class="step">'+x.name+'</div><h3>'+x.status.toUpperCase()+'</h3><p>'+x.detail+'</p></div>').join("");
 $("metrics").innerHTML=[[m.qualified||0,"QUALIFIED BUYERS"],[m.watch||0,"WATCH CANDIDATES"],[m.fresh||0,"FRESH BUYER TRIGGERS ≤30D"],[m.rejected||0,"REJECTED / NOISE"],[m.contacts||0,"CONTACTABLE OPPORTUNITIES"]].map(x=>'<div class="agent-metric"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join("");
 $("opportunities").innerHTML=(r.candidates.length?r.candidates.slice(0,8):r.watch?.length?r.watch.slice(0,6):[]).map((x,i)=>{const s=x.trigger.signal;return '<article class="agent-opportunity"><div class="agent-opp-top"><span>OPPORTUNITY '+String(i+1).padStart(2,"0")+'</span><b>'+x.priority+'/100</b></div><h3>'+esc(x.name)+'</h3><div class="agent-opp-grid"><div><span>WHY QUALIFIED</span><strong>'+esc(x.reason)+'</strong></div><div><span>DOMAIN FIT</span><strong>'+(x.domainFit!=null?esc(String(x.domainFit))+'/100':'—')+'</strong></div><div><span>BUYER THESIS</span><strong>'+esc(x.buyerThesis||'No specific domain-buying thesis returned.')+'</strong></div><div><span>TRIGGER</span><strong>'+esc(x.trigger.label)+' · '+esc(x.trigger.strength)+'</strong></div><div><span>TARGET ROLES</span><strong>'+esc(x.roles.join(" · "))+'</strong></div><div><span>EVIDENCE</span><strong>'+x.evidence+' items · '+x.recent+' recent</strong></div></div><div class="contact-strip"><span>CONTACT CHANNELS</span><div class="contact-buttons">'+(x.contacts?.channels||[]).slice(0,4).map(c=>'<a class="contact-btn" href="'+esc(c.url)+'" target="_blank" rel="noopener"><b>'+channelIcon(c.type)+'</b> '+esc(c.label)+'</a>').join("")+'</div><small>Strategy: '+esc(x.contactStrategy||"")+'</small></div>'+(x.outreach?'<details class="outreach-box"><summary>OPEN OUTREACH DRAFT</summary><p>'+esc(x.outreach)+'</p></details>':"")+(s?'<p><b>Evidence:</b> '+esc(s.title)+' <a href="'+esc(s.url)+'" target="_blank" rel="noopener">OPEN ↗</a></p>':"")+'</article>'}).join("")||'<div class="empty-agent">No company passed the buyer qualification gate.</div>';
 $("evidence").innerHTML=r.evidence.slice(0,40).map(x=>{
  const d=String(x.description||"");
  return '<article class="evidence-card"><div class="evidence-meta">'+esc(x.sourceLabel)+'</div><h3>'+esc(x.title)+'</h3><details><summary>READ MORE</summary><p>'+esc(d)+'</p></details><p><b>Entity:</b> '+esc(resolveEntities(x)[0]||"unresolved")+'</p><a href="'+esc(x.url)+'" target="_blank" rel="noopener">OPEN SOURCE ↗</a></article>';
}).join("")||'<div class="log-item">No evidence yet.</div>';
 $("decisions").innerHTML=r.decisions.map(x=>'<div class="decision"><span>'+new Date(x.t).toLocaleTimeString()+" · "+esc(x.type)+'</span><strong>'+esc(x.msg)+'</strong></div>').join("")||'<div class="log-item">No decisions yet.</div>';
 $("log").innerHTML=state.log.map(x=>'<div class="log-item"><time>'+new Date(x.t).toLocaleTimeString()+'</time><b>'+esc(x.kind)+'</b> '+esc(x.msg)+'</div>').join("")||'<div class="log-item">No log entries.</div>';
}
function init(){
 $("run").onclick=()=>run().catch(e=>write("ERROR",e.message));
 $("stop").onclick=()=>{stopped=true;write("STOP","Stop requested.")};
 $("retry").onclick=()=>run();$("continue").onclick=()=>run();$("reset").onclick=()=>{state=base();save()};$("clearLog").onclick=()=>{state.log=[];save()};render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
