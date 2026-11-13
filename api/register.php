<?php
require 'db.php';

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (!preg_match('/^[A-Za-z0-9_]{3,30}$/', $username)) {
  echo json_encode(['ok'=>false,'pesan'=>'Nama pengguna 3-30 karakter (huruf, angka, _).']); exit;
}
if (strlen($password) < 6) {
  echo json_encode(['ok'=>false,'pesan'=>'Kata sandi minimal 6 karakter.']); exit;
}

$cek = $pdo->prepare("SELECT id FROM users WHERE username = ?");
$cek->execute([$username]);
if ($cek->fetch()) {
  echo json_encode(['ok'=>false,'pesan'=>'Nama pengguna sudah dipakai.']); exit;
}

$simpan = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
$simpan->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);

echo json_encode(['ok'=>true,'pesan'=>'Pendaftaran berhasil, silakan masuk.']);