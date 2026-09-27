import fs from "node:fs";
import path from "node:path";

const root=process.cwd(), dir=path.join(root,"agent"), stateFile=path.join(dir,"state.json"), runsDir=path.join(dir,"runs");
fs.mkdirSync(runsDir,{recursive:true});
const ASSET=process.env.AGENT_ASSET||"robotembodiment.com";
const QUERY=process.env.AGENT_QUERY||"humanoid robotics embodied AI robot learning";
const GOAL=process.env.AGENT_GOAL||"Find qualified buyers for robotembodiment.com";
const ALIASES={"figure":"Figure AI","figure ai":"Figure AI","physical intelligence":"Physical Intelligence","skild ai":"Skild AI","sanctuary ai":"Sanctuary AI","nvidia":"NVIDIA","google deepmind":"Google DeepMind","toyota":"Toyota","dexterity":"Dexterity","covariant":"Covariant","robust.ai":"Robust.AI","unitree":"Unitree Robotics","limx dynamics":"LimX Dynamics","pudu robotics":"Pudu Robotics","agility robotics":"Agility Robotics","apptronik":"Apptronik","1x":"1X Technologies","neura robotics":"NEURA Robotics","spirit ai":"Spirit AI","anybotics":"ANYbotics","boston dynamics":"Boston Dynamics","agibot":"AGIBOT","ubtech":"UBTECH Robotics","tesla":"Tesla","amazon":"Amazon","meta":"Meta","microsoft":"Microsoft","waymo":"Waymo"};
const KNOWN=new Set(Object.values(ALIASES).map(x=>x.toLowerCase()));
const COMPANY_SEEDS=["Figure AI","Physical Intelligence","Skild AI","Sanctuary AI","Agility Robotics","Apptronik","1X Technologies","NEURA Robotics","Unitree Robotics","Boston Dynamics","Dexterity","Covariant","Robust.AI","NVIDIA","Google DeepMind","Pudu Robotics","ANYbotics","UBTECH Robotics","LimX Dynamics","Tesla"];\nconst BUYER_DISCOVERY=["robot embodiment startup","embodied AI startup robotics","humanoid foundation model company","robot learning company","robot manipulation startup","physical AI startup robotics","VLA robotics startup","robotics foundation model startup","humanoid robot startup funding","robotics startup raised funding","humanoid robotics hiring","robotics company partnership","robotics company deployment","robotics company contract","robotics company launch"];
const PROJECT=/\b(portfolio|student|internship|course|tutorial|workshop|assignment|simulator|demo|personal project|textbook|book|notes|university|school|classroom)\b/i;
const NOISE=/^(physical|physical ai|embodied|embodied ai|robotics|robot|ai|artificial intelligence|machine learning|open source|github|workshop|simulator|tutorial|demo|project|research|engineering|learning|lab)$/i;
const norm=v=>String(v||"").replace(/[-_]+/g," ").replace(/\s+/g," ").trim();
const age=v=>Math.max(0,(Date.now()-new Date(v||0).getTime())/86400000);
const CONTACT_SITES={"Figure AI":"figure.ai","Physical Intelligence":"physicalintelligence.company","Skild AI":"skild.ai","Sanctuary AI":"sanctuary.ai","Agility Robotics":"agilityrobotics.com","Apptronik":"apptronik.com","1X Technologies":"1x.tech","NEURA Robotics":"neura-robotics.com","Unitree Robotics":"unitree.com","Boston Dynamics":"bostondynamics.com","Dexterity":"dexterity.ai","Covariant":"covariant.ai","Robust.AI":"robust.ai","NVIDIA":"nvidia.com","Google DeepMind":"deepmind.google","Pudu Robotics":"pudurobotics.com","ANYbotics":"anybotics.com","UBTECH Robotics":"ubtrobot.com","LimX Dynamics":"limxdynamics.com","Tesla":"tesla.com"};
function channels(name,signals){
 const lower=name.toLowerCase(),host=CONTACT_SITES[name],slug=lower.replace(/&/g,"and").replace(/[^a-z0-9]+/g,"");
 const text=signals.map(s=>(s.title+" "+s.description+" "+(s.url||""))).join(" ");
 const email=(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig)||[])[0];
 const out=[];
 if(email)out.push({type:"Email",label:email,url:"mailto:"+email,confidence:99});
 if(host)out.push({type:"Website",label:"Website",url:"https://"+host,confidence:96});
 out.push({type:"LinkedIn",label:"LinkedIn",url:"https://www.linkedin.com/company/"+slug,confidence:68});
 out.push({type:"X",label:"X",url:"https://x.com/"+slug,confidence:62});
 out.push({type:"GitHub",label:"GitHub",url:"https://github.com/"+slug,confidence:48});
 return {channels:out,strategy:email?"EMAIL FIRST":host?"WEBSITE → LINKEDIN / X":"LINKEDIN → X → WEBSITE"};
}
function canonical(v){const raw=norm(v),k=raw.toLowerCase();if(ALIASES[k])return ALIASES[k];const n=raw.replace(/^the\s+/i,"");return !n||n.length<3||n.length>70||NOISE.test(n)||PROJECT.test(n)?"":n}
function type(s){const t=(s.title+" "+s.description).toLowerCase();if(/fund|raised|funding|investment|acqui|partner|partnership|launch|contract|customer|order|expansion|deployment|commercial/.test(t))return"COMMERCIAL";if(/hire|hiring|job|recruit|joins|team|vacancy/.test(t))return"HIRING";if(/robot|robotics|humanoid|embodied|manipulation|reinforcement|simulation|foundation model|behavior|planning|autonomy|physical ai|vla/.test(t))return"TECHNICAL";return"MARKET"}
function entities(s){const out=[],push=x=>{x=canonical(x);if(x&&!out.includes(x))out.push(x)};let m;const full=(s.title||"")+" "+(s.description||"");const known=/\b(Figure AI|Physical Intelligence|Skild AI|Sanctuary AI|NVIDIA|Google DeepMind|Toyota|Dexterity|Covariant|Robust\.AI|LimX Dynamics|Pudu Robotics|Agility Robotics|Apptronik|1X Technologies|NEURA Robotics|Spirit AI|ANYbotics|Boston Dynamics|AGIBOT|UBTECH Robotics|Tesla|Amazon|Meta|Microsoft|Waymo)\b/gi;while((m=known.exec(full)))push(m[1]);const pats=[/\b([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,4}),?\s+(?:Inc\.?|Corp\.?|Corporation|Company|Robotics|AI|Labs?|Dynamics|Technologies)\b/g,/\b([A-Z][A-Za-z0-9&.\-]+(?:\s+[A-Z][A-Za-z0-9&.\-]+){0,4})\s+(?:is|was|builds|develops|founded|launches|raises|partners|hires|deploys)\b/g];for(const re of pats)while((m=re.exec(full)))push(m[1]);if(s.ownerType==="Organization" && ALIASES[String(s.ownerLogin||"").toLowerCase()])push(s.ownerLogin);return out}
function qualify(name,signals){const text=(name+" "+signals.map(s=>s.title+" "+s.description).join(" ")).toLowerCase(),known=KNOWN.has(name.toLowerCase()),company=/\b(company|inc\.?|corp\.?|startup|founded|funded|funding|enterprise|product|platform|commercial|robotics company|ai company)\b/i.test(text),robotics=/robot|robotics|humanoid|embodied|physical ai|manipulation|autonomy|robot learning/i.test(text),project=PROJECT.test(text)||/\b(lab|university|school)\b/i.test(name),commercial=signals.filter(s=>type(s)==="COMMERCIAL").length,hiring=signals.filter(s=>type(s)==="HIRING").length,fresh=signals.filter(s=>age(s.publishedAt)<=90).length;let score=(known?30:0)+(company?25:0)+(robotics?15:0)+(commercial?20:0)+(hiring?12:0)+Math.min(12,fresh*4);if(project)score-=45;return{qualified:!project&&(known||company)&&robotics&&score>=55,score:Math.max(0,Math.min(100,Math.round(score))),reason:project?"Research/education/project noise.":!robotics?"Insufficient robotics relevance.":!(known||company)?"No reliable company identity.":score<55?"Commercial threshold not met.":"Company identity and robotics relevance supported.",commercial,hiring,fresh}}
async function json(url,headers={}){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{const r=await fetch(url,{headers,signal:ctl.signal});if(!r.ok)throw new Error(r.status+" "+r.statusText);return r.json()}
  finally{clearTimeout(timer)}
}
async function gdelt(q){
  const u="https://api.gdeltproject.org/api/v2/doc/doc?query="+encodeURIComponent(q)+"&mode=artlist&format=json&maxrecords=25&timespan=3months&sort=datedesc";
  const d=await json(u);const rows=d.articles||d.results||[];
  return rows.map(x=>({source:"GDELT",sourceType:"gdelt",url:x.url||x.url_mobile||"",title:x.title||"",description:x.title||"",publishedAt:x.seendate||x.date||"",domain:x.domain||""})).filter(x=>x.url&&x.title);
}
async function openaiReview(items){
  const key=process.env.OPENAI_API_KEY;if(!key||!items.length)return [];
  const model=process.env.OPENAI_MODEL||"gpt-5.6-luna";
  const payload=items.slice(0,40).map((x,i)=>({i,name:x.name,signals:x.signals.slice(0,5).map(s=>({source:s.source,title:s.title,description:s.description,url:s.url,publishedAt:s.publishedAt}))}));
  const body={model,store:false,input:[
    {role:"developer",content:"You are the verification layer for a buyer-intelligence system. Review only the supplied public evidence. Do not invent companies, facts, or buyers. A repository owner, project name, book, lab, university, demo, or generic noun is not automatically a commercial company. Prefer explicit company identity and robotics/embodied-AI relevance. Return ONLY a JSON object with a results array."},
    {role:"user",content:"For each item return {i,canonicalName,companyIdentity,roboticsRelevance,commercialIntent,confidence,reason}. canonicalName must be the actual company name only when supported; otherwise empty string. companyIdentity, roboticsRelevance and commercialIntent are booleans. confidence is 0-100. Evidence:\n"+JSON.stringify(payload)}
  ],text:{format:{type:"json_object"}},max_output_tokens:5000};
  try{
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);
    try{
      const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify(body),signal:ctl.signal});
      if(!r.ok)throw new Error("OpenAI "+r.status+" "+r.statusText);
      const d=await r.json(),parsed=JSON.parse(d.output_text||"{}");
      return Array.isArray(parsed.results)?parsed.results:[];
    }finally{clearTimeout(timer)}
  }catch(e){console.warn("OpenAI review skipped:",e.name==="AbortError"?"timeout":e.message);return []}
}
async function search(q){
  const [g,h,d]=await Promise.allSettled([
    json("https://api.github.com/search/repositories?q="+encodeURIComponent(q)+"&sort=updated&order=desc&per_page=15",{accept:"application/vnd.github+json"}),
    json("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(q)+"&tags=story&hitsPerPage=15"),
    gdelt(q)
  ]);
  const out=[];
  if(g.status==="fulfilled")for(const x of g.value.items||[])out.push({source:"GitHub",sourceType:"github",url:x.html_url,title:x.full_name,description:x.description||"",publishedAt:x.updated_at,ownerLogin:x.owner?.login||"",ownerType:x.owner?.type||""});
  if(h.status==="fulfilled")for(const x of h.value.hits||[])out.push({source:"Hacker News",sourceType:"hackernews",url:x.url||("https://news.ycombinator.com/item?id="+x.objectID),title:x.title||"",description:x.title||"",publishedAt:x.created_at});
  if(d.status==="fulfilled")out.push(...d.value);
  return out
}
function load(){try{return JSON.parse(fs.readFileSync(stateFile,"utf8"))}catch{return{version:2,status:"IDLE",runs:[]}}}
async function main(){const startedAt=new Date().toISOString(),state=load(),terms=[QUERY,ASSET.replace(/\.[a-z0-9]+$/i,"").replace(/[._-]/g," "),QUERY+" company",QUERY+" funding",QUERY+" hiring",QUERY+" launch",QUERY+" humanoid",QUERY+" embodied AI",QUERY+" robotics company",...COMPANY_SEEDS.map(x=>x+" robotics"),...COMPANY_SEEDS.map(x=>x+" funding"),...COMPANY_SEEDS.map(x=>x+" hiring"),...COMPANY_SEEDS.map(x=>x+" launch")],raw=[];
const uniqueTerms=[...new Set([...terms,...BUYER_DISCOVERY])];
for(let i=0;i<uniqueTerms.length;i+=16){
  const batch=uniqueTerms.slice(i,i+16);
  console.log("SEARCH_BATCH",Math.floor(i/16)+1,"terms",batch.length);
  const results=await Promise.allSettled(batch.map(q=>search(q)));
  for(const r of results)if(r.status==="fulfilled")raw.push(...r.value);
}
const seen=new Set(),evidence=raw.filter(x=>age(x.publishedAt)<=730).filter(x=>{const k=x.source+"|"+x.url;if(seen.has(k))return false;seen.add(k);return true});const groups={};for(const s of evidence)for(const n of entities(s)){const k=n.toLowerCase();groups[k]??={name:n,signals:[]};groups[k].signals.push(s)}const candidates=[],watch=[],rejected=[];const groupList=Object.values(groups);
console.log("SEARCH_COMPLETE","signals",evidence.length,"entities",groupList.length);
const ai=await openaiReview(groupList);
console.log("OPENAI_COMPLETE","reviews",ai.length);
const aiMap=new Map(ai.map(x=>[Number(x.i),x]));
for(const [gi,g] of groupList.entries()){
  const review=aiMap.get(gi);
  if(review&&review.confidence>=80){
    if(review.canonicalName&&review.companyIdentity)g.name=review.canonicalName;
    if(review.companyIdentity===false)g.aiRejected=true;
    if(review.roboticsRelevance===false)g.aiRoboticsRejected=true;
  }
  const q=qualify(g.name,g.signals);
  const trigger=g.signals.slice().sort((a,b)=>(({COMMERCIAL:5,HIRING:4,TECHNICAL:3,MARKET:1}[type(b)]||1)-({COMMERCIAL:5,HIRING:4,TECHNICAL:3,MARKET:1}[type(a)]||1))||new Date(b.publishedAt)-new Date(a.publishedAt))[0];
  const contacts=channels(g.name,g.signals);
  const item={name:g.name,score:q.score,evidence:g.signals.length,commercial:q.commercial,hiring:q.hiring,recent:q.fresh,trigger,reason:q.reason,contacts,contactStrategy:contacts.strategy,roles:/robot|humanoid|embodied|manipulation/i.test(g.name+" "+g.signals.map(s=>s.title+" "+s.description).join(" "))?["Founder / CEO","Head of Robotics / AI","Product / Partnerships"]:["Founder / CEO","Product leadership","Business Development / Partnerships"]};
  if(q.qualified&&!g.aiRejected&&!g.aiRoboticsRejected)candidates.push(item);
  else if(!g.aiRejected&&!g.aiRoboticsRejected&&!/noise|project|education/i.test(q.reason)&&q.score>=35&&(q.commercial||q.hiring||g.signals.some(s=>type(s)==="TECHNICAL")))watch.push(item);
  else rejected.push(item);
}
candidates.sort((a,b)=>b.score-a.score);watch.sort((a,b)=>b.score-a.score);const run={id:startedAt.replace(/[:.]/g,"-"),startedAt,goal:GOAL,asset:ASSET,query:QUERY,evidence,candidates,watch,rejected,metrics:{signals:evidence.length,qualified:candidates.length,watch:watch.length,rejected:rejected.length,contacts:[...candidates,...watch].filter(x=>x.contacts?.channels?.length).length,fresh:candidates.filter(x=>age(x.trigger?.publishedAt)<=30).length},decision:candidates.length?"QUALIFIED_OPPORTUNITIES_FOUND":"NO_QUALIFIED_BUYER"};run.checkpoint=JSON.parse(JSON.stringify(state));state.version=2;state.status="DONE";state.lastRun=run.id;state.runs=[...(state.runs||[]),{id:run.id,at:startedAt,decision:run.decision,qualified:candidates.length,rejected:rejected.length}].slice(-50);fs.writeFileSync(stateFile,JSON.stringify(state,null,2)+"\n");fs.writeFileSync(path.join(runsDir,run.id+".json"),JSON.stringify(run,null,2)+"\n");console.log(JSON.stringify({decision:run.decision,metrics:run.metrics,candidates:candidates.slice(0,10)}))}
const watchdog=setTimeout(()=>{
  console.error("AGENT_WATCHDOG_TIMEOUT");
  try{const s=load();s.status="TIMEOUT";s.error="Runner exceeded 150 seconds";fs.writeFileSync(stateFile,JSON.stringify(s,null,2)+"\\n")}catch{}
  process.exit(2);
},150000);
main().then(()=>clearTimeout(watchdog)).catch(e=>{clearTimeout(watchdog);console.error(e);process.exitCode=1});
