import healthHandler from "./api/health.js";
import scanHandler from "./api/scan.js";
import buyersHandler from "./api/buyers.js";
import contactsHandler from "./api/contacts.js";
import valuationHandler from "./api/valuation.js";
import newsHandler from "./api/news.js";

const handlers={
  "/api/health":healthHandler,
  "/api/scan":scanHandler,
  "/api/buyers":buyersHandler,
  "/api/contacts":contactsHandler,
  "/api/valuation":valuationHandler,
  "/api/news":newsHandler
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

async function handleApi(request){
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
    url:request.url
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

export default {
  async fetch(request,env,ctx){
    const apiResponse=await handleApi(request);
    if(apiResponse) return apiResponse;
    return env.ASSETS.fetch(request);
  }
};
