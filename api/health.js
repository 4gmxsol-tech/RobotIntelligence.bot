module.exports = (req,res) => {
  res.status(200).json({
    ok:true,
    service:"robot-intelligence-research-api",
    version:"0.9",
    live_connectors:false,
    evidence_required:true
  });
};