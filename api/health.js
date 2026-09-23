module.exports = async (req,res) => {
  res.status(200).json({
    ok:true,service:"robot-intelligence-research-api",version:"0.12",
    live_connectors:{rdap:true,market:false,news:true,buyer:false},
    evidence_required:true
  });
};