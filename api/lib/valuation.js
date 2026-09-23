const BASE_URL="https://api.namebio.com";

function cleanDomain(domain){
  const value=String(domain||"").trim().toLowerCase();
  if(!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) throw new Error("invalid_domain");
  return value;
}

function tokensFor(domain){
  const sld=domain.split(".")[0].toLowerCase().replace(/[^a-z0-9]+/g," ");
  const dictionary=["robot","intelligence","humanoid","behavior","planning","context","embodiment","robotics","agents","physical","manipulation","stack","world","publication","ai","ui"];
  const out=[];
  for(const word of sld.split(/\s+/).filter(Boolean)){
    let rest=word;
    while(rest){
      const match=dictionary.filter(k=>rest.startsWith(k)).sort((a,b)=>b.length-a.length)[0];
      if(match){if(!out.includes(match))out.push(match);rest=rest.slice(match.length);continue;}
      if(rest.length>=3&&!out.includes(rest)){out.push(rest);}
      break;
    }
  }
  return out.slice(0,3);
}

async function postForm(path,params){
  const body=new URLSearchParams(params);
  const response=await fetch(BASE_URL+path,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body});
  if(!response.ok) throw new Error("namebio_http_"+response.status);
  return response.json();
}

async function keywordStats(keyword){
  const data=await postForm("/retailstats",{keyword});
  return {keyword,data:data.data||{}};
}

async function tldStats(extension){
  const data=await postForm("/tldstats",{extension:"."+extension.replace(/^\./,"")});
  return {extension:data.extension||extension,data:data.data||{}};
}

function numeric(value){
  const n=Number(value);
  return Number.isFinite(n)?n:0;
}

function summarizePlacement(data,placement){
  const x=data?.[placement]||{};
  return {
    sale_count:numeric(x.sale_count),
    price_sum:numeric(x.price_sum),
    price_avg:numeric(x.price_avg),
    price_max:numeric(x.price_max),
    price_stddev:numeric(x.price_stddev)
  };
}

function weightedAverage(values){
  const usable=values.filter(v=>v.avg>0 && v.count>0);
  if(!usable.length)return null;
  const total=usable.reduce((s,v)=>s+v.count,0);
  return Math.round(usable.reduce((s,v)=>s+v.avg*v.count,0)/total);
}

async function benchmark(domain){
  const clean=cleanDomain(domain);
  const tld=clean.split(".").pop();
  const keywords=tokensFor(clean);
  const keywordResults=[];
  for(const keyword of keywords) keywordResults.push(await keywordStats(keyword));
  const tldResult=await tldStats(tld);

  const exactLike=keywordResults.map(r=>({
    keyword:r.keyword,
    start:summarizePlacement(r.data,"start"),
    exact:summarizePlacement(r.data,"exact"),
    end:summarizePlacement(r.data,"end"),
    middle:summarizePlacement(r.data,"middle")
  }));

  const keywordAverages=keywordResults.flatMap(r=>{
    const placements=["exact","start","end","middle"];
    return placements.map(p=>({keyword:r.keyword,avg:numeric(r.data?.[p]?.price_avg),count:numeric(r.data?.[p]?.sale_count)}));
  });
  const keywordBenchmark=weightedAverage(keywordAverages);
  const tldBenchmark=summarizePlacement(tldResult.data,"all_retail");
  const benchmarkValue=keywordBenchmark||tldBenchmark.price_avg||null;
  const low=benchmarkValue?Math.round(benchmarkValue*0.6):null;
  const high=benchmarkValue?Math.round(Math.max(benchmarkValue*2,tldBenchmark.price_max||benchmarkValue*2)):null;

  const evidence=[];
  for(const r of keywordResults){
    evidence.push({
      type:"market_benchmark",
      source:"https://www.namebio.com/",
      source_url:"https://api.namebio.com/retailstats",
      observed_at:new Date().toISOString(),
      confidence:"medium",
      supports:"keyword_sales_benchmark",
      keyword:r.keyword,
      status:"observed"
    });
  }
  evidence.push({
    type:"market_benchmark",
    source:"https://www.namebio.com/",
    source_url:"https://api.namebio.com/tldstats",
    observed_at:new Date().toISOString(),
    confidence:"medium",
    supports:"tld_sales_benchmark",
    extension:"."+tld,
    status:"observed"
  });

  return {
    connector:"namebio-free-benchmarks",
    status:"live",
    domain:clean,
    value_state:benchmarkValue?"live_market_benchmark":"insufficient_market_data",
    benchmark_usd:benchmarkValue,
    indicative_range_usd:benchmarkValue?{low,high}:null,
    methodology:"Aggregated NameBio retail keyword/TLD statistics. This is a market benchmark, not a comparable-sales appraisal.",
    keywords:exactLike,
    tld:tldResult,
    evidence
  };
}

module.exports={benchmark};
