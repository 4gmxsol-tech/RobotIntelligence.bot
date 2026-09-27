const demo = [
  {name:"Figure AI",keywords:["humanoid","robot","robotics","embodied","physical ai","intelligence"],base:96,type:"company",reason:"Strong overlap with humanoid robotics and embodied intelligence.",signal:"Humanoid deployment and robot-learning activity."},
  {name:"Skild AI",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],base:94,type:"company",reason:"Strong overlap with general-purpose robot intelligence and embodied AI.",signal:"Robot foundation-model activity."},
  {name:"Physical Intelligence",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],base:92,type:"company",reason:"Strong overlap with physical AI, robot learning and general-purpose models.",signal:"Foundation-model approach to physical tasks."},
  {name:"NVIDIA",keywords:["robot","robotics","simulation","physical ai","ai","intelligence"],base:89,type:"company",reason:"Relevant robotics infrastructure and physical-AI ecosystem activity.",signal:"Robotics platforms and physical-AI infrastructure."},
  {name:"Google DeepMind",keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"],base:87,type:"company",reason:"Relevant embodied-AI, robot-learning and foundation-model research.",signal:"Embodied AI and robotics research."}
];

var $ = function(id){ return document.getElementById(id); };
var currentResults = demo.map(function(x){ return Object.assign({},x,{score:x.base,live:false,evidence:"Local benchmark candidate profile."}); });
var currentFilter = "all";

function tokenize(value){
  return String(value || "").toLowerCase().replace(/[^a-z0-9.\s-]/g," ").split(/[\s-]+/).filter(Boolean);
}

function scoreBuyer(buyer,asset,query){
  var tokens = new Set(tokenize(asset+" "+query));
  var hits = buyer.keywords.filter(function(k){
    return k.split(" ").some(function(word){ return tokens.has(word); });
  });
  return Math.min(100,buyer.base+Math.min(8,hits.length*2));
}

