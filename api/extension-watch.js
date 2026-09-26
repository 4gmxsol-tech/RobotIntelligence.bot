module.exports=async(req,res)=>{
  return res.status(503).json({
    ok:false,
    error:"extension_watch_temporarily_disabled",
    reason:"infrastructure_safety"
  });
};
