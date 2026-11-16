<?php
require 'db.php';
session_start();

function balas($kode, $isi) {
  http_response_code($kode);
  echo json_encode($isi);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  balas(405, ['ok'=>false, 'pesan'=>'Gunakan metode POST.']);
}
if (!isset($_SESSION['username'])) {
  balas(401, ['ok'=>false, 'pesan'=>'Silakan masuk dulu.']);
}
// Tamu tidak punya user_id, jadi hasilnya tidak disimpan ke database
if (!empty($_SESSION['tamu'])) {
  balas(200, ['ok'=>true, 'disimpan'=>false, 'pesan'=>'Mode tamu: hasil tidak disimpan.']);
}

$data     = json_decode(file_get_contents('php://input'), true);
$jenis    = $data['jenis'] ?? '';
$kelompok = $data['kelompok'] ?? [];

if (!in_array($jenis, ['putar', 'gacha', 'detektif'], true)
    || !is_array($kelompok) || count($kelompok) < 1 || count($kelompok) > 50) {
  balas(400, ['ok'=>false, 'pesan'=>'Data tidak valid.']);
}

// Rapikan dan periksa semua data sebelum menyentuh database
$baris = [];
foreach ($kelompok as $i => $k) {
  $namaKel = mb_substr(trim($k['nama'] ?? ''), 0, 50);
  $urutan  = isset($k['urutan']) ? (int)$k['urutan'] : ($i + 1);
  $anggota = $k['anggota'] ?? [];
  if ($namaKel === '' || !is_array($anggota) || count($anggota) < 1 || count($anggota) > 100) {
    balas(400, ['ok'=>false, 'pesan'=>'Data kelompok tidak valid.']);
  }
  foreach ($anggota as $a) {
    $namaAng = mb_substr(trim($a['nama'] ?? ''), 0, 50);
    if ($namaAng === '') {
      balas(400, ['ok'=>false, 'pesan'=>'Nama anggota tidak boleh kosong.']);
    }
    $baris[] = [$namaKel, $namaAng, !empty($a['ketua']) ? 1 : 0, $urutan];
  }
}

try {
  $pdo->beginTransaction();

  $sesi = $pdo->prepare("INSERT INTO sesi_spin (user_id, jenis) VALUES (?, ?)");
  $sesi->execute([$_SESSION['user_id'], $jenis]);
  $sesiId = $pdo->lastInsertId();

  $isi = $pdo->prepare(
    "INSERT INTO hasil_kelompok (sesi_id, nama_kelompok, nama_anggota, is_ketua, urutan_tampil)
     VALUES (?, ?, ?, ?, ?)"
  );
  foreach ($baris as $b) {
    $isi->execute([$sesiId, $b[0], $b[1], $b[2], $b[3]]);
  }

  $pdo->commit();
  balas(200, ['ok'=>true, 'disimpan'=>true, 'sesi_id'=>(int)$sesiId]);
} catch (Throwable $e) {
  if ($pdo->inTransaction()) $pdo->rollBack();
  balas(500, ['ok'=>false, 'pesan'=>'Gagal menyimpan data.']);
}