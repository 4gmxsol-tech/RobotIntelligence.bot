const {normalizeEvidence}=require("./evidence");

const BASE="https://api.gdeltproject.org/api/v2/doc/doc";
function cleanQuery(value){return String(value||"").trim().slice(0,180);}
async function search(query,{timespan="30d",maxrecords=10}={}){
  const q=cleanQuery(query);
  if(!q) return {connector:"news",status:"error",query:q,error:"query_required",articles:[],evidence:[]};
  try{
    const url=new URL(BASE);
    url.searchParams.set("query",q);
    url.searchParams.set("mode","artlist");
    url.searchParams.set("format","json");
    url.searchParams.set("timespan",timespan);
    url.searchParams.set("maxrecords",String(Math.min(Math.max(Number(maxrecords)||10,1),25)));
    url.searchParams.set("sort","datedesc");
    const r=await fetch(url,{headers:{"accept":"application/json","user-agent":"RobotIntelligence.bot/0.11"}});
    if(!r.ok) return {connector:"news",status:"error",query:q,http_status:r.status,articles:[],evidence:[]};
    const data=await r.json();
    const articles=(Array.isArray(data.articles)?data.articles:[]).map(a=>({
      title:a.title||null,url:a.url||null,seen_date:a.seendate||null,
      source_domain:a.domain||null,language:a.language||null,source_country:a.sourcecountry||null
    })).filter(a=>a.url);
    const evidence=articles.slice(0,10).map((a,i)=>normalizeEvidence({
      id:"NEWS-"+Date.now()+"-"+i,type:"news_article",source:a.url,observed_at:a.seen_date||new Date().toISOString(),
      confidence:"medium",supports:["fresh_market_coverage",q],status:"observed"
    }));
    return {connector:"news",status:"found",query:q,http_status:r.status,count:articles.length,articles,evidence};
  }catch(error){
    return {connector:"news",status:"error",query:q,error:String(error.message||error),articles:[],evidence:[]};
  }
}
async function searchForDomain(domain){
  const d=String(domain||"").trim();
  const name=d.split(".")[0].replace(/[-_]+/g," ");
  return search('"'+name+'" OR "'+d+'"',{timespan:"30d",maxrecords:10});
}
module.exports={search,searchForDomain,BASE};