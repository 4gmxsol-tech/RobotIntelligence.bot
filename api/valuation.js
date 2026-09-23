const valuation=require("./lib/valuation");

module.exports=async(req,res)=>{
  if(req.method!=="GET" && req.method!=="POST") return res.status(405).json({error:"method_not_allowed"});
  const domain=req.method==="GET" ? req.query?.domain : req.body?.domain;
  if(!domain) return res.status(400).json({error:"domain_required"});
  try{
    const result=await valuation.benchmark(domain);
    return res.status(200).json({ok:true,...result});
  }catch(error){
    return res.status(502).json({ok:false,error:"valuation_provider_error",detail:error.message});
  }
};
