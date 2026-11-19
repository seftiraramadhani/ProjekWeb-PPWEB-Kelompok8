/* Login / Daftar / Tamu - tersambung ke api/login.php, register.php, guest.php, cek_sesi.php (Tim B)
   Catatan format API: login & register memakai FORM POST (bukan JSON). */
(() => {
  const $ = (id) => document.getElementById(id);
  const API = "../api/";
  const NEXT = "../beranda/";
  const USER_RE = /^[A-Za-z0-9_]{3,30}$/;
  let mode = "login", busy = false;

  /* ---------- tampilan ---------- */
  function showMsg(text, ok) {
    const m = $("msg");
    m.textContent = text; m.hidden = false; m.classList.toggle("ok", !!ok);
    m.classList.remove("shake"); void m.offsetWidth; if (!ok) m.classList.add("shake");
  }
  const hideMsg = () => { $("msg").hidden = true; };

  function setMode(m) {
    if (busy) return;
    mode = m; hideMsg();
    const reg = m === "register";
    $("tabs").dataset.mode = m;
    $("tabLogin").setAttribute("aria-selected", String(!reg));
    $("tabReg").setAttribute("aria-selected", String(reg));
    $("confirmWrap").hidden = !reg;
    $("rememberWrap").hidden = reg;
    $("submitBtn").textContent = reg ? "Daftar" : "Masuk";
    $("password").autocomplete = reg ? "new-password" : "current-password";
    $("confirm").value = "";
  }

  function setBusy(on, label) {
    busy = on;
    $("auth").classList.toggle("busy", on);
    ["submitBtn", "guestBtn", "tabLogin", "tabReg"].forEach((id) => { $(id).disabled = on; });
    $("submitBtn").textContent = on ? (label || "Memproses…") : (mode === "register" ? "Daftar" : "Masuk");
  }

  /* ---------- panggilan API ---------- */
  async function call(file, params, method = "POST") {
    let res;
    try {
      res = await fetch(API + file, { method, body: method === "POST" ? params : undefined, credentials: "same-origin" });
    } catch (e) {
      return { error: "Tidak bisa menghubungi server. Pastikan Apache dan MySQL di XAMPP menyala." };
    }
    const text = await res.text();
    try { return { status: res.status, data: JSON.parse(text) }; }
    catch (e) { return { error: "Server membalas dengan format tak terduga. Periksa koneksi database (api/db.php)." }; }
  }

  function goNext(delay = 450) { setTimeout(() => { location.href = NEXT; }, delay); }

  /* ---------- aksi ---------- */
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const username = $("username").value.trim(), password = $("password").value;

    if (mode === "login") {
      if (!username || !password) return showMsg("Isi nama pengguna dan kata sandi.");
    } else {
      if (!USER_RE.test(username)) return showMsg("Nama pengguna 3–30 karakter (huruf, angka, _).");
      if (password.length < 6) return showMsg("Kata sandi minimal 6 karakter.");
      if (password !== $("confirm").value) return showMsg("Konfirmasi kata sandi tidak sama.");
    }

    hideMsg(); setBusy(true);
    const params = new URLSearchParams({ username, password });
    if (mode === "login" && $("remember").checked) params.set("ingat", "1");

    const r = await call(mode === "login" ? "login.php" : "register.php", params);
    if (r.error) { setBusy(false); return showMsg(r.error); }
    const d = r.data || {};

    if (!d.ok) { setBusy(false); return showMsg(d.pesan || "Terjadi kesalahan, coba lagi."); }

    if (mode === "login") {
      showMsg("Berhasil masuk. Mengalihkan…", true);
      setBusy(true, "Masuk…");
      return goNext();
    }
    // daftar berhasil -> pindah ke tab Masuk, nama pengguna tetap terisi
    setBusy(false); setMode("login");
    $("password").value = ""; $("password").focus();
    showMsg(d.pesan || "Pendaftaran berhasil, silakan masuk.", true);
  }

  async function guest() {
    if (busy) return;
    hideMsg(); setBusy(true, "Masuk…");
    const r = await call("guest.php", new URLSearchParams());
    if (r.error || !(r.data && r.data.ok)) { setBusy(false); return showMsg(r.error || (r.data && r.data.pesan) || "Gagal masuk sebagai tamu."); }
    showMsg("Masuk sebagai tamu. Mengalihkan…", true);
    goNext();
  }

  /* ---------- event ---------- */
  $("authForm").addEventListener("submit", submit);
  $("guestBtn").addEventListener("click", guest);
  $("tabLogin").addEventListener("click", () => setMode("login"));
  $("tabReg").addEventListener("click", () => setMode("register"));
  $("togglePw").addEventListener("click", () => {
    const show = $("password").type === "password";
    $("password").type = show ? "text" : "password";
    $("confirm").type = show ? "text" : "password";
    $("togglePw").textContent = show ? "Sembunyi" : "Lihat";
    $("togglePw").setAttribute("aria-label", show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
  });

  // Sudah punya sesi? langsung ke Beranda.
  (async () => {
    const r = await call("cek_sesi.php", null, "GET");
    if (r.data && r.data.login) location.replace(NEXT);
  })();
})();
