/* Detektif - soal, benar/salah, ketua, pilih anggota (Tim B) */

const $ = (id) => document.getElementById(id);

const state = {
  nama: [], soal: [], jumlah: 3,
  fase: "setup",     // setup | spin | jawab | pilih | selesai
  kelompok: [],      // [{ ketua: null, anggota: [] }]
  kapasitas: [],
  giliran: 0,
  gagal: [],         // yang salah menjawab di kelompok yang sedang berjalan
  calon: null,
  soalAktif: "",
};

const terkunci = () => state.fase !== "setup";

// Bagi n orang ke k kelompok, selisih paling banyak 1. Contoh: 8 orang, 3 kelompok -> [3, 3, 2]
function ukuranKelompok(n, k) {
  const dasar = Math.floor(n / k);
  const sisa = n % k;
  return Array.from({ length: k }, (_, i) => dasar + (i < sisa ? 1 : 0));
}

/* ---------- data turunan ---------- */
function sudahDapat() {
  const s = new Set();
  state.kelompok.forEach((k) => {
    if (k.ketua) s.add(k.ketua);
    k.anggota.forEach((a) => s.add(a));
  });
  return s;
}
const sisaNama = () => { const s = sudahDapat(); return state.nama.filter((x) => !s.has(x)); };
const poolRoda = () => sisaNama().filter((x) => !state.gagal.includes(x));

/* ---------- tampilan ---------- */
// Chip dibuat dengan textContent (bukan innerHTML) supaya aman dari kode jahat
function buatChip(teks, onHapus) {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = teks;
  if (!terkunci()) {
    const x = document.createElement("button");
    x.type = "button";
    x.setAttribute("aria-label", "Hapus " + teks);
    x.textContent = "×";
    x.addEventListener("click", onHapus);
    chip.appendChild(x);
  }
  return chip;
}

function renderDaftar(wadah, data) {
  wadah.replaceChildren();
  data.forEach((teks, i) => {
    wadah.appendChild(buatChip(teks, () => { data.splice(i, 1); render(); }));
  });
}

function renderKelompok() {
  const wadah = $("groups");
  wadah.replaceChildren();
  const n = state.nama.length;
  if (n === 0) return;
  if (!terkunci() && (state.jumlah < 1 || state.jumlah > n)) return;

  const kap = terkunci() ? state.kapasitas : ukuranKelompok(n, state.jumlah);
  kap.forEach((ukuran, i) => {
    const data = state.kelompok[i];
    const kartu = document.createElement("div");
    kartu.className = "dk-group" + (state.fase !== "setup" && state.fase !== "selesai" && i === state.giliran ? " aktif" : "");

    const judul = document.createElement("strong");
    judul.textContent = "Kelompok " + (i + 1);
    kartu.appendChild(judul);

    for (let s = 0; s < ukuran; s++) {
      const slot = document.createElement("div");
      slot.className = "dk-slot";
      let teks = s === 0 ? "Ketua" : "Kosong";
      if (data && s === 0 && data.ketua) {
        teks = "Ketua: " + data.ketua;
        slot.classList.add("isi", "ketua");
      } else if (data && s > 0 && data.anggota[s - 1]) {
        teks = data.anggota[s - 1];
        slot.classList.add("isi");
      }
      slot.textContent = teks;
      kartu.appendChild(slot);
    }
    wadah.appendChild(kartu);
  });
}

function renderPilih() {
  const panel = $("panelPilih");
  panel.hidden = state.fase !== "pilih";
  if (panel.hidden) return;

  const k = state.kelompok[state.giliran];
  const kurang = state.kapasitas[state.giliran] - 1 - k.anggota.length;
  $("pilihJudul").textContent = `${k.ketua} (ketua) memilih ${kurang} anggota Kelompok ${state.giliran + 1}:`;

  const wadah = $("pilihDaftar");
  wadah.replaceChildren();
  sisaNama().forEach((nama) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-pill";
    b.textContent = nama;
    b.addEventListener("click", () => pilihAnggota(nama));
    wadah.appendChild(b);
  });
}

function render() {
  const n = state.nama.length;
  renderDaftar($("listNama"), state.nama);
  renderDaftar($("listSoal"), state.soal);
  ["inNama", "btnNama", "inSoal", "btnSoal", "inJumlah"].forEach((id) => { $(id).disabled = terkunci(); });
  renderKelompok();

  $("panelJawab").hidden = state.fase !== "jawab";
  if (state.fase === "jawab") {
    $("soalLabel").textContent = `Soal untuk ${state.calon}:`;
    $("soalTeks").textContent = state.soalAktif;
  }
  renderPilih();
  $("panelSimpan").hidden = state.fase !== "selesai";

  roda.setItem(state.fase === "setup" || state.fase === "selesai" ? state.nama : poolRoda());

  const siap = n >= 2 && state.soal.length >= 1 && state.jumlah >= 1 && state.jumlah <= n;
  let status;
  if (state.fase === "setup") {
    if (n < 2 || state.soal.length < 1) status = "Isi minimal 2 nama dan 1 soal dulu";
    else if (state.jumlah > n) status = "Jumlah kelompok tidak boleh lebih banyak dari jumlah nama";
    else status = `Siap! ${n} nama dibagi ke ${state.jumlah} kelompok`;
  } else if (state.fase === "spin") {
    status = `Mencari ketua Kelompok ${state.giliran + 1}` +
      (state.gagal.length ? ` · sudah gagal: ${state.gagal.join(", ")}` : "");
  } else if (state.fase === "jawab") {
    status = `${state.calon} menjawab untuk jadi ketua Kelompok ${state.giliran + 1}`;
  } else if (state.fase === "pilih") {
    status = `Kelompok ${state.giliran + 1}: ketua sedang memilih anggota`;
  } else {
    status = "Semua kelompok sudah terisi!";
  }
  $("status").textContent = status;
  $("btnSpin").disabled = state.fase === "setup" ? !siap : state.fase !== "spin";
}

/* ---------- aturan main ---------- */
function mulaiPermainan() {
  state.kapasitas = ukuranKelompok(state.nama.length, state.jumlah);
  state.kelompok = state.kapasitas.map(() => ({ ketua: null, anggota: [] }));
  state.giliran = 0;
  state.gagal = [];
  state.calon = null;
  state.fase = "spin";
}

// Cek apakah kelompok yang sedang berjalan sudah penuh. Kalau ya, pindah ke kelompok berikutnya.
function periksaKelompok() {
  const k = state.kelompok[state.giliran];
  const terakhir = state.giliran === state.kelompok.length - 1;
  if (terakhir) k.anggota.push(...sisaNama());   // kelompok terakhir: sisa nama otomatis masuk
  if (1 + k.anggota.length >= state.kapasitas[state.giliran]) {
    state.gagal = [];                            // daftar gagal di-reset tiap pindah kelompok
    state.giliran++;
    state.fase = state.giliran >= state.kelompok.length ? "selesai" : "spin";
  }
}

function pilihAnggota(nama) {
  if (state.fase !== "pilih") return;
  state.kelompok[state.giliran].anggota.push(nama);
  periksaKelompok();
  render();
}

const roda = buatRoda($("wheel"), {
  onSelesai: (indeks, nama) => {
    state.calon = nama;
    state.soalAktif = state.soal[Math.floor(Math.random() * state.soal.length)];
    state.fase = "jawab";
    render();
  },
});

$("btnSpin").addEventListener("click", () => {
  if (state.fase === "setup") mulaiPermainan();
  else if (state.fase !== "spin") return;
  render();
  $("btnSpin").disabled = true;
  roda.putar();
});

$("btnBenar").addEventListener("click", () => {
  if (state.fase !== "jawab") return;
  state.kelompok[state.giliran].ketua = state.calon;
  state.calon = null;
  state.fase = "pilih";
  periksaKelompok();
  render();
});

$("btnSalah").addEventListener("click", () => {
  if (state.fase !== "jawab") return;
  if (!state.gagal.includes(state.calon)) state.gagal.push(state.calon);
  state.calon = null;
  // Kalau semua nama yang tersisa sudah gagal, kosongkan daftar gagal supaya spin tidak buntu
  if (sisaNama().every((x) => state.gagal.includes(x))) state.gagal = [];
  state.fase = "spin";
  render();
});

/* ---------- simpan hasil ke database ---------- */
async function simpanHasil() {
  if (state.fase !== "selesai") return;

  const kelompok = state.kelompok.map((k, i) => ({
    nama: "Kelompok " + (i + 1),
    urutan: i + 1,
    anggota: [{ nama: k.ketua, ketua: true }, ...k.anggota.map((a) => ({ nama: a }))],
  }));

  $("btnSimpan").disabled = true;
  $("pesanSimpan").textContent = "Menyimpan...";

  try {
    const res = await fetch("../api/simpan_hasil.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jenis: "detektif", kelompok }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.disimpan) {
      $("pesanSimpan").textContent = "Hasil tersimpan ke database";   // tombol tetap mati agar tidak tersimpan dua kali
    } else if (res.ok) {
      $("pesanSimpan").textContent = "Mode tamu: hasil tidak disimpan ke database";
    } else {
      $("pesanSimpan").textContent = data.pesan || "Gagal menyimpan hasil";
      $("btnSimpan").disabled = false;
    }
  } catch (e) {
    $("pesanSimpan").textContent = "Tidak bisa menghubungi server";
    $("btnSimpan").disabled = false;
  }
}

$("btnSimpan").addEventListener("click", simpanHasil);

/* ---------- pengaturan (hanya saat belum mulai) ---------- */
function tambahNama() {
  if (terkunci()) return;
  const nama = $("inNama").value.trim().slice(0, 30);
  if (!nama) return;
  if (state.nama.some((x) => x.toLowerCase() === nama.toLowerCase())) {
    $("status").textContent = `Nama "${nama}" sudah ada`;
    return;
  }
  state.nama.push(nama);
  $("inNama").value = "";
  $("inNama").focus();
  render();
}

function tambahSoal() {
  if (terkunci()) return;
  const soal = $("inSoal").value.trim().slice(0, 200);
  if (!soal) return;
  state.soal.push(soal);
  $("inSoal").value = "";
  $("inSoal").focus();
  render();
}

function ubahJumlah() {
  if (terkunci()) return;
  const v = parseInt($("inJumlah").value, 10);
  state.jumlah = Number.isNaN(v) || v < 1 ? 1 : v;
  render();
}

function mulaiUlang() {
  if (!confirm("Hapus semua nama, soal, dan hasil?")) return;
  Object.assign(state, {
    nama: [], soal: [], jumlah: 3, fase: "setup",
    kelompok: [], kapasitas: [], giliran: 0, gagal: [], calon: null, soalAktif: "",
  });
  $("btnSimpan").disabled = false;
  $("pesanSimpan").textContent = "";
  $("inJumlah").value = 3;
  render();
}

$("btnNama").addEventListener("click", tambahNama);
$("btnSoal").addEventListener("click", tambahSoal);
$("inNama").addEventListener("keydown", (e) => e.key === "Enter" && tambahNama());
$("inSoal").addEventListener("keydown", (e) => e.key === "Enter" && tambahSoal());
$("inJumlah").addEventListener("input", ubahJumlah);
$("btnReset").addEventListener("click", mulaiUlang);

render();