/* wheel.js - roda bersama

   Cara pakai:
     const roda = buatRoda(document.getElementById("wheel"), {
       onSelesai: (indeks, nama) => { ... }
     });
     roda.setItem(["Ayu", "Budi", "Citra"]);
     roda.putar();
*/

const WARNA_RODA = ["#ff6b6b", "#ffc93c", "#4ecdc4", "#5b8def", "#b388ff", "#ffa36c"];

function buatRoda(canvas, opsi = {}) {
  const g = canvas.getContext("2d");
  const r = canvas.width / 2;
  const onSelesai = opsi.onSelesai || function () {};
  const durasi = opsi.durasi || 4500;

  let item = [];
  let sudut = 0;          // sudut putaran saat ini (radian)
  let sedangPutar = false;

  function gambar() {
    g.clearRect(0, 0, canvas.width, canvas.height);

    if (item.length === 0) {
      g.fillStyle = "#3c2d77";
      g.beginPath(); g.arc(r, r, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#d9ccff";
      g.font = "600 16px Poppins, sans-serif";
      g.textAlign = "center";
      g.fillText("Tambah nama dulu", r, r - 34);
      return;
    }

    const irisan = (Math.PI * 2) / item.length;
    item.forEach((nama, i) => {
      const awal = sudut + i * irisan - Math.PI / 2;

      g.beginPath(); g.moveTo(r, r);
      g.arc(r, r, r, awal, awal + irisan); g.closePath();
      g.fillStyle = WARNA_RODA[i % WARNA_RODA.length];
      g.fill();

      g.save();
      g.translate(r, r);
      g.rotate(awal + irisan / 2);
      g.textAlign = "right";
      g.fillStyle = "#2b1b6b";
      g.font = "700 15px Poppins, sans-serif";
      g.fillText(nama, r - 16, 5);
      g.restore();
    });

    g.beginPath(); g.arc(r, r, 22, 0, Math.PI * 2);
    g.fillStyle = "#fff"; g.fill();
  }

  // Ganti isi roda. Tidak bisa dilakukan saat roda sedang berputar.
  function setItem(daftar) {
    if (sedangPutar) return false;
    item = daftar.slice();
    gambar();
    return true;
  }

  // Putar roda. indeksTarget boleh dikosongkan (acak).
  function putar(indeksTarget) {
    const n = item.length;
    if (sedangPutar || n === 0) return false;
    sedangPutar = true;

    const irisan = (Math.PI * 2) / n;
    const terpilih = Number.isInteger(indeksTarget) && indeksTarget >= 0 && indeksTarget < n
      ? indeksTarget
      : Math.floor(Math.random() * n);

    // Pusat irisan terpilih berhenti tepat di bawah penunjuk (atas roda)
    const targetAkhir = -(terpilih + 0.5) * irisan;
    const awal = sudut % (Math.PI * 2);
    let putaran = targetAkhir - awal;
    while (putaran > 0) putaran -= Math.PI * 2;
    putaran -= Math.PI * 2 * (5 + Math.floor(Math.random() * 3)); // 5-7 putaran

    const mulai = performance.now();
    const sudutMulai = sudut;
    const namaTerpilih = item[terpilih];

    function langkah(t) {
      const p = Math.min((t - mulai) / durasi, 1);
      sudut = sudutMulai + putaran * (1 - Math.pow(1 - p, 3));
      gambar();
      if (p < 1) {
        requestAnimationFrame(langkah);
      } else {
        sedangPutar = false;
        onSelesai(terpilih, namaTerpilih);
      }
    }
    requestAnimationFrame(langkah);
    return true;
  }

  gambar();
  return { setItem, putar, sedangPutar: () => sedangPutar };
}