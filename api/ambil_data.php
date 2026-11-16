<?php
require 'db.php';
session_start();

function balas($kode, $isi) {
  http_response_code($kode);
  echo json_encode($isi);
  exit;
}

if (!isset($_SESSION['username'])) {
  balas(401, ['ok'=>false, 'pesan'=>'Silakan masuk dulu.']);
}

$kosong = ['ok'=>true, 'tamu'=>false, 'sesi'=>null,
           'jumlah_kelompok'=>0, 'jumlah_anggota'=>0, 'kelompok'=>[]];

// Tamu tidak punya data tersimpan
if (!empty($_SESSION['tamu'])) {
  $kosong['tamu'] = true;
  balas(200, $kosong);
}

$userId = $_SESSION['user_id'];
$sesiId = isset($_GET['sesi_id']) ? (int)$_GET['sesi_id'] : 0;

try {
  // Ambil sesi: yang diminta, atau yang paling baru. Selalu milik user ini saja.
  if ($sesiId > 0) {
    $q = $pdo->prepare("SELECT id, jenis, created_at FROM sesi_spin WHERE id = ? AND user_id = ?");
    $q->execute([$sesiId, $userId]);
  } else {
    $q = $pdo->prepare("SELECT id, jenis, created_at FROM sesi_spin WHERE user_id = ? ORDER BY id DESC LIMIT 1");
    $q->execute([$userId]);
  }
  $sesi = $q->fetch();

  if (!$sesi) balas(200, $kosong);

  $q = $pdo->prepare(
    "SELECT nama_kelompok, nama_anggota, is_ketua, urutan_tampil
     FROM hasil_kelompok
     WHERE sesi_id = ?
     ORDER BY urutan_tampil IS NULL, urutan_tampil, nama_kelompok, is_ketua DESC, id"
  );
  $q->execute([$sesi['id']]);

  // Kelompokkan baris per kelompok, urutan tetap sesuai urutan tampil
  $kelompok = [];
  $jumlahAnggota = 0;
  foreach ($q->fetchAll() as $b) {
    $nama = $b['nama_kelompok'];
    if (!isset($kelompok[$nama])) {
      $kelompok[$nama] = ['nama'=>$nama, 'urutan'=>$b['urutan_tampil'], 'anggota'=>[]];
    }
    $kelompok[$nama]['anggota'][] = ['nama'=>$b['nama_anggota'], 'ketua'=>(bool)$b['is_ketua']];
    $jumlahAnggota++;
  }

  balas(200, [
    'ok'              => true,
    'tamu'            => false,
    'sesi'            => ['id'=>(int)$sesi['id'], 'jenis'=>$sesi['jenis'], 'waktu'=>$sesi['created_at']],
    'jumlah_kelompok' => count($kelompok),
    'jumlah_anggota'  => $jumlahAnggota,
    'kelompok'        => array_values($kelompok),
  ]);
} catch (Throwable $e) {
  balas(500, ['ok'=>false, 'pesan'=>'Gagal mengambil data.']);
}