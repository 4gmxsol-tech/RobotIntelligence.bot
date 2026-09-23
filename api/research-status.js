module.exports=async(req,res)=>{
  if(req.method!=="GET") return res.status(405).json({error:"method_not_allowed"});
  return res.status(200).json({ok:true,mode:"simulation",queue:"ready",live_connectors:false,message:"Research orchestration endpoint is ready; provider credentials are not configured."});
};
