/* Spin Gacha - mesin gacha, undian nomor urut tampil kelompok (Tim A) */
(() => {
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const PALETTE = ["#ff8f8f", "#ffd36a", "#7ee2d6", "#8fb3ff", "#c8a8ff", "#ffb27d"];
  const STORE = "sk_gacha_state";
  const MAX_GROUPS = 30;
  const DEFAULT_GROUPS = () => ["Kelompok 1", "Kelompok 2", "Kelompok 3", "Kelompok 4"];
  const colorOfNum = (n) => PALETTE[(n - 1) % PALETTE.length];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const state = { groups: DEFAULT_GROUPS(), noRepeat: true, result: {}, picks: 0, last: null, spinning: false };

  /* ---------- simpan sementara di browser ---------- */
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify({ groups: state.groups, noRepeat: state.noRepeat, result: state.result, picks: state.picks, last: state.last })); } catch (e) {}
  }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && Array.isArray(s.groups) && s.groups.length) Object.assign(state, { groups: s.groups, noRepeat: s.noRepeat !== false, result: s.result || {}, picks: s.picks || 0, last: s.last || null });
    } catch (e) {}
  }

  /* ---------- turunan data ---------- */
  const N = () => state.groups.length;
  const used = () => new Set(Object.values(state.result));
  function poolNums() {
    const all = Array.from({ length: N() }, (_, i) => i + 1);
    if (!state.noRepeat) return all;
    const u = used();
    return all.filter((x) => !u.has(x));
  }
  function currentGroup() {
    if (!state.noRepeat) return state.groups[state.picks % N()];
    return state.groups.find((g) => !(g in state.result)) || null;
  }
  const started = () => state.noRepeat && Object.keys(state.result).length > 0;
  const finished = () => state.noRepeat && N() >= 2 && currentGroup() === null;

  /* ---------- suara ---------- */
  let actx;
  function audio() {
    if (typeof SK === "undefined" || !SK.soundOn()) return null;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); return actx; } catch (e) { return null; }
  }
  function beep(freq, dur, type = "triangle", vol = 0.06, when = 0) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
  }
  const rattle = () => beep(160 + Math.random() * 220, 0.05, "square", 0.02);
  const thud = () => { beep(150, 0.14, "sine", 0.12); beep(95, 0.2, "sine", 0.1, 0.05); };
  const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.28, "triangle", 0.07, i * 0.11));

  /* ---------- fisika bola ---------- */
  const cv = $("globe"), cx = cv.getContext("2d");
  const C = 150, R_IN = 142, FLOOR = 262;   // FLOOR = 300 - tumpang tindih badan mesin (34) - celah (4)
  let balls = [], ballR = 24, stirring = false;

  function newBall(n, top) {
    let x, y, tries = 0;
    do {
      x = C + (Math.random() - 0.5) * 2 * (R_IN - ballR);
      y = top ? 40 + Math.random() * 20 : C + 10 + Math.random() * 80;
      tries++;
    } while (Math.hypot(x - C, y - C) > R_IN - ballR && tries < 40);
    return { n, x, y, vx: (Math.random() - 0.5) * 2, vy: 0, r: ballR };
  }
  function rebuildBalls() {
    ballR = Math.min(26, (0.55 * R_IN) / Math.sqrt(Math.max(N(), 1)));
    balls = poolNums().map((n) => newBall(n, false));
  }
  function removeBall(n) { balls = balls.filter((b) => b.n !== n); }

  function step() {
    for (const b of balls) {
      b.vy += 0.38;
      if (stirring) { b.vx += (Math.random() - 0.5) * 3.4; b.vy -= Math.random() * 2.4; }
      b.vx *= 0.995; b.vy *= 0.995;
      const sp = Math.hypot(b.vx, b.vy); if (sp > 14) { b.vx *= 14 / sp; b.vy *= 14 / sp; }
      b.x += b.vx; b.y += b.vy;
      if (b.y + b.r > FLOOR) { b.y = FLOOR - b.r; if (b.vy > 0) b.vy *= -0.55; b.vx *= 0.985; }   // dasar: tepat di atas badan mesin
      const dx = b.x - C, dy = b.y - C, d = Math.hypot(dx, dy), lim = R_IN - b.r;
      if (d > lim) {
        const nx = dx / d, ny = dy / d;
        b.x = C + nx * lim; b.y = C + ny * lim;
        const vn = b.vx * nx + b.vy * ny;
        if (vn > 0) { b.vx -= 1.7 * vn * nx; b.vy -= 1.7 * vn * ny; }
      }
    }
    for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
      if (d < min && d > 0.001) {
        const nx = dx / d, ny = dy / d, push = (min - d) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel > 0) { const imp = (rel * 1.6) / 2; a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny; }
      }
    }
  }

  function drawBall(b) {
    const g = cx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.55, colorOfNum(b.n)); g.addColorStop(1, colorOfNum(b.n));
    cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, TAU); cx.fillStyle = g; cx.fill();
    cx.fillStyle = "#1d1250"; cx.font = `800 ${b.r * 0.95}px Poppins, sans-serif`;
    cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(b.n, b.x, b.y + b.r * 0.06);
  }
  function draw() {
    const css = cv.getBoundingClientRect().width || 300, dpr = window.devicePixelRatio || 1, size = Math.round(css * dpr);
    if (cv.width !== size) { cv.width = size; cv.height = size; }
    cx.setTransform(size / 300, 0, 0, size / 300, 0, 0);
    cx.clearRect(0, 0, 300, 300);
    const g = cx.createRadialGradient(100, 90, 10, C, C, 150);
    g.addColorStop(0, "rgba(255,255,255,.36)"); g.addColorStop(1, "rgba(255,255,255,.07)");
    cx.beginPath(); cx.arc(C, C, 146, 0, TAU); cx.fillStyle = g; cx.fill();
    balls.forEach(drawBall);
    cx.beginPath(); cx.arc(C, C, 146, 0, TAU); cx.lineWidth = 5; cx.strokeStyle = "rgba(255,255,255,.78)"; cx.stroke();
  }
  (function loop() { step(); draw(); requestAnimationFrame(loop); })();

  /* ---------- tampilan ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  function confetti() {
    const box = $("confetti"), cols = ["#ffc93c", "#ff6b6b", "#4ecdc4", "#b388ff", "#5b8def", "#ffa36c"];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%"; p.style.background = cols[i % cols.length];
      p.style.setProperty("--dx", (Math.random() * 240 - 120) + "px"); p.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      p.style.animationDelay = Math.random() * 0.3 + "s";
      box.appendChild(p); setTimeout(() => p.remove(), 2500);
    }
  }
  function setResult(label, big, note, pop) {
    $("resLabel").textContent = label; $("resName").textContent = big; $("resNote").textContent = note;
    const r = $("result"); r.classList.remove("pop"); void r.offsetWidth; if (pop) r.classList.add("pop");
  }
  function dropBall(n) {
    const slot = $("slot"); slot.innerHTML = "";
    const d = document.createElement("div");
    d.className = "drop-ball"; d.textContent = n; d.style.setProperty("--c", colorOfNum(n));
    slot.appendChild(d);
  }

  let lastRenderedNums = new Set();
  function render(freshNum) {
    const locked = started() || state.spinning;

    $("chips").innerHTML = state.groups.map((g, i) => {
      const num = state.noRepeat ? state.result[g] : undefined;
      return `<span class="chip ${num ? "done" : ""}">${esc(g)}${num ? ` <span class="no">${num}</span>` : ""}` +
        (locked ? "" : `<button type="button" data-del="${i}" aria-label="Hapus ${esc(g)}">×</button>`) + `</span>`;
    }).join("");
    $("countText").textContent = `${N()} kelompok`;
    $("groupName").placeholder = `Contoh: Kelompok ${N() + 1}`;
    $("groupName").disabled = locked;
    $("noRepeat").checked = state.noRepeat;
    $("noRepeat").disabled = locked;
    $("lockHint").hidden = !started();

    const cur = currentGroup();
    let status;
    if (N() < 2) status = "Tambahkan minimal 2 kelompok";
    else if (!state.noRepeat) status = `${cur} mengambil nomor · mode bebas, nomor bisa keluar lagi`;
    else if (cur === null) status = "Semua kelompok sudah punya nomor";
    else status = `${cur} sedang mengambil nomor urut tampil`;
    $("status").textContent = status;

    // urutan tampil
    if (state.noRepeat && N() >= 2) {
      const byNum = {}; for (const g in state.result) byNum[state.result[g]] = g;
      $("order").innerHTML = Array.from({ length: N() }, (_, i) => {
        const n = i + 1, g = byNum[n];
        return g
          ? `<div class="o-row ${n === freshNum ? "new" : ""}" style="--c:${colorOfNum(n)}"><span class="n">${n}</span>${esc(g)}</div>`
          : `<div class="o-row empty"><span class="n">${n}</span>Belum keluar</div>`;
      }).join("");
    } else $("order").innerHTML = "";

    $("doneBar").hidden = !finished();
    $("pullBtn").disabled = state.spinning || N() < 2 || finished();
    persist();
  }

  /* ---------- aksi ---------- */
  function addGroup(raw) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (N() >= MAX_GROUPS) return toast(`Maksimal ${MAX_GROUPS} kelompok`);
    if (state.groups.some((g) => g.toLowerCase() === name.toLowerCase())) return toast(`"${name}" sudah ada`);
    state.groups.push(name);
    rebuildBalls(); render();
  }

  async function pull() {
    if (state.spinning) return;
    if (N() < 2) return toast("Tambahkan minimal 2 kelompok dulu");
    if (finished()) return toast("Semua kelompok sudah punya nomor");
    const pool = poolNums(); if (!pool.length) return;

    const num = pool[Math.floor(Math.random() * pool.length)];
    const group = currentGroup();
    state.spinning = true; $("slot").innerHTML = "";
    setResult("Mengocok…", "· · ·", " ", false);
    render();
    audio();

    const knob = $("knob");
    knob.classList.add("pulled");
    stirring = true;
    const rt = setInterval(rattle, 75);
    await sleep(2400);
    stirring = false; clearInterval(rt);
    knob.classList.remove("pulled");

    removeBall(num);
    dropBall(num); thud();
    await sleep(750);

    if (state.noRepeat) state.result[group] = num; else state.picks++;
    state.last = { group, num };
    state.spinning = false;
    setResult("Nomor urut tampil", num, `${group} tampil ke-${num}`, true);
    fanfare(); confetti();
    if (!state.noRepeat) setTimeout(() => balls.push(newBall(num, true)), 500);   // mode bebas: bola kembali ke mesin
    render(num);
    if (finished()) toast("Semua kelompok sudah mendapat nomor!");
  }

  async function save() {
    const kelompok = state.groups
      .map((g) => ({ nama: g, urutan: state.result[g], anggota: [] }))
      .sort((a, b) => a.urutan - b.urutan);
    const payload = { jenis: "gacha", kelompok };
    try { localStorage.setItem("sk_last_result_gacha", JSON.stringify(payload)); } catch (e) {}
    console.log("simpan_hasil:", payload);
    try {
      const res = await fetch("../api/simpan_hasil.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.disimpan) toast("Hasil tersimpan ke database");
      else if (res.ok) toast("Mode tamu: hasil tidak disimpan ke database");
      else toast(data.pesan || "Gagal menyimpan hasil");
    } catch (e) {
      toast("Tidak bisa menghubungi server");
    }
  }

  function clearResult() {
    state.result = {}; state.picks = 0; state.last = null; $("slot").innerHTML = "";
    setResult("Nomor urut tampil", "?", "tarik tuas untuk memulai", false);
    rebuildBalls();
  }

  /* ---------- event ---------- */
  $("addForm").addEventListener("submit", (e) => { e.preventDefault(); addGroup($("groupName").value); $("groupName").value = ""; $("groupName").focus(); });
  $("chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]"); if (!b || started() || state.spinning) return;
    state.groups.splice(+b.dataset.del, 1);
    rebuildBalls(); render();
  });
  $("noRepeat").addEventListener("change", (e) => { state.noRepeat = e.target.checked; clearResult(); render(); });
  $("resetResult").addEventListener("click", () => { if (state.spinning) return; clearResult(); render(); });
  $("resetAll").addEventListener("click", () => {
    if (state.spinning) return;
    if (!confirm("Kembalikan daftar ke 4 kelompok awal dan hapus hasil?")) return;
    state.groups = DEFAULT_GROUPS(); clearResult(); render();
  });
  $("pullBtn").addEventListener("click", pull);
  $("knob").addEventListener("click", pull);
  $("saveBtn").addEventListener("click", save);

  restore();
  rebuildBalls();
  if (state.last) {
    setResult("Nomor urut tampil", state.last.num, `${state.last.group} tampil ke-${state.last.num}`, false);
    if (state.noRepeat) dropBall(state.last.num);
  }
  render();
})();
