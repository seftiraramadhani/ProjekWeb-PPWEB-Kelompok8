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
if (!empty($_SESSION['tamu'])) {
  balas(200, ['ok'=>true, 'dihapus'=>0, 'pesan'=>'Mode tamu: tidak ada data tersimpan.']);
}

try {
  // hasil_kelompok ikut terhapus otomatis (ON DELETE CASCADE)
  $q = $pdo->prepare("DELETE FROM sesi_spin WHERE user_id = ?");
  $q->execute([$_SESSION['user_id']]);
  balas(200, ['ok'=>true, 'dihapus'=>$q->rowCount()]);
} catch (Throwable $e) {
  balas(500, ['ok'=>false, 'pesan'=>'Gagal menghapus data.']);
}