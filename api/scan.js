const connectors=require("./lib/mock-connectors");
const {scoreOpportunity,classify}=require("./lib/scoring");
module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});
  const body=req.body||{}; const domains=Array.isArray(body.domains)?body.domains.map(String).filter(Boolean):[];
  if(!domains.length) return res.status(400).json({error:"domains_required"});
  const results=[];
  for(const domain of domains.slice(0,25)){
    const data=await Promise.all([connectors.rdap(domain),connectors.market(domain),connectors.news(domain),connectors.buyer(domain)]);
    const evidence=data.flatMap(x=>x.evidence||[]);
    const evidenceBacked=evidence.length>0;
    const score=scoreOpportunity({fit:70,signal:evidenceBacked?40:10,semantic:70,freshness:evidenceBacked?50:0});
    results.push({domain,status:"completed",mode:"simulation",opportunityScore:score,priority:classify(score),evidenceCount:evidence.length,connectors:data.map(x=>x.connector),note:"Simulation only. No live provider data was claimed."});
  }
  return res.status(200).json({ok:true,mode:"simulation",evidence_required:true,results});
};
