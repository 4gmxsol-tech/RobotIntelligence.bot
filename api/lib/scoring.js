function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,Math.round(n)));}
function scoreOpportunity({fit=0,signal=0,semantic=0,freshness=0}={}){
  return clamp(fit*.35+signal*.30+semantic*.20+freshness*.15);
}
function classify(score){return score>=90?"high":score>=75?"medium":"watch";}
module.exports={scoreOpportunity,classify};
