const demo = [
  { name:"Figure AI", keywords:["humanoid","robot","robotics","embodied","physical ai","intelligence"], base:96, reason:"Humanoid robotics + embodied intelligence are directly aligned with the asset concept.", signal:"Local benchmark buyer profile." },
  { name:"Skild AI", keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"], base:94, reason:"General-purpose robot intelligence and embodied AI positioning create a strong semantic fit.", signal:"Local benchmark buyer profile." },
  { name:"Physical Intelligence", keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"], base:92, reason:"Direct overlap with robot intelligence, embodiment and general-purpose physical AI.", signal:"Local benchmark buyer profile." },
  { name:"NVIDIA", keywords:["robot","robotics","simulation","physical ai","ai","intelligence"], base:89, reason:"Robotics intelligence stack, simulation and physical-AI infrastructure are highly relevant.", signal:"Local benchmark buyer profile." },
  { name:"Google DeepMind", keywords:["robot","robotics","embodied","physical ai","foundation model","intelligence"], base:87, reason:"Robot learning, embodied intelligence and foundation models are core research areas.", signal:"Local benchmark buyer profile." }
];

const $ = id => document.getElementById(id);
const API_TIMEOUT = 7000;

function tokenize(value) {
  return value.toLowerCase().replace(/[^a-z0-9.\s-]/g," ").split(/[\s-]+/).filter(Boolean);
}

function scoreBuyer(buyer, asset, query) {
  const tokens = new Set(tokenize(asset + " " + query));
  const hits = buyer.keywords.filter(k => k.split(" ").some(w => tokens.has(w)));
  return Math.min(100, buyer.base + Math.min(8, hits.length * 2));
}

async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    const response = await fetch(url, {
      headers: { "Accept":"application/vnd.github+json" }
    });
    if (!response.ok) throw new Error(response.status + " " + response.statusText);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function githubSignals(query) {
  const q = encodeURIComponent(query + " robotics");
  const data = await fetchJSON("https://api.github.com/search/repositories?q=" + q + "&sort=updated&order=desc&per_page=8");
  return (data.items || []).slice(0,8).map(repo => ({
    name: repo.owner?.login || repo.name,
    score: Math.min(99, 58 + Math.min(30, (repo.stargazers_count || 0) / 100)),
    reason: "Live GitHub activity matching the radar query.",
    signal: repo.full_name + " · updated " + new Date(repo.updated_at).toLocaleDateString(),
    evidence: repo.description || "Public GitHub repository signal.",
    source: repo.html_url,
    sourceLabel: "GitHub"
  }));
}

async function hackerNewsSignals(query) {
  const q = encodeURIComponent(query + " robotics");
  const data = await fetchJSON("https://hn.algolia.com/api/v1/search?query=" + q + "&tags=story&hitsPerPage=8");
  return (data.hits || []).slice(0,8).map(hit => ({
    name: hit.author || "Hacker News signal",
    score: 55,
    reason: "Live discussion/news signal matching the radar query.",
    signal: hit.title || "Recent Hacker News result",
    evidence: "Published " + (hit.created_at ? new Date(hit.created_at).toLocaleDateString() : "recently"),
    source: hit.url || ("https://news.ycombinator.com/item?id=" + hit.objectID),
    sourceLabel: "Hacker News"
  }));
}

function render(items, mode) {
  $("results").innerHTML = items.map(x => `
    <article class="card">
      <div class="score">${x.score}/100 ${x.live ? "LIVE SIGNAL" : "MATCH"}</div>
      <h3>${x.name}</h3>
      <p>${x.reason}</p>
      <div class="evidence">
        <b>SIGNAL</b><br>${x.signal}
        <br><br>
        <b>EVIDENCE</b><br>${x.evidence}
        ${x.source ? `<br><br><a href="${x.source}" target="_blank" rel="noopener">${x.sourceLabel || "SOURCE"} ↗</a>` : ""}
      </div>
    </article>
  `).join("");

  $("status").textContent = mode;
}

async function runRadar() {
  const asset = $("asset").value.trim() || "RobotIntelligence.bot";
  const query = $("query").value.trim() || "robot intelligence physical AI";
  $("status").textContent = "LIVE RADAR · QUERYING PUBLIC SOURCES…";

  const [github, hn] = await Promise.allSettled([
    githubSignals(query),
    hackerNewsSignals(query)
  ]);

  const live = [
    ...(github.status === "fulfilled" ? github.value : []),
    ...(hn.status === "fulfilled" ? hn.value : [])
  ].map(x => ({...x, live:true}));

  const benchmark = demo.map(buyer => ({
    ...buyer,
    score: scoreBuyer(buyer, asset, query),
    live:false,
    evidence:"Local benchmark profile · live sources queried separately."
  }));

  const ranked = [...live, ...benchmark]
    .sort((a,b) => b.score - a.score)
    .slice(0,12);

  const ok = [
    github.status === "fulfilled" ? "GitHub ✓" : "GitHub ✕",
    hn.status === "fulfilled" ? "Hacker News ✓" : "Hacker News ✕"
  ].join(" · ");

  render(ranked, `LIVE RADAR · ${ok} · ${ranked.length} signals`);
}

$("run").addEventListener("click", () => {
  runRadar().catch(error => {
    $("status").textContent = "LIVE RADAR ERROR · " + error.message;
    render(demo.map(buyer => ({
      ...buyer, score:scoreBuyer(buyer,$("asset").value,$("query").value), live:false,
      evidence:"Live source unavailable; local benchmark retained."
    })), "FALLBACK · LOCAL BENCHMARK");
  });
});

render(demo.map(buyer => ({...buyer, score:buyer.base, live:false, evidence:"Local benchmark profile."})));
$("status").textContent = "LIVE RADAR READY · PUBLIC SOURCES · NO API KEY";