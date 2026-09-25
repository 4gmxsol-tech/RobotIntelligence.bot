const extensionWatch=require("./lib/extension-watch");

module.exports=async(req,res)=>{
  return res.status(503).json({ok:false,error:"extension_watch_temporarily_disabled",reason:"infrastructure_safety"});
/*
  if(req.method!=="GET" && req.method!=="POST") {
    return res.status(405).json({error:"method_not_allowed"});
  }
  const domain=String(req.query?.domain || req.body?.domain || "").trim();
  if(!domain) return res.status(400).json({ok:false,error:"domain_required"});
  const result=await extensionWatch.check(domain,{extensions:req.query?.extensions || req.body?.extensions});
  return res.status(200).json({
    ok:true,
    ...result,
    notification_count:result.alerts.length,
    message:result.alerts.length
      ? "Registration detected for one or more current TLDs."
      : "No registration detected in the current IANA TLD inventory."
  });
};

*/
