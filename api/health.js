module.exports = async (req,res) => {
  res.status(200).json({
    ok:true,service:"robot-intelligence-research-api",version:"0.13",
    live_connectors:{rdap:true,news:true,valuation:true,buyer:Boolean(process.env.APOLLO_API_KEY),buyer_discovery:"apollo_people_search_0_credits",buyer_enrichment:"manual_optional_credit_based",market:false},
    evidence_required:true
  });
};