const news=require("./lib/news");
module.exports=async(req,res)=>{
  if(req.method!=="GET") return res.status(405).json({error:"method_not_allowed"});
  const query=String(req.query?.q||req.query?.query||"").trim();
  if(!query)return res.status(400).json({error:"query_required"});
  const result=await news.search(query,{timespan:req.query?.timespan||"30d",maxrecords:req.query?.maxrecords||10});
  return res.status(result.status==="error"?502:200).json(result);
};