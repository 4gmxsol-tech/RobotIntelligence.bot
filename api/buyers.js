const apollo=require("./lib/apollo");

module.exports=async(req,res)=>{
  if(req.method!=="GET") return res.status(405).json({error:"method_not_allowed"});
  const domain=String(req.query?.domain||"").trim();
  if(!domain) return res.status(400).json({error:"domain_required"});
  try{
    const result=await apollo.research(domain,{perPage:10});
    return res.status(200).json({ok:true,...result});
  }catch(error){
    const configured=Boolean(process.env.APOLLO_API_KEY);
    return res.status(configured?502:503).json({
      ok:false,
      connector:"apollo",
      status:configured?"provider_error":"not_configured",
      error:configured?"apollo_provider_error":"apollo_not_configured"
    });
  }
};
