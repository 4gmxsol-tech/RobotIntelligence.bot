const rdap=require("./lib/rdap");
const connectors=require("./lib/mock-connectors");
const {scoreOpportunity,classify}=require("./lib/scoring");

module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});
  const body=req.body||{};
  const domains=Array.isArray(body.domains)?body.domains.map(d=>String(d).trim()).filter(Boolean):[];
  if(!domains.length) return res.status(400).json({error:"domains_required"});
  const results=[];
  for(const domain of domains.slice(0,25)){
    const [rdapResult,market,news,buyer]=await Promise.all([
      rdap.lookup(domain),connectors.market(domain),connectors.news(domain),connectors.buyer(domain)
    ]);
    const data=[rdapResult,market,news,buyer];
    const evidence=data.flatMap(x=>x.evidence||[]);
    const evidenceBacked=evidence.length>0 && evidence.every(e=>e.status==="observed");
    const score=scoreOpportunity({fit:70,signal:evidenceBacked?40:10,semantic:70,freshness:evidenceBacked?50:0});
    results.push({
      domain,status:"completed",mode:"rdap-live",
      opportunityScore:score,priority:classify(score),evidenceCount:evidence.length,
      connectors:data.map(x=>({id:x.connector,status:x.status})),
      rdap:{status:rdapResult.status,http_status:rdapResult.http_status,events:rdapResult.events||[],nameservers:rdapResult.nameservers||[],registrar_handle:rdapResult.registrar_handle||null},
      evidence,
      note:"RDAP is live; market/news/buyer connectors remain unconfigured."
    });
  }
  return res.status(200).json({ok:true,mode:"rdap-live",evidence_required:true,results});
};