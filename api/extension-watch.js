const extensionWatch=require("./lib/extension-watch");

module.exports=async(req,res)=>{
  if(req.method!=="GET" && req.method!=="POST") {
    return res.status(405).json({error:"method_not_allowed"});
  }
  const domain=String(req.query?.domain || req.body?.domain || "").trim();
  if(!domain) return res.status(400).json({ok:false,error:"domain_required"});
  const result=await extensionWatch.check(domain);
  return res.status(200).json({
    ok:true,
    ...result,
    notification_count:result.alerts.length,
    message:result.alerts.length
      ? "Registration detected for one or more watched extensions."
      : "No registration detected in the watched extension set."
  });
};
