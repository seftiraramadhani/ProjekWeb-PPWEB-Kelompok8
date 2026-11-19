/* Halaman Data Kelompok - membaca api/ambil_data.php (Tim B) */

const $ = (id) => document.getElementById(id);
const NAMA_JENIS = { putar: "Spin Putar", gacha: "Spin Gacha", detektif: "Detektif" };

function tampilPesan(teks) {
  $("baris").replaceChildren();
  $("pesan").textContent = teks;
  $("pesan").hidden = false;
  $("stKelompok").textContent = "0";
  $("stAnggota").textContent = "0";
  $("stPertama").textContent = "-";
  $("info").textContent = "";
}

// Semua teks dimasukkan lewat textContent (bukan innerHTML) supaya aman
function buatBaris(k, i) {
  const baris = document.createElement("div");
  baris.className = "dt-baris";

  const medali = document.createElement("span");
  medali.className = "dt-medali" + (i < 3 ? " m" + (i + 1) : "");
  medali.textContent = i + 1;

  const nama = document.createElement("span");
  nama.className = "nama";
  nama.textContent = k.nama;

  const wadah = document.createElement("div");
  wadah.className = "dt-anggota";
  k.anggota.forEach((a) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (a.ketua ? " ketua" : "");
    chip.textContent = a.ketua ? a.nama + " (ketua)" : a.nama;
    wadah.appendChild(chip);
  });

  baris.append(medali, nama, wadah);
  return baris;
}

function isi(d) {
  $("pesan").hidden = true;
  $("stKelompok").textContent = d.jumlah_kelompok;
  $("stAnggota").textContent = d.jumlah_anggota;
  $("stPertama").textContent = d.kelompok[0].nama;

  $("baris").replaceChildren(...d.kelompok.map(buatBaris));

  const waktu = new Date(d.sesi.waktu.replace(" ", "T"));
  const teksWaktu = isNaN(waktu) ? "" : " · " + waktu.toLocaleString("id-ID");
  $("info").textContent = "Hasil terakhir: " + (NAMA_JENIS[d.sesi.jenis] || d.sesi.jenis) + teksWaktu;
}

async function muat() {
  try {
    const res = await fetch("../api/ambil_data.php");
    if (res.status === 401) return tampilPesan("Kamu belum masuk. Silakan login dulu.");
    const d = await res.json();
    if (!d.ok) return tampilPesan(d.pesan || "Gagal mengambil data.");
    if (d.tamu) return tampilPesan("Mode tamu: hasil tidak disimpan, jadi belum ada data.");
    if (d.jumlah_kelompok === 0) return tampilPesan("Belum ada hasil tersimpan. Mainkan Spin, Gacha, atau Detektif, lalu simpan hasilnya.");
    isi(d);
  } catch (e) {
    tampilPesan("Tidak bisa menghubungi server.");
  }
}

async function hapusSemua() {
  if (!confirm("Hapus SEMUA data hasil kelompok milikmu? Ini tidak bisa dibatalkan.")) return;
  try {
    const res = await fetch("../api/hapus_data.php", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.ok) return alert(d.pesan || "Gagal menghapus data.");
    await muat();
  } catch (e) {
    alert("Tidak bisa menghubungi server.");
  }
}

$("btnHapus").addEventListener("click", hapusSemua);
muat();