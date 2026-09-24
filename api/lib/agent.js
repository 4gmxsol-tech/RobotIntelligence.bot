const DOMAINS=[
  "RobotIntelligence.bot","RobotEmbodiment.com","HumanoidUI.com","HumanoidBehavior.com",
  "HumanoidPlanning.com","HumanoidIntelligenceAI.com","HumanoidIntelligenceLab.com","HumanoidContext.com",
  "RoboticsBehavior.com","RobotIntelligenceAI.com","RobotIntelligenceLab.com","RobotStack.co",
  "WorldAgents.co","PhysicalManipulation.com","publication.today","Xanvora.com","Czeal.com",
  "ContextShip.com","Dexation.com","Rexation.com","ReasonFlow.xyz","Aividyou.com"
];

const BATCH_SIZE=3;

function getAgentBatch(scheduledTime=Date.now()){
  const hour=Math.floor(Number(scheduledTime)/3600000);
  const start=(hour*BATCH_SIZE)%DOMAINS.length;
  return Array.from({length:BATCH_SIZE},(_,i)=>DOMAINS[(start+i)%DOMAINS.length]);
}

function getAgentPlan(scheduledTime=Date.now()){
  return {
    mode:"autonomous_research_loop",
    status:"active",
    schedule:"17 * * * *",
    timezone:"UTC",
    batch_size:BATCH_SIZE,
    total_domains:DOMAINS.length,
    domains:getAgentBatch(scheduledTime),
    strategy:"rotate portfolio; scan RDAP + news + valuation; retain evidence-backed outputs; no buyer fabrication",
    persistence:"sqlite_durable_object",
    next_layer:"memory_aware_change_detection"
  };
}

module.exports={DOMAINS,BATCH_SIZE,getAgentBatch,getAgentPlan};
