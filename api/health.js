module.exports = async (req,res) => {
  res.status(200).json({
    ok:true,service:"robot-intelligence-research-api",version:"0.13",
    live_connectors:{rdap:true,news:true,valuation:true,buyer:Boolean(process.env.APOLLO_API_KEY),market:false},
    evidence_required:true
  });
};