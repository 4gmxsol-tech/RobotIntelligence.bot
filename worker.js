import healthHandler from "./api/health.js";
import scanHandler from "./api/scan.js";
import buyersHandler from "./api/buyers.js";
import contactsHandler from "./api/contacts.js";
import valuationHandler from "./api/valuation.js";
import newsHandler from "./api/news.js";
import agentHandler from "./api/agent.js";
import {getAgentPlan} from "./api/lib/agent.js";
import memoryHandler from "./api/memory.js";
import {AgentMemory} from "./api/lib/agent-memory.js";

const handlers={
  "/api/health":healthHandler,
  "/api/scan":scanHandler,
  "/api/buyers":buyersHandler,
  "/api/contacts":contactsHandler,
  "/api/valuation":valuationHandler,
  "/api/news":newsHandler,
  "/api/agent":agentHandler,
  "/api/memory":memoryHandler
};

function createResponseAdapter(){
  let status=200;
  const headers=new Headers({"content-type":"application/json; charset=utf-8"});
  let body=null;
  return {
    status(code){status=Number(code)||200;return this;},
    setHeader(name,value){headers.set(name,String(value));return this;},
    json(payload){body=JSON.stringify(payload);return this;},
    send(payload){body=typeof payload==="string"?payload:JSON.stringify(payload);return this;},
    end(payload){if(payload!==undefined)body=String(payload);return this;},
    toResponse(){
      return new Response(body??"",{status,headers});
    }
  };
}

async function handleApi(request,env){
  const url=new URL(request.url);
  const handler=handlers[url.pathname];
  if(!handler) return null;

  let body={};
  if(request.method!=="GET" && request.method!=="HEAD"){
    const type=request.headers.get("content-type")||"";
    if(type.includes("application/json")){
      body=await request.json().catch(()=>({}));
    }
  }

  const req={
    method:request.method,
    query:Object.fromEntries(url.searchParams.entries()),
    body,
    headers:Object.fromEntries(request.headers.entries()),
    url:request.url,
    env
  };
  const res=createResponseAdapter();

  try{
    const returned=await handler(req,res);
    if(returned instanceof Response) return returned;
    if(returned && typeof returned.toResponse==="function") return returned.toResponse();
    return res.toResponse();
  }catch(error){
    console.error("API route error",url.pathname,error);
    return new Response(JSON.stringify({
      ok:false,
      error:"internal_server_error",
      detail:String(error?.message||"unknown_error")
    }),{
      status:500,
      headers:{"content-type":"application/json; charset=utf-8"}
    });
  }
}

async function runAgent(controller,env){
  const plan=getAgentPlan(controller.scheduledTime);
  console.log("agent_cycle_started",plan);
  const request=new Request("https://agent.internal/api/scan",{
    method:"POST",
    headers:{"content-type":"application/json","accept":"application/json"},
    body:JSON.stringify({domains:plan.domains})
  });
  const response=await handleApi(request,env);
  if(!response) throw new Error("agent_scan_route_missing");
  const result=await response.json().catch(()=>({}));
  if(!response.ok || result.ok!==true){
    throw new Error("agent_scan_failed:"+JSON.stringify(result));
  }
  const summary={
    mode:plan.mode,
    domains:plan.domains,
    results:result.results?.map(item=>({
      domain:item.domain,
      opportunityScore:item.opportunityScore,
      priority:item.priority,
      evidenceCount:item.evidenceCount,
      newsCount:item.news?.count||0,
      valuationState:item.valuation?.value_state||null
    }))||[]
  };
  const memoryId=env.AGENT_MEMORY.idFromName("portfolio");
  const memory=env.AGENT_MEMORY.get(memoryId);
  await memory.fetch("https://memory.internal/store",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({kind:"agent_cycle",payload:summary})
  });
  console.log("agent_cycle_completed",summary);
  return summary;
}

export {AgentMemory};

export default {
  async fetch(request,env,ctx){
    const apiResponse=await handleApi(request,env);
    if(apiResponse) return apiResponse;
    return env.ASSETS.fetch(request);
  },
  async scheduled(controller,env,ctx){
    if(controller.cron==="*/5 * * * *"){
      console.log("agent_cron_started", {
        cron: controller.cron,
        scheduled_at: new Date(controller.scheduledTime).toISOString()
      });
      try{
        const summary=await runAgent(controller,env);
        console.log("agent_cron_success",summary);
      }catch(error){
        console.error("agent_cron_failed",String(error?.stack||error));
        try{
          const memoryId=env.AGENT_MEMORY.idFromName("portfolio");
          const memory=env.AGENT_MEMORY.get(memoryId);
          await memory.fetch("https://memory.internal/store",{
            method:"POST",
            headers:{"content-type":"application/json"},
            body:JSON.stringify({
              kind:"agent_cycle_error",
              payload:{
                cron:controller.cron,
                scheduled_at:new Date(controller.scheduledTime).toISOString(),
                error:String(error?.message||error)
              }
            })
          });
        }catch(memoryError){
          console.error("agent_error_memory_failed",String(memoryError?.stack||memoryError));
        }
      }
    }
  }
};
