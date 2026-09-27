const demo = [
  {
    name: "Figure AI",
    keywords: ["humanoid", "robot", "robotics", "embodied", "physical ai", "intelligence"],
    base: 96,
    reason: "Humanoid robotics + embodied intelligence are directly aligned with the asset concept.",
    signal: "Humanoid deployment, robot learning and physical-AI activity."
  },
  {
    name: "Skild AI",
    keywords: ["robot", "robotics", "embodied", "physical ai", "foundation model", "intelligence"],
    base: 94,
    reason: "General-purpose robot intelligence and embodied AI positioning create a strong semantic fit.",
    signal: "Robot foundation-model / general-purpose intelligence activity."
  },
  {
    name: "Physical Intelligence",
    keywords: ["robot", "robotics", "embodied", "physical ai", "foundation model", "intelligence"],
    base: 92,
    reason: "Direct overlap with robot intelligence, embodiment and general-purpose physical AI.",
    signal: "Foundation-model approach to physical tasks."
  },
  {
    name: "NVIDIA",
    keywords: ["robot", "robotics", "simulation", "physical ai", "ai", "intelligence"],
    base: 89,
    reason: "Robotics intelligence stack, simulation and physical-AI infrastructure are highly relevant.",
    signal: "Robotics platforms, models and ecosystem expansion."
  },
  {
    name: "Google DeepMind",
    keywords: ["robot", "robotics", "embodied", "physical ai", "foundation model", "intelligence"],
    base: 87,
    reason: "Robot learning, embodied intelligence and foundation models are core research areas.",
    signal: "Embodied AI and robotics research."
  }
];

const $ = id => document.getElementById(id);

function tokenize(value) {
  return value.toLowerCase()
    .replace(/[^a-z0-9.\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

function scoreBuyer(buyer, asset, query) {
  const text = (asset + " " + query).toLowerCase();
  const tokens = new Set(tokenize(text));
  const hits = buyer.keywords.filter(keyword =>
    keyword.split(" ").some(word => tokens.has(word))
  );
  return Math.min(100, buyer.base + Math.min(8, hits.length * 2));
}

function render(items) {
  $("results").innerHTML = items.map(x => `
    <article class="card">
      <div class="score">${x.score}/100 MATCH</div>
      <h3>${x.name}</h3>
      <p>${x.reason}</p>
      <div class="evidence">
        <b>SIGNAL</b><br>${x.signal}
        <br><br>
        <b>EVIDENCE</b><br>JavaScript scoring test · no external API · no API key.
      </div>
    </article>
  `).join("");
}

$("run").addEventListener("click", () => {
  const asset = $("asset").value.trim() || "RobotIntelligence.bot";
  const query = $("query").value.trim() || "robot intelligence physical AI";

  $("status").textContent = "RUNNING JS RADAR…";

  setTimeout(() => {
    const ranked = demo
      .map(buyer => ({
        ...buyer,
        score: scoreBuyer(buyer, asset, query)
      }))
      .sort((a, b) => b.score - a.score);

    $("status").textContent =
      `JS TEST MODE · ${ranked.length} buyers · ${asset.toUpperCase()}`;

    render(ranked);
  }, 250);
});

render(demo.map(buyer => ({ ...buyer, score: buyer.base })));
$("status").textContent = "JS TEST READY · LOCAL ONLY";