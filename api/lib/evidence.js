function now(){return new Date().toISOString();}
function normalizeEvidence(input={}){
  return {
    id:String(input.id||"EV-"+Date.now()),
    type:String(input.type||"research"),
    source:String(input.source||"internal"),
    observed_at:String(input.observed_at||now()),
    confidence:input.confidence||"medium",
    supports:Array.isArray(input.supports)?input.supports:[],
    status:input.status||"observed"
  };
}
function requireEvidence(records=[]){return records.filter(Boolean).every(r=>r.source&&r.source!=="unknown");}
module.exports={normalizeEvidence,requireEvidence};
