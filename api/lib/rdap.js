const {normalizeEvidence}=require("./evidence");

const BOOTSTRAP_URL="https://data.iana.org/rdap/dns.json";
const cache={bootstrap:null,loadedAt:0};
const TTL=6*60*60*1000;

function validDomain(domain){
  return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(domain);
}
async function getBootstrap(){
  if(cache.bootstrap && Date.now()-cache.loadedAt<TTL) return cache.bootstrap;
  const r=await fetch(BOOTSTRAP_URL,{headers:{"accept":"application/json"}});
  if(!r.ok) throw new Error("rdap_bootstrap_"+r.status);
  cache.bootstrap=await r.json(); cache.loadedAt=Date.now(); return cache.bootstrap;
}
function findBase(bootstrap,tld){
  const services=bootstrap.services||[];
  const wanted=tld.toLowerCase();
  const row=services.find(s=>Array.isArray(s[0])&&s[0].some(v=>String(v).toLowerCase()===wanted));
  return row?.[1]?.[0]||null;
}
async function lookup(domain){
  domain=String(domain||"").trim().toLowerCase();
  if(!validDomain(domain)) return {connector:"rdap",status:"error",domain,error:"invalid_domain",evidence:[]};
  try{
    const tld=domain.split(".").pop();
    const bootstrap=await getBootstrap();
    const base=findBase(bootstrap,tld);
    if(!base) return {connector:"rdap",status:"unsupported",domain,error:"rdap_server_not_found",evidence:[]};
    const url=base.replace(/\/$/,"")+"/domain/"+encodeURIComponent(domain);
    const r=await fetch(url,{headers:{"accept":"application/rdap+json, application/json"}});
    if(r.status===404) return {connector:"rdap",status:"not_found",domain,http_status:404,source:url,evidence:[normalizeEvidence({type:"domain_status",source:url,confidence:"high",supports:["domain_not_found"],status:"observed"})]};
    if(!r.ok) return {connector:"rdap",status:"error",domain,http_status:r.status,source:url,evidence:[]};
    const data=await r.json();
    const events=Array.isArray(data.events)?data.events.map(e=>({eventAction:e.eventAction,eventDate:e.eventDate})): [];
    const nameservers=Array.isArray(data.nameservers)?data.nameservers.map(n=>n.ldhName||n.unicodeName).filter(Boolean):[];
    const registrar=(data.entities||[]).find(e=>Array.isArray(e.roles)&&e.roles.includes("registrar"));
    return {connector:"rdap",status:"found",domain,http_status:r.status,source:url,handle:data.handle||null,statuses:data.status||[],events,nameservers,registrar_handle:registrar?.handle||null,evidence:[normalizeEvidence({type:"rdap_domain",source:url,confidence:"high",supports:["registration_status","domain_events","nameservers"] ,status:"observed"})]};
  }catch(error){
    return {connector:"rdap",status:"error",domain,error:String(error.message||error),evidence:[]};
  }
}
module.exports={lookup,BOOTSTRAP_URL};