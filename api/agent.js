const {getAgentPlan}=require("./lib/agent");

module.exports=async(req,res)=>{
  if(req.method!=="GET") return res.status(405).json({error:"method_not_allowed"});
  const now=Date.now();
  return res.status(200).json({
    ok:true,
    agent:getAgentPlan(now),
    generated_at:new Date(now).toISOString()
  });
};
