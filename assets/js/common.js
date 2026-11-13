/* Spin Kelompok - script bersama (Tim A)
   - Topbar + menu titik tiga otomatis dari <header data-topbar data-active="spin">
   - Tombol suara (status disimpan di localStorage)
   - Sapaan user: SEMENTARA dari localStorage 'sk_user'.
     Tim B nanti menggantinya dengan data session dari PHP (lihat getUser()). */

const SK = {
  base: document.documentElement.dataset.base || "../",

  // TODO (Tim B): ganti isi fungsi ini dengan fetch('api/me.php')
  getUser() {
    try {
      const u = JSON.parse(localStorage.getItem("sk_user"));
      if (u && u.name) return u;
    } catch (e) {}
    return { name: "Tamu", guest: true };
  },

  soundOn() {
    try { return localStorage.getItem("sk_sound") !== "off"; } catch (e) { return true; }
  },
  setSound(on) {
    try { localStorage.setItem("sk_sound", on ? "on" : "off"); } catch (e) {}
  },
};

const ICON = {
  dots: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/></svg>',
  on: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  off: '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>',
};

function renderTopbar() {
  const host = document.querySelector("[data-topbar]");
  if (!host) return;
  const active = host.dataset.active || "";
  const b = SK.base;
  const link = (key, href, text, cls = "") =>
    `<a href="${b}${href}" class="${cls} ${active === key ? "active" : ""}">${text}</a>`;

  host.classList.add("topbar");
  host.innerHTML = `
    <div class="menu">
      <button class="icon-btn" aria-label="Buka menu" aria-expanded="false" data-menu-btn>${ICON.dots}</button>
      <nav class="menu-panel" aria-label="Menu utama">
        ${link("beranda", "beranda/", "Beranda")}
        ${link("spin", "spin/", "Spin Putar")}
        ${link("gacha", "gacha/", "Spin Gacha")}
        ${link("detektif", "detektif/", "Detektif")}
        ${link("data", "data/", "Data")}
        <hr>
        ${link("exit", "index.html", "Exit", "exit")}
      </nav>
    </div>
    <a class="brand" href="${b}beranda/"><span class="brand-logo"></span>Spin Kelompok</a>
    <span class="spacer"></span>
    <button class="icon-btn" aria-label="Suara" data-sound></button>`;

  const menu = host.querySelector(".menu");
  const btn = host.querySelector("[data-menu-btn]");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  document.addEventListener("click", () => menu.classList.remove("open"));
  document.addEventListener("keydown", (e) => e.key === "Escape" && menu.classList.remove("open"));

  const snd = host.querySelector("[data-sound]");
  const paintSound = () => {
    snd.innerHTML = SK.soundOn() ? ICON.on : ICON.off;
    snd.classList.toggle("is-muted", !SK.soundOn());
  };
  snd.addEventListener("click", () => { SK.setSound(!SK.soundOn()); paintSound(); });
  paintSound();
}

document.addEventListener("DOMContentLoaded", renderTopbar);