function escapeHTML(value){
  return String(value == null ? "" : value)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function renderMetrics(items,providers){
  var companies = items.filter(function(x){return x.type==="company";}).length;
  var live = items.filter(function(x){return x.live;}).length;
  var avg = items.length ? Math.round(items.reduce(function(s,x){return s+x.score;},0)/items.length) : 0;
  $("metrics").innerHTML =
    '<div class="metric"><b>'+companies+'</b><span>CANDIDATES</span></div>'+
    '<div class="metric"><b>'+live+'</b><span>LIVE SIGNALS</span></div>'+
    '<div class="metric"><b>'+avg+'/100</b><span>AVG RELEVANCE</span></div>'+
    '<div class="metric"><b>'+providers+'</b><span>SOURCES</span></div>';
}

function render(items){
  currentResults = items;
  var visible = currentFilter==="all" ? items : items.filter(function(x){return x.type===currentFilter;});
  $("results").innerHTML = visible.map(function(x){
    var source = x.source ? '<br><br><a href="'+escapeHTML(x.source)+'" target="_blank" rel="noopener">'+escapeHTML(x.sourceLabel || "SOURCE")+' ↗</a>' : "";
    return '<article class="card">'+
      '<div class="score">'+escapeHTML(x.score)+'/100 · '+(x.live?"LIVE SIGNAL":"CANDIDATE")+'</div>'+
      '<h3>'+escapeHTML(x.name)+'</h3>'+
      '<p>'+escapeHTML(x.reason)+'</p>'+
      '<div class="evidence"><b>SIGNAL</b><br>'+escapeHTML(x.signal)+'<br><br><b>EVIDENCE</b><br>'+escapeHTML(x.evidence)+source+'</div>'+
      '</article>';
  }).join("") || '<div class="empty">No results for this filter.</div>';
}

function generateBrief(items,asset,query){
  var companies = items.filter(function(x){return x.type==="company";}).sort(function(a,b){return b.score-a.score;});
  var top = companies[0];
  if(!top){ $("buyerBrief").textContent="Run the Radar to generate a buyer brief."; return; }
  $("buyerBrief").innerHTML =
    '<div class="brief-grid">'+
    '<div><span>ASSET</span><strong>'+escapeHTML(asset)+'</strong></div>'+
    '<div><span>TOP CANDIDATE</span><strong>'+escapeHTML(top.name)+'</strong></div>'+
    '<div><span>RELEVANCE</span><strong>'+top.score+'/100</strong></div>'+
    '<div><span>QUERY</span><strong>'+escapeHTML(query)+'</strong></div>'+
    '</div>'+
    '<p><b>Why:</b> '+escapeHTML(top.reason)+'</p>'+
    '<p><b>Signal:</b> '+escapeHTML(top.signal)+'</p>'+
    '<p><b>Next:</b> Verify current positioning, decision-maker ownership and recent strategic activity before outreach.</p>'+
    '<small>Relevance score is a research heuristic, not evidence of purchase intent.</small>';
}

function showLocal(){
  var asset = $("asset").value.trim() || "RobotIntelligence.bot";
  var query = $("query").value.trim() || "robot intelligence physical AI";
  currentResults = demo.map(function(b){
    return Object.assign({},b,{score:scoreBuyer(b,asset,query),live:false,evidence:"Local benchmark candidate profile."});
  }).sort(function(a,b){return b.score-a.score;});
  renderMetrics(currentResults,0);
  render(currentResults);
  generateBrief(currentResults,asset,query);
  $("status").textContent="LOCAL ENGINE READY · LIVE SOURCES WILL LOAD AFTER RUN";
}

function getJSON(url){
  return fetch(url).then(function(response){
    if(!response.ok) throw new Error(response.status+" "+response.statusText);
    return response.json();
  });
}

function runLive(){
  var asset = $("asset").value.trim() || "RobotIntelligence.bot";
  var query = $("query").value.trim() || "robot intelligence physical AI";
  $("status").textContent="LIVE RADAR · QUERYING…";

  var gh = getJSON("https://api.github.com/search/repositories?q="+encodeURIComponent(query+" robotics")+"&sort=updated&order=desc&per_page=8")
    .then(function(data){
      return (data.items||[]).map(function(repo){
        return {name:(repo.owner&&repo.owner.login)||repo.name,type:"signal",
          score:Math.min(88,50+Math.min(38,(repo.stargazers_count||0)/100)),live:true,
          reason:"Public GitHub activity matching the research query.",
          signal:repo.full_name+" · updated "+new Date(repo.updated_at).toLocaleDateString(),
          evidence:repo.description||"Public repository signal.",source:repo.html_url,sourceLabel:"GitHub"};
      });
    });

  var hn = getJSON("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(query+" robotics")+"&tags=story&hitsPerPage=8")
    .then(function(data){
      return (data.hits||[]).map(function(hit){
        return {name:hit.title||"Hacker News signal",type:"signal",score:58,live:true,
          reason:"Recent public discussion/news signal matching the query.",
          signal:hit.title||"Recent Hacker News result.",
          evidence:"Published "+(hit.created_at?new Date(hit.created_at).toLocaleDateString():"recently"),
          source:hit.url||("https://news.ycombinator.com/item?id="+hit.objectID),sourceLabel:"Hacker News"};
      });
    });

  Promise.allSettled([gh,hn]).then(function(results){
    var live=[];
    var providers=0;
    results.forEach(function(result){
      if(result.status==="fulfilled"){ providers++; live=live.concat(result.value); }
    });
    var companies=demo.map(function(b){
      return Object.assign({},b,{score:scoreBuyer(b,asset,query),live:false,evidence:"Local benchmark candidate profile."});
    });
    var ranked=companies.concat(live).sort(function(a,b){return b.score-a.score;});
    currentResults=ranked;
    renderMetrics(ranked,providers);
    render(ranked);
    generateBrief(ranked,asset,query);
    $("status").textContent="LIVE RADAR · "+providers+"/2 SOURCES · "+live.length+" LIVE SIGNALS";
  });
}

if($("run")) $("run").addEventListener("click",runLive);

document.querySelectorAll("#filters button").forEach(function(button){
  button.addEventListener("click",function(){
    document.querySelectorAll("#filters button").forEach(function(b){b.classList.remove("active");});
    button.classList.add("active");
    currentFilter=button.dataset.filter;
    render(currentResults);
  });
});

showLocal();