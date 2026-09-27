import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const dir=path.join(root,"agent");
const stateFile=path.join(dir,"state.json");
const runsDir=path.join(dir,"runs");

fs.mkdirSync(runsDir,{recursive:true});

function load(){
  try{return JSON.parse(fs.readFileSync(stateFile,"utf8"))}
  catch{return {version:1,status:"IDLE",runs:[]}}
}

function save(value){
  fs.writeFileSync(stateFile,JSON.stringify(value,null,2)+"\n");
}

function main(){
  const state=load();
  const run={
    id:new Date().toISOString().replace(/[:.]/g,"-"),
    startedAt:new Date().toISOString(),
    states:["UNDERSTAND","PLAN","SEARCH","VERIFY","DECIDE","TEST","COMMIT"],
    goal:process.env.AGENT_GOAL||"Validate RobotIntelligence.bot intelligence pipeline",
    query:process.env.AGENT_QUERY||"humanoid robotics embodied AI robot learning",
    evidence:[],
    candidates:[],
    decision:"PENDING"
  };
  run.checkpoint=JSON.parse(JSON.stringify(state));
  run.decision="READY_FOR_SEARCH";
  state.status="READY_FOR_SEARCH";
  state.lastRun=run.id;
  state.runs=[...(state.runs||[]),{id:run.id,at:run.startedAt,decision:run.decision}].slice(-50);
  save(state);
  fs.writeFileSync(path.join(runsDir,run.id+".json"),JSON.stringify(run,null,2)+"\n");
  console.log(JSON.stringify(run));
}

main();
