const el = (id) => document.getElementById(id);

const state = {
  step: 1,
  cfg: null,
  love: 100
};

function setThemeColors(cfg) {
  const c = cfg.colors;
  document.documentElement.style.setProperty("--bg1", c.backgroundStart);
  document.documentElement.style.setProperty("--bg2", c.backgroundEnd);
  document.documentElement.style.setProperty("--btn", c.buttonBackground);
  document.documentElement.style.setProperty("--btnHover", c.buttonHover);
  document.documentElement.style.setProperty("--text", c.textColor);
  document.title = cfg.pageTitle || "Valentine";
}

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function spawnFloat() {
  const cfg = state.cfg;
  if (!cfg) return; // <- prevent errors before config is loaded

  const pool = [...cfg.floatingEmojis.hearts, ...cfg.floatingEmojis.bears];
  const node = document.createElement("div");
  node.className = "float";
  node.textContent = pick(pool);

  node.style.left = `${rand(5, 95)}%`;
  node.style.setProperty("--drift", `${rand(-80, 80)}px`);
  node.style.setProperty("--rot", `${rand(-90, 90)}deg`);
  node.style.animationDuration = `${cfg.animations.floatLifetimeMs / 1000}s`;

  el("bg").appendChild(node);
  setTimeout(() => node.remove(), cfg.animations.floatLifetimeMs + 300);
}

function setStage(html) {
  const stage = el("stage");
  if (!stage) return; // <- safety
  stage.innerHTML = html;
  stage.classList.remove("pop");
  void stage.offsetWidth;
  stage.classList.add("pop");
}

function showLoading() {
  setStage(`
    <div class="big">Loading...</div>
    <div class="small">Preparing the cutest question 🥺</div>
  `);
  setControls([]);
}

function showInitError(err) {
  console.error(err);
  setStage(`
    <div class="big">Couldn’t load <code>customize.json</code> 😵</div>
    <div class="small">
      Open DevTools → Console/Network to see the error.<br/>
      If you opened the HTML as a file, use a local server instead.
    </div>
  `);
  setControls([]);
}

function showDrama(text) {
  setStage(`
    <div class="big">${text}</div>
    <div class="small">Rejection is being processed…</div>
  `);

  for (let i = 0; i < 25; i++) setTimeout(() => spawnFloat(), i * 35);
}

function forceLove() {
  let count = 3;

  const tick = () => {
    setStage(`
      <div class="big">System Error: "No" not supported 😤</div>
      <div class="small">Auto-accepting in ${count}…</div>
    `);

    for (let i = 0; i < 6; i++) setTimeout(spawnFloat, i * 60);

    count--;
    if (count < 0) { state.step = 2; render(); }
    else setTimeout(tick, 900);
  };

  tick();
}

function setControls(buttons) {
  const wrap = el("controls");
  if (!wrap) return;
  wrap.innerHTML = "";
  buttons.forEach((b) => wrap.appendChild(b));
}

function makeBtn(text, className) {
  const b = document.createElement("button");
  b.className = `btn ${className || ""}`.trim();
  b.textContent = text;
  return b;
}

function renderStep1() {
  const q = state.cfg.questions.first;

  el("title").textContent = `Hey ${state.cfg.valentineName} 💖`;
  el("subtitle").textContent = "I have a very serious question (emotionally).";

  setStage(`<div class="big">${q.text}</div><div class="small" id="hint"></div>`);

  const yes = makeBtn(q.yesBtn, "");
  const no = makeBtn(q.noBtn, "danger");

  yes.onclick = () => { state.step = 2; render(); };

  no.onmouseenter = () => {
    el("hint").textContent = q.secretAnswer || "";
    const wrap = el("controls");
    const rect = wrap.getBoundingClientRect();
    const x = rand(0, Math.max(0, rect.width - 120));
    const y = rand(-10, 30);
    no.style.transform = `translate(${x}px, ${y}px)`;
  };

  no.onmouseleave = () => { no.style.transform = ""; };

  let noClicks = 0;
  no.onclick = () => {
    noClicks++;
    if (noClicks === 1) showDrama("Bro… try again 😌");
    else if (noClicks === 2) showDrama("This ‘No’ button is not available.");
    else forceLove();
  };

  setControls([yes, no]);
}

function loveMessage(pct) {
  const m = state.cfg.loveMessages;
  if (pct > 5000) return m.extreme;
  if (pct > 1000) return m.high;
  if (pct > 100) return m.normal;
  return "";
}

function renderStep2() {
  const q = state.cfg.questions.second;

  setStage(`
    <div class="big">${q.text}</div>
    <div class="meter">
      <div class="small" id="meterMsg"></div>
      <input id="range" type="range" min="100" max="6000" value="120" />
      <div class="big"><span>${q.startText}</span> <span id="pct">120%</span></div>
    </div>
  `);

  const range = el("range");
  const pct = el("pct");
  const msg = el("meterMsg");

  const update = () => {
    const v = Number(range.value);
    state.love = v;
    pct.textContent = `${v}%`;
    msg.textContent = loveMessage(v);
  };

  range.addEventListener("input", update);
  update();

  const next = makeBtn(q.nextBtn, "");
  next.onclick = () => { state.step = 3; render(); };

  setControls([next]);
}

function renderStep3() {
  const q = state.cfg.questions.third;

  setStage(`<div class="big">${q.text}</div><div class="small">Choose wisely.</div>`);

  const yes = makeBtn(q.yesBtn, "");
  const no = makeBtn(q.noBtn, "danger");

  yes.onclick = () => { state.step = 4; render(); };

  no.onmouseenter = () => {
    const wrap = el("controls");
    const rect = wrap.getBoundingClientRect();
    const x = rand(0, Math.max(0, rect.width - 120));
    const y = rand(-10, 30);
    no.style.transform = `translate(${x}px, ${y}px)`;
  };

  no.onmouseleave = () => { no.style.transform = ""; };

  setControls([yes, no]);
}

function renderStep4() {
  const c = state.cfg.celebration;
  setStage(`
    <div class="big">${c.title}</div>
    <div class="small">${c.message}</div>
    <div style="margin-top:12px;font-size:24px">${c.emojis}</div>
  `);

  setControls([]);
}

function render() {
  if (!state.cfg) return; // <- don’t render steps until config exists
  if (state.step === 1) return renderStep1();
  if (state.step === 2) return renderStep2();
  if (state.step === 3) return renderStep3();
  return renderStep4();
}

async function init() {
  try {
    showLoading();

    const res = await fetch("customize.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`fetch customize.json failed: ${res.status} ${res.statusText}`);

    state.cfg = await res.json();

    setThemeColors(state.cfg);
    setInterval(spawnFloat, state.cfg.animations.floatIntervalMs);
    render();
  } catch (err) {
    showInitError(err);
  }
}

// IMPORTANT: wait for DOM so el("stage") etc. exist
window.addEventListener("DOMContentLoaded", init);
