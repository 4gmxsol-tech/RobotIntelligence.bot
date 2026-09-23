module.exports = async (req,res) => {
  res.status(200).json({
    ok:true,service:"robot-intelligence-research-api",version:"0.11",
    live_connectors:{rdap:true,market:false,news:false,buyer:false},
    evidence_required:true
  });
};