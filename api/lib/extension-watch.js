const rdap=require("./rdap");

const WATCH_TLDS=[
  "com","net","org","ai","io","co","dev","app","tech","xyz","bot","me","info","biz"
];

function splitDomain(domain){
  const parts=String(domain||"").trim().toLowerCase().split(".");
  if(parts.length<2)return null;
  return {label:parts.slice(0,-1).join("."),tld:parts.at(-1)};
}

async function check(domain){
  const parsed=splitDomain(domain);
  if(!parsed)return {status:"error",domain,checked:[],registered:[],alerts:[],error:"invalid_domain"};

  const candidates=WATCH_TLDS
    .filter(tld=>tld!==parsed.tld)
    .map(tld=>parsed.label+"."+tld);

  const results=await Promise.all(candidates.map(async candidate=>{
    const result=await rdap.lookup(candidate);
    return {
      domain:candidate,
      tld:candidate.split(".").at(-1),
      status:result.status,
      http_status:result.http_status||null,
      source:result.source||null
    };
  }));

  const registered=results.filter(x=>x.status==="found");
  return {
    status:"completed",
    domain,
    label:parsed.label,
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

module.exports={WATCH_TLDS,check};
