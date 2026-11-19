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

$kosong = ['ok'=>true, 'tamu'=>false, 'sesi'=>null, 'urutan_dari'=>null,
           'jumlah_kelompok'=>0, 'jumlah_anggota'=>0, 'kelompok'=>[]];

// Tamu tidak punya data tersimpan
if (!empty($_SESSION['tamu'])) {
  $kosong['tamu'] = true;
  balas(200, $kosong);
}

$userId = $_SESSION['user_id'];
$sesiId = isset($_GET['sesi_id']) ? (int)$_GET['sesi_id'] : 0;

// Sesi terbaru milik user ini. $gacha=true: hanya gacha, false: selain gacha.
function sesiTerbaru($pdo, $userId, $gacha) {
  $op = $gacha ? '=' : '<>';
  $q = $pdo->prepare("SELECT id, jenis, created_at FROM sesi_spin
                      WHERE user_id = ? AND jenis $op 'gacha' ORDER BY id DESC LIMIT 1");
  $q->execute([$userId]);
  return $q->fetch() ?: null;
}

// Kelompokkan baris satu sesi per nama kelompok. Baris penanda gacha (nama kosong)
// membuat kelompoknya tampil, tapi tidak dihitung sebagai anggota.
function bacaKelompok($pdo, $sesiId) {
  $q = $pdo->prepare("SELECT nama_kelompok, nama_anggota, is_ketua, urutan_tampil
                      FROM hasil_kelompok WHERE sesi_id = ? ORDER BY is_ketua DESC, id");
  $q->execute([$sesiId]);
  $hasil = [];
  foreach ($q->fetchAll() as $b) {
    $nama = $b['nama_kelompok'];
    if (!isset($hasil[$nama])) {
      $hasil[$nama] = ['nama'=>$nama, 'urutan'=>$b['urutan_tampil'] !== null ? (int)$b['urutan_tampil'] : null, 'anggota'=>[]];
    }
    if ($b['nama_anggota'] === '') continue;
    $hasil[$nama]['anggota'][] = ['nama'=>$b['nama_anggota'], 'ketua'=>(bool)$b['is_ketua']];
  }
  return $hasil;
}

function infoSesi($s) {
  return ['id'=>(int)$s['id'], 'jenis'=>$s['jenis'], 'waktu'=>$s['created_at']];
}

try {
  $urutanDari = null;

  if ($sesiId > 0) {
    // Sesi tertentu: tampilkan apa adanya, tanpa penggabungan
    $q = $pdo->prepare("SELECT id, jenis, created_at FROM sesi_spin WHERE id = ? AND user_id = ?");
    $q->execute([$sesiId, $userId]);
    $utama = $q->fetch() ?: null;
    if (!$utama) balas(200, $kosong);
    $kel = bacaKelompok($pdo, $utama['id']);
  } else {
    $anggotaSesi = sesiTerbaru($pdo, $userId, false);   // Spin Putar atau Detektif
    $gachaSesi   = sesiTerbaru($pdo, $userId, true);    // Gacha
    $utama = $anggotaSesi ?: $gachaSesi;
    if (!$utama) balas(200, $kosong);

    $kel = bacaKelompok($pdo, $utama['id']);

    // Ada anggota dari sesi lain dan ada gacha: urutan tampil diambil dari gacha
    if ($anggotaSesi && $gachaSesi) {
      foreach ($kel as &$k) { $k['urutan'] = null; }
      unset($k);
      foreach (bacaKelompok($pdo, $gachaSesi['id']) as $nama => $gk) {
        if (isset($kel[$nama])) {
          $kel[$nama]['urutan'] = $gk['urutan'];
        } else {
          $kel[$nama] = ['nama'=>$nama, 'urutan'=>$gk['urutan'], 'anggota'=>[]];
        }
      }
      $urutanDari = infoSesi($gachaSesi);
    }
  }

  // Urut menurut urutan tampil (yang belum punya urutan di paling bawah)
  $daftar = array_values($kel);
  usort($daftar, function ($a, $b) {
    $ua = $a['urutan'] ?? PHP_INT_MAX;
    $ub = $b['urutan'] ?? PHP_INT_MAX;
    return $ua <=> $ub ?: strnatcmp($a['nama'], $b['nama']);
  });

  $jumlahAnggota = 0;
  foreach ($daftar as $k) $jumlahAnggota += count($k['anggota']);

  balas(200, [
    'ok'              => true,
    'tamu'            => false,
    'sesi'            => infoSesi($utama),
    'urutan_dari'     => $urutanDari,
    'jumlah_kelompok' => count($daftar),
    'jumlah_anggota'  => $jumlahAnggota,
    'kelompok'        => $daftar,
  ]);
} catch (Throwable $e) {
  balas(500, ['ok'=>false, 'pesan'=>'Gagal mengambil data.']);
}