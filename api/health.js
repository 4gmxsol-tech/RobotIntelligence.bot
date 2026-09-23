module.exports = async (req,res) => {
  res.status(200).json({
    ok:true,service:"robot-intelligence-research-api",version:"0.13",
    live_connectors:{rdap:true,news:true,valuation:true,market:false,buyer:false},
    evidence_required:true
  });
};