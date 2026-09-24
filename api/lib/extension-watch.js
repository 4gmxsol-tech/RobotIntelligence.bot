const rdap=require("./rdap");

const IANA_TLD_URL="https://data.iana.org/TLD/tlds-alpha-by-domain.txt";
const CACHE_TTL_MS=6*60*60*1000;
let tldCache={expiresAt:0,tlds:[]};
const DEFAULT_CONCURRENCY=40;

function splitDomain(domain){
  const parts=String(domain||"").trim().toLowerCase().split(".");
  if(parts.length<2)return null;
  return {label:parts.slice(0,-1).join("."),tld:parts.at(-1)};
}

async function getAllTlds(){
  if(tldCache.tlds.length && Date.now()<tldCache.expiresAt)return tldCache.tlds;
  const response=await fetch(IANA_TLD_URL,{headers:{"accept":"text/plain"}});
  if(!response.ok)throw new Error("iana_tld_list_unavailable");
  const text=await response.text();
  const tlds=text.split(/\r?\n/)
    .map(line=>line.trim().toLowerCase())
    .filter(line=>line && !line.startsWith("#") && /^[a-z0-9-]+$/.test(line));
  if(!tlds.length)throw new Error("iana_tld_list_empty");
  tldCache={expiresAt:Date.now()+CACHE_TTL_MS,tlds:[...new Set(tlds)]};
  return tldCache.tlds;
}

function normalizeExtraTlds(value){
  const raw=Array.isArray(value)?value:String(value||"").split(/[\s,;]+/);
  return [...new Set(raw.map(x=>String(x).trim().toLowerCase().replace(/^\./,"")).filter(x=>/^[a-z0-9-]+$/.test(x)))];
}

async function check(domain,options={}){
  const parsed=splitDomain(domain);
  if(!parsed)return {status:"error",domain,checked:0,registered:[],alerts:[],error:"invalid_domain"};

  const allTlds=await getAllTlds();
  const extraTlds=normalizeExtraTlds(options.extensions);
  const tlds=[...new Set([...allTlds,...extraTlds])].filter(tld=>tld!==parsed.tld);
  const concurrency=Math.max(5,Math.min(Number(options.concurrency)||DEFAULT_CONCURRENCY,100));
  const results=[];

  for(let i=0;i<tlds.length;i+=concurrency){
    const batch=tlds.slice(i,i+concurrency);
    const batchResults=await Promise.all(batch.map(async tld=>{
      const candidate=parsed.label+"."+tld;
      try{
        const result=await rdap.lookup(candidate);
        return {
          domain:candidate,
          tld,
          status:result.status,
          http_status:result.http_status||null,
          source:result.source||null,
          events:result.events||[]
        };
      }catch(error){
        return {domain:candidate,tld,status:"error",http_status:null,source:null,error:String(error?.message||error)};
      }
    }));
    results.push(...batchResults);
  }

  const registered=results.filter(x=>x.status==="found");
  return {
    status:"completed",
    domain,
    label:parsed.label,
    current_extension:"."+parsed.tld,
    source:"IANA TLD list + RDAP",
    tld_source:IANA_TLD_URL,
    tld_count:tlds.length,
    checked:results.length,
    registered,
    alerts:registered.map(x=>({
      type:"extension_registration_detected",
      domain,
      registered_variant:x.domain,
      extension:"."+x.tld,
      source:x.source,
      detected_at:new Date().toISOString()
    }))
  };
}

module.exports={check,getAllTlds,IANA_TLD_URL};
