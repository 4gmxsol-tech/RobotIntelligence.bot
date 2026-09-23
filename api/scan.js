const rdap=require("./lib/rdap");
const news=require("./lib/news");
const valuation=require("./lib/valuation");
const apollo=require("./lib/apollo");
const connectors=require("./lib/mock-connectors");
const {scoreOpportunity,classify}=require("./lib/scoring");

module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});
  const body=req.body||{};
  const domains=Array.isArray(body.domains)?body.domains.map(d=>String(d).trim()).filter(Boolean):[];
  if(!domains.length) return res.status(400).json({error:"domains_required"});
  const results=[];
  for(const domain of domains.slice(0,25)){
    const [rdapResult,newsResult,market,legacyBuyer,valuationResult,buyerResult]=await Promise.all([
      rdap.lookup(domain),news.searchForDomain(domain),connectors.market(domain),connectors.buyer(domain),valuation.benchmark(domain),
      apollo.research(domain,{perPage:10}).catch(error=>({connector:"apollo",status:process.env.APOLLO_API_KEY?"error":"not_configured",error:error.message,organizations:[],people:[],evidence:[]}))
    ]);
    const data=[rdapResult,newsResult,market,legacyBuyer,valuationResult,buyerResult];
    const evidence=data.flatMap(x=>x.evidence||[]);
    const evidenceBacked=evidence.length>0 && evidence.every(e=>e.status==="observed");
    const newsCount=newsResult.count||0;
    const score=scoreOpportunity({
      fit:70,
      signal:newsCount?Math.min(100,35+newsCount*6):10,
      semantic:70,
      freshness:newsCount?80:0
    });
    results.push({
      domain,status:"completed",mode:"rdap+news+valuation-live",
      opportunityScore:score,priority:classify(score),evidenceCount:evidence.length,
      connectors:data.map(x=>({id:x.connector,status:x.status})),
      buyers:{status:buyerResult.status,count:buyerResult.organizations?.length||0,companies:(buyerResult.organizations||[]).slice(0,10),people:(buyerResult.people?.people||buyerResult.people||[]).slice(0,10)},
      rdap:{status:rdapResult.status,http_status:rdapResult.http_status,events:rdapResult.events||[],nameservers:rdapResult.nameservers||[],registrar_handle:rdapResult.registrar_handle||null},
      news:{status:newsResult.status,count:newsCount,articles:(newsResult.articles||[]).slice(0,5)},
      valuation:{status:valuationResult.status,value_state:valuationResult.value_state,benchmark_usd:valuationResult.benchmark_usd,indicative_range_usd:valuationResult.indicative_range_usd,methodology:valuationResult.methodology},
      evidence,
      evidenceBacked,
      note:"RDAP, GDELT News and NameBio benchmarks are live. Apollo buyer discovery is live when APOLLO_API_KEY is configured; paid comparable sales remain separate."
    });
  }
  return res.status(200).json({ok:true,mode:"rdap+news+valuation+buyer-live",evidence_required:true,results});
};