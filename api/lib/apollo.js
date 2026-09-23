const BASE_URL="https://api.apollo.io/api/v1";

function apiKey(){
  return process.env.APOLLO_API_KEY||"";
}

function ensureConfigured(){
  if(!apiKey()) throw new Error("apollo_not_configured");
}

async function request(path,body){
  ensureConfigured();
  const response=await fetch(BASE_URL+path,{
    method:"POST",
    headers:{"accept":"application/json","content-type":"application/json","x-api-key":apiKey()},
    body:JSON.stringify(body)
  });
  if(!response.ok){
    const detail=await response.text().catch(()=> "");
    throw new Error("apollo_http_"+response.status+(detail?":"+detail.slice(0,180):""));
  }
  return response.json();
}

function domainTerms(domain){
  const sld=String(domain||"").split(".")[0].toLowerCase();
  const dictionary=["robot","intelligence","humanoid","behavior","planning","context","embodiment","robotics","agents","physical","manipulation","stack","world","publication","ai","ui"];
  return dictionary.filter(k=>sld.includes(k));
}

function fitForCompany(org,terms){
  const hay=[org.name,org.short_description,org.industry,...(org.keywords||[])].filter(Boolean).join(" ").toLowerCase();
  const hits=terms.filter(t=>hay.includes(t));
  const funding=Number(org.latest_funding_amount||0);
  const employees=Number(org.estimated_num_employees||0);
  const score=Math.min(100,Math.round(45+hits.length*10+(funding>0?10:0)+(employees>=50?10:0)));
  return {score,hits};
}

async function findCompanies(domain,{perPage=10}={}){
  const terms=domainTerms(domain);
  const body={page:1,per_page:Math.min(25,Math.max(1,perPage)),q_organization_keyword_tags:terms.length?terms:["robotics","artificial intelligence"]};
  const data=await request("/mixed_companies/search",body);
  const organizations=(data.organizations||[]).map(org=>{
    const fit=fitForCompany(org,terms);
    return {
      id:org.id||org.organization_id||null,
      name:org.name||"Unknown",
      website_url:org.website_url||org.primary_domain||null,
      primary_domain:org.primary_domain||null,
      industry:org.industry||null,
      description:org.short_description||org.description||null,
      employees:org.estimated_num_employees||null,
      funding:org.latest_funding_amount||null,
      latest_funding_date:org.latest_funding_date||null,
      fit:fit.score,
      matched_terms:fit.hits,
      source:"Apollo Organization Search"
    };
  }).sort((a,b)=>b.fit-a.fit);
  return {connector:"apollo",status:"live",domain,terms,organizations,meta:{total:data.pagination?.total_entries||organizations.length,credits:"organization search uses Apollo credits"}};
}

async function findDecisionMakers(organizationIds,{perPage=5}={}){
  if(!organizationIds.length) return {connector:"apollo_people",status:"live",people:[]};
  const data=await request("/mixed_people/api_search",{
    page:1,per_page:Math.min(25,Math.max(1,perPage)),
    organization_ids:organizationIds.slice(0,10),
    person_seniorities:["founder","c_suite","vp","head","director"],
    person_titles:["CEO","Founder","Chief Executive Officer","Chief Technology Officer","CTO","VP","Head of AI","Head of Robotics","Robotics"],
    include_similar_titles:true
  });
  return {
    connector:"apollo_people",status:"live",
    people:(data.people||[]).map(p=>({
      id:p.id||null,
      name:[p.first_name,p.last_name].filter(Boolean).join(" ")||p.name||"Unknown",
      title:p.title||null,
      organization_id:p.organization_id||p.organization?.id||null,
      organization_name:p.organization_name||p.organization?.name||null,
      linkedin_url:p.linkedin_url||null,
      source:"Apollo People API Search"
    }))
  };
}

async function enrichDecisionMakers(domain,{perPage=5,maxPeople=5}={}){
  const companies=await findCompanies(domain,{perPage:Math.min(10,perPage)});
  const ids=companies.organizations.map(x=>x.id).filter(Boolean);
  const people=await findDecisionMakers(ids,{perPage:Math.min(10,perPage)});
  const candidates=people.people.filter(p=>p.id).slice(0,Math.min(10,Math.max(1,maxPeople)));
  if(!candidates.length) return {connector:"apollo_enrichment",status:"live",domain,contacts:[],meta:{requested:0,credits:"no enrichment performed"}};
  const details=candidates.map(p=>({id:p.id}));
  const data=await request("/people/bulk_match?reveal_personal_emails=false&reveal_phone_number=false",{details});
  const matches=(data.matches||[]).map(p=>({
    id:p.id||null,
    person:[p.first_name,p.last_name].filter(Boolean).join(" ")||p.name||"Unknown",
    role:p.title||null,
    company:p.organization?.name||p.organization_name||null,
    organization_id:p.organization_id||p.organization?.id||null,
    email:p.email||null,
    email_status:p.email_status||null,
    linkedin_url:p.linkedin_url||null,
    city:p.city||null,
    state:p.state||null,
    country:p.country||null,
    match_confidence:p.match_confidence||null,
    source:"Apollo People Enrichment"
  }));
  return {connector:"apollo_enrichment",status:"live",domain,contacts:matches,meta:{requested:candidates.length,enriched:matches.length,credits:"Apollo enrichment may consume credits when data is returned"}};
}

async function research(domain,options={}){
  const companies=await findCompanies(domain,options);
  const ids=companies.organizations.map(x=>x.id).filter(Boolean);
  const people=await findDecisionMakers(ids,options);
  const evidence=companies.organizations.slice(0,10).map(org=>({
    type:"buyer_candidate",
    source:"Apollo",
    source_url:org.website_url||("https://www.apollo.io/"),
    observed_at:new Date().toISOString(),
    confidence:"medium",
    supports:"company_fit_and_buyer_discovery",
    status:"observed",
    company:org.name,
    matched_terms:org.matched_terms
  }));
  return {...companies,people,evidence};
}

module.exports={findCompanies,findDecisionMakers,enrichDecisionMakers,research};
