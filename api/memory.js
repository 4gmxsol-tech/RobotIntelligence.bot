module.exports=async(req,res)=>{
  if(req.method!=="GET") return res.status(405).json({error:"method_not_allowed"});
  if(!req.env?.AGENT_MEMORY){
    return res.status(503).json({ok:false,error:"agent_memory_unavailable"});
  }
  const id=req.env.AGENT_MEMORY.idFromName("portfolio");
  const stub=req.env.AGENT_MEMORY.get(id);
  const url=new URL(req.url);
  const limit=Number(url.searchParams.get("limit")||10);
  const response=await stub.fetch("https://memory.internal/recent?limit="+encodeURIComponent(limit));
  return res.status(response.status).json(await response.json());
};
