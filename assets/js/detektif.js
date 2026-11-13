/* Detektif - langkah 2: nama, soal, jumlah kelompok (Tim B) */

const state = { nama: [], soal: [], jumlah: 3 };

const $ = (id) => document.getElementById(id);

// Bagi n orang ke k kelompok, selisih paling banyak 1 orang.
// Contoh: 8 orang, 3 kelompok -> [3, 3, 2]
function ukuranKelompok(n, k) {
  const dasar = Math.floor(n / k);
  const sisa = n % k;
  return Array.from({ length: k }, (_, i) => dasar + (i < sisa ? 1 : 0));
}

// Chip dibuat dengan textContent (bukan innerHTML) supaya aman dari kode jahat
function buatChip(teks, onHapus) {
  const chip = document.createElement("span");
  chip.className = "chip";
  chip.textContent = teks;
  const x = document.createElement("button");
  x.type = "button";
  x.setAttribute("aria-label", "Hapus " + teks);
  x.textContent = "×";
  x.addEventListener("click", onHapus);
  chip.appendChild(x);
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

  ukuranKelompok(n, state.jumlah).forEach((ukuran, i) => {
    const kartu = document.createElement("div");
    kartu.className = "dk-group";
    const judul = document.createElement("strong");
    judul.textContent = "Kelompok " + (i + 1);
    kartu.appendChild(judul);
    for (let s = 0; s < ukuran; s++) {
      const slot = document.createElement("div");
      slot.className = "dk-slot";
      slot.textContent = s === 0 ? "Ketua" : "Kosong";
      kartu.appendChild(slot);
    }
    wadah.appendChild(kartu);
  });
}

function render() {
  renderDaftar($("listNama"), state.nama);
  renderDaftar($("listSoal"), state.soal);
  renderKelompok();

  const n = state.nama.length;
  const siap = n >= 2 && state.soal.length >= 1 && state.jumlah >= 1 && state.jumlah <= n;
  $("btnSpin").disabled = !siap;

  if (n < 2 || state.soal.length < 1) {
    $("status").textContent = "Isi minimal 2 nama dan 1 soal dulu";
  } else if (state.jumlah > n) {
    $("status").textContent = "Jumlah kelompok tidak boleh lebih banyak dari jumlah nama";
  } else {
    $("status").textContent = `Siap! ${n} nama dibagi ke ${state.jumlah} kelompok`;
  }
}

function tambahNama() {
  const nama = $("inNama").value.trim().slice(0, 30);
  if (!nama) return;
  const kembar = state.nama.some((x) => x.toLowerCase() === nama.toLowerCase());
  if (kembar) { $("status").textContent = `Nama "${nama}" sudah ada`; return; }
  state.nama.push(nama);
  $("inNama").value = "";
  $("inNama").focus();
  render();
}

function tambahSoal() {
  const soal = $("inSoal").value.trim().slice(0, 200);
  if (!soal) return;
  state.soal.push(soal);
  $("inSoal").value = "";
  $("inSoal").focus();
  render();
}

function ubahJumlah() {
  const v = parseInt($("inJumlah").value, 10);
  state.jumlah = Number.isNaN(v) || v < 1 ? 1 : v;
  render();
}

function mulaiUlang() {
  if (!confirm("Hapus semua nama, soal, dan hasil?")) return;
  state.nama = [];
  state.soal = [];
  state.jumlah = 3;
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