const apollo=require("./lib/apollo");

module.exports=async(req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});
  const domain=String(req.body?.domain||"").trim();
  const maxPeople=Math.min(10,Math.max(1,Number(req.body?.maxPeople||5)));
  if(!domain) return res.status(400).json({error:"domain_required"});
  try{
    const result=await apollo.enrichDecisionMakers(domain,{perPage:5,maxPeople});
    return res.status(200).json({ok:true,...result});
  }catch(error){
    const configured=Boolean(process.env.APOLLO_API_KEY);
    const message=String(error?.message||"");
    return res.status(configured?502:503).json({
      ok:false,
      connector:"apollo_enrichment",
      status:configured?"provider_error":"not_configured",
      error:configured?"apollo_provider_error":"apollo_not_configured",
      detail:message.startsWith("apollo_http_")?message.split(":")[0]:undefined
    });
  }
};
