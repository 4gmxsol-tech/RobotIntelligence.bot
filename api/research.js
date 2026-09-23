module.exports = async (req,res) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({error:"method_not_allowed"});
  }
  const input = req.method === "GET" ? req.query : (req.body || {});
  const domain = String(input.domain || "").trim();
  if (!domain) return res.status(400).json({error:"domain_required"});
  return res.status(200).json({
    job:{id:"JOB-"+Date.now(),domain,status:"queued"},
    connectors:["rdap","market","news","buyer"],
    evidence:"required",
    note:"Configure server-side provider credentials before enabling live research."
  });
};