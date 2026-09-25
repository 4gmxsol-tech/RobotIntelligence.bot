const rdap=require("./lib/rdap");const news=require("./lib/news");const valuation=require("./lib/valuation");const connectors=require("./lib/mock-connectors");const {scoreOpportunity,classify}=require("./lib/scoring");const extensionWatch=require("./lib/extension-watch");

module.exports=async(req,res)=>{
  if(req.method!=="POST")return res.status(405).json({error:"method_not_allowed"});
  const body=req.body||{};
  const domains=Array.isArray(body.domains)?body.domains.map(d=>String(d).trim()).filter(Boolean):[];
  if(!domains.length)return res.status(400).json({error:"domains_required"});

  const results=[];
  for(const domain of domains.slice(0,25)){
    const [rdapResult,newsResult,market,legacyBuyer,valuationResult,extensionResult]=await Promise.all([
      rdap.lookup(domain),
      news.searchForDomain(domain),
      connectors.market(domain),
      connectors.buyer(domain),
      valuation.benchmark(domain),
      body.enableExtensionWatch===true ? extensionWatch.check(domain,{extensions:body.extensions,concurrency:40}) : Promise.resolve({status:"disabled",reason:"infrastructure_safety",checked:0,registered:[],alerts:[]})
    ]);
    const data=[rdapResult,newsResult,market,legacyBuyer,valuationResult];
    const evidence=data.flatMap(x=>x.evidence||[]);
    const evidenceBacked=evidence.length>0&&evidence.every(e=>e.status==="observed");
    const newsCount=newsResult.count||0;
    const score=scoreOpportunity({
      fit:70,
      signal:newsCount?Math.min(100,35+newsCount*6):10,
      semantic:70,
      freshness:newsCount?80:0
    });
    results.push({
      domain,
      status:"completed",
      mode:"rdap+news+valuation+all-tld-extension-watch",
      opportunityScore:score,
      priority:classify(score),
      evidenceCount:evidence.length,
      connectors:data.map(x=>({id:x.connector,status:x.status})),
      buyers:{status:"public_research_only",count:0,companies:[],people:[]},
      rdap:{
        status:rdapResult.status,
        http_status:rdapResult.http_status,
        events:rdapResult.events||[],
        nameservers:rdapResult.nameservers||[],
        registrar_handle:rdapResult.registrar_handle||null
      },
      news:{
        status:newsResult.status,
        count:newsCount,
        articles:(newsResult.articles||[]).slice(0,5)
      },
      extensionWatch:extensionResult,
      valuation:{
        status:valuationResult.status,
        value_state:valuationResult.value_state,
        benchmark_usd:valuationResult.benchmark_usd,
        indicative_range_usd:valuationResult.indicative_range_usd,
        methodology:valuationResult.methodology
      },
      evidence,
      evidenceBacked,
      note:"RDAP, GDELT News and NameBio benchmarks are live. Apollo is optional and disabled; buyer research uses evidence-backed public research until a permitted connector is available."
    });
  }

  if(req.env?.AGENT_MEMORY && body.persist===true){
    try{
      const memoryId=req.env.AGENT_MEMORY.idFromName("portfolio");
      const memory=req.env.AGENT_MEMORY.get(memoryId);
      const memoryResults=[];
      for(const item of results){
        const response=await memory.fetch("https://memory.internal/upsert-domain",{
          method:"POST",
          headers:{"content-type":"application/json"},
          body:JSON.stringify({domain:item.domain,payload:item})
        });
        memoryResults.push(await response.json());
      }
      await memory.fetch("https://memory.internal/store",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
          kind:"agent_cycle",
          payload:{
            domains:results.map(x=>x.domain),
            results:results.map((x,index)=>({
              domain:x.domain,
              opportunityScore:x.opportunityScore,
              evidenceCount:x.evidenceCount,
              newsCount:x.news.count,
              extensionAlerts:x.extensionWatch?.alerts?.length||0,
              memory:memoryResults[index]?.memory||null
            }))
          }
        })
      });
    }catch(memoryError){
      console.error("scan_memory_persist_failed",String(memoryError?.stack||memoryError));
    }
  }

  return res.status(200).json({
    ok:true,
    mode:"rdap+news+valuation+all-tld-extension-watch",
    evidence_required:true,
    persisted:body.persist===true,
    results
  });
};
