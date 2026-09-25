const DOMAINS=[
  "RobotIntelligence.bot","RobotEmbodiment.com","HumanoidUI.com","HumanoidBehavior.com",
  "HumanoidPlanning.com","HumanoidIntelligenceAI.com","HumanoidIntelligenceLab.com","HumanoidContext.com",
  "RoboticsBehavior.com","RobotIntelligenceAI.com","RobotIntelligenceLab.com","RobotStack.co",
  "WorldAgents.co","PhysicalManipulation.com","publication.today","Xanvora.com","Czeal.com",
  "ContextShip.com","Dexation.com","Rexation.com","ReasonFlow.xyz","Aividyou.com"
];

const BATCH_SIZE=3;

function getAgentBatch(scheduledTime=Date.now()){
  const slot=Math.floor(Number(scheduledTime)/900000);
  const start=(slot*BATCH_SIZE)%DOMAINS.length;
  return Array.from({length:BATCH_SIZE},(_,i)=>DOMAINS[(start+i)%DOMAINS.length]);
}

function getAgentPlan(scheduledTime=Date.now()){
  return {
    mode:"manual_research_only",
    status:"paused",
    schedule:"manual_only",
    timezone:"UTC",
    batch_size:BATCH_SIZE,
    total_domains:DOMAINS.length,
    domains:getAgentBatch(scheduledTime),
    strategy:"manual execution only; automated research and all-TLD extension monitoring are disabled for infrastructure safety",
    persistence:"sqlite_durable_object",
    next_layer:"disabled_until_manual_reenable"
  };
}

module.exports={DOMAINS,BATCH_SIZE,getAgentBatch,getAgentPlan};
