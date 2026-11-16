/* Spin Putar - logika roda + pembagian kelompok (Tim A) */
(() => {
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const PALETTE = ["#ff8f8f", "#ffd36a", "#7ee2d6", "#8fb3ff", "#c8a8ff", "#ffb27d"];
  const STORE = "sk_spin_state";
  const MAX_NAMES = 40;

  const canvas = $("wheel"), ctx = canvas.getContext("2d");
  const state = { names: [], G: 2, noRepeat: true, groups: [], last: null, spinning: false, rot: 0 };

  /* ---------- simpan sementara di browser ---------- */
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify({ names: state.names, G: state.G, noRepeat: state.noRepeat, groups: state.groups, last: state.last })); } catch (e) {}
  }
  function restore() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && Array.isArray(s.names)) Object.assign(state, { names: s.names, G: s.G || 2, noRepeat: s.noRepeat !== false, groups: s.groups || [], last: s.last || null });
    } catch (e) {}
  }

  /* ---------- turunan data ---------- */
  const assigned = () => new Set(state.groups.flat());
  const wheelNames = () => {
    if (!state.noRepeat) return state.names;
    const a = assigned();
    return state.names.filter((n) => !a.has(n) || n === state.last);
  };
  function capacities() {
    const N = state.names.length, G = Math.max(1, state.G);
    const base = Math.floor(N / G), extra = N % G;
    return Array.from({ length: G }, (_, g) => base + (g < extra ? 1 : 0));
  }
  function currentGroup() {
    const cap = capacities();
    for (let g = 0; g < cap.length; g++) if ((state.groups[g] || []).length < cap[g]) return g;
    return -1;
  }
  const started = () => state.noRepeat && state.groups.flat().length > 0;
  const finished = () => state.noRepeat && state.names.length >= 2 && currentGroup() === -1;

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
  const tick = () => beep(880, 0.04, "square", 0.025);
  const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.28, "triangle", 0.07, i * 0.11));

  /* ---------- menggambar roda ---------- */
  function colorOf(i, n) {
    let c = PALETTE[i % PALETTE.length];
    if (i === n - 1 && n > 1 && c === PALETTE[0]) c = PALETTE[(i + 1) % PALETTE.length];
    return c;
  }
  function drawWheel() {
    const list = wheelNames(), n = list.length;
    const css = canvas.getBoundingClientRect().width || 340, dpr = window.devicePixelRatio || 1;
    const size = Math.round(css * dpr);
    if (canvas.width !== size) { canvas.width = size; canvas.height = size; }
    const R = size / 2, border = size * 0.025;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.translate(R, R);

    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill();

    if (n === 0) {
      ctx.beginPath(); ctx.arc(0, 0, R - border, 0, TAU); ctx.fillStyle = "#4a3a8a"; ctx.fill();
      ctx.fillStyle = "#d9ccff"; ctx.font = `700 ${size * 0.055}px Poppins, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Tambah nama dulu", 0, 0);
    } else {
      const s = TAU / n, fs = Math.max(size * 0.034, Math.min(size * 0.06, (size * 0.9) / (n * 1.5)));
      ctx.save(); ctx.rotate(state.rot - Math.PI / 2);
      list.forEach((name, i) => {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.arc(0, 0, R - border, i * s, (i + 1) * s); ctx.closePath();
        ctx.fillStyle = colorOf(i, n); ctx.fill();
        ctx.save();
        ctx.rotate(i * s + s / 2);
        ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillStyle = "#1d1250";
        ctx.font = `800 ${fs}px Poppins, sans-serif`;
        const label = name.length > 11 ? name.slice(0, 10) + "…" : name;
        ctx.fillText(label, R - border - size * 0.05, 0);
        ctx.restore();
      });
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, R * 0.12, 0, TAU); ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = size * 0.02; ctx.fill(); ctx.shadowBlur = 0;
  }

  /* ---------- tampilan lainnya ---------- */
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
  function esc(s) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  function render() {
    const locked = started();
    const a = assigned();

    $("chips").innerHTML = state.names.map((n, i) =>
      `<span class="chip ${state.noRepeat && a.has(n) ? "done" : ""} ${n === state.last ? "last" : ""}">${esc(n)}` +
      (locked ? "" : `<button type="button" data-del="${i}" aria-label="Hapus ${esc(n)}">×</button>`) + `</span>`).join("");
    $("countText").textContent = `${state.names.length} nama`;
    $("groupInput").value = state.G;
    $("groupInput").disabled = locked;
    $("nameInput").disabled = locked;
    $("noRepeat").checked = state.noRepeat;
    $("noRepeat").disabled = locked;
    $("lockHint").hidden = !locked;

    // status
    const cap = capacities(), g = currentGroup();
    let status;
    if (state.names.length < 2) status = "Tambahkan minimal 2 nama";
    else if (!state.noRepeat) status = "Mode bebas: nama bisa terpilih lagi";
    else if (g === -1) status = "Semua kelompok sudah terisi";
    else status = `Mengisi Kelompok ${g + 1} · ${(state.groups[g] || []).length} dari ${cap[g]} anggota`;
    $("status").textContent = status;

    // kartu kelompok
    if (state.noRepeat && state.names.length >= 2) {
      $("groups").innerHTML = cap.map((c, i) => {
        const m = state.groups[i] || [];
        const items = m.map((x) => `<li>${esc(x)}</li>`).join("") + Array.from({ length: c - m.length }, () => `<li class="empty">Kosong</li>`).join("");
        return `<div class="g-card ${i === g ? "active" : ""}"><h3>Kelompok ${i + 1}<span>${m.length}/${c}</span></h3><ul>${items}</ul></div>`;
      }).join("");
    } else $("groups").innerHTML = "";

    $("doneBar").hidden = !finished();
    $("spinBtn").disabled = state.spinning || state.names.length < 2 || finished();
    drawWheel();
    persist();
  }

  /* ---------- aksi ---------- */
  function addName(raw) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (state.names.length >= MAX_NAMES) return toast(`Maksimal ${MAX_NAMES} nama`);
    if (state.names.some((n) => n.toLowerCase() === name.toLowerCase())) return toast(`"${name}" sudah ada`);
    state.names.push(name);
    state.G = Math.min(state.G, Math.max(1, state.names.length));
    render();
  }

  function setResult(label, name, note, pop) {
    $("resLabel").textContent = label; $("resName").textContent = name; $("resNote").textContent = note;
    const r = $("result"); r.classList.remove("pop"); void r.offsetWidth; if (pop) r.classList.add("pop");
  }

  function spin() {
    if (state.spinning) return;
    if (state.names.length < 2) return toast("Tambahkan minimal 2 nama dulu");
    if (state.G < 1 || state.G > state.names.length) return toast("Jumlah kelompok tidak valid");
    if (finished()) return toast("Semua nama sudah terbagi");

    state.last = null;              // pemenang sebelumnya keluar dari roda
    const list = wheelNames(), n = list.length;
    if (n === 0) return;
    render();
    audio();

    const s = TAU / n, win = Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * s * 0.7;
    const target = -((win + 0.5) * s + jitter);
    const norm = (x) => ((x % TAU) + TAU) % TAU;
    const delta = norm(target - state.rot);
    const total = delta + TAU * (5 + Math.floor(Math.random() * 3));
    const start = state.rot, dur = 5200, t0 = performance.now();
    state.spinning = true; $("spinBtn").disabled = true;
    setResult("Memutar…", "· · ·", " ", false);

    let lastIdx = -1;
    const box = document.querySelector(".wheel-box");
    (function frame(now) {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      state.rot = start + total * e;
      const idx = Math.floor(norm(-state.rot) / s) % n;
      if (idx !== lastIdx) { if (lastIdx !== -1) { tick(); box.classList.remove("ticking"); void box.offsetWidth; box.classList.add("ticking"); } lastIdx = idx; }
      drawWheel();
      if (p < 1) return requestAnimationFrame(frame);
      state.rot = norm(state.rot);
      finish(list[win]);
    })(t0);
  }

  function finish(winner) {
    state.spinning = false; state.last = winner;
    let note = "terpilih secara acak";
    if (state.noRepeat) {
      const g = currentGroup();
      (state.groups[g] = state.groups[g] || []).push(winner);
      note = `masuk ke Kelompok ${g + 1}`;
    }
    setResult("Terpilih", winner, note, true);
    fanfare(); confetti();
    render();
    if (finished()) toast("Semua nama sudah terbagi!");
  }

  async function save() {
    const hasil = capacities().map((_, i) => ({ kelompok: `Kelompok ${i + 1}`, anggota: state.groups[i] || [], urutan_tampil: i + 1 }));
    const payload = { jenis: "putar", hasil };
    try { localStorage.setItem("sk_last_result", JSON.stringify(payload)); } catch (e) {}
    console.log("simpan_hasil:", payload);
    try {
      const res = await fetch("../api/simpan_hasil.php", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(res.status);
      toast("Hasil tersimpan ke database");
    } catch (e) {
      toast("API simpan belum siap, hasil disimpan sementara di perangkat");
    }
  }

  /* ---------- event ---------- */
  $("addForm").addEventListener("submit", (e) => { e.preventDefault(); addName($("nameInput").value); $("nameInput").value = ""; $("nameInput").focus(); });
  $("chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-del]"); if (!b || started()) return;
    state.names.splice(+b.dataset.del, 1);
    state.G = Math.min(state.G, Math.max(1, state.names.length));
    render();
  });
  $("groupInput").addEventListener("change", (e) => {
    const v = Math.round(+e.target.value) || 1;
    state.G = Math.min(Math.max(1, v), Math.max(1, state.names.length));
    render();
  });
  $("noRepeat").addEventListener("change", (e) => { state.noRepeat = e.target.checked; state.groups = []; state.last = null; render(); });
  $("resetResult").addEventListener("click", () => { if (state.spinning) return; state.groups = []; state.last = null; setResult("Terpilih", "?", "tekan Putar untuk memulai", false); render(); });
  $("resetAll").addEventListener("click", () => {
    if (state.spinning) return;
    if (state.names.length && !confirm("Hapus semua nama dan hasil?")) return;
    Object.assign(state, { names: [], G: 2, groups: [], last: null, rot: 0 });
    setResult("Terpilih", "?", "tekan Putar untuk memulai", false); render();
  });
  $("spinBtn").addEventListener("click", spin);
  $("saveBtn").addEventListener("click", save);
  window.addEventListener("resize", drawWheel);

  restore();
  if (state.last) setResult("Terpilih", state.last, state.noRepeat ? "tersimpan dari sesi sebelumnya" : "terpilih secara acak", false);
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWheel);
})();
