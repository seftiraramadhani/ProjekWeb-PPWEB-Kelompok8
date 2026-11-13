<?php
require 'db.php';

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$ingat    = !empty($_POST['ingat']);

$q = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
$q->execute([$username]);
$user = $q->fetch();

if (!$user || !password_verify($password, $user['password'])) {
  echo json_encode(['ok'=>false,'pesan'=>'Nama pengguna atau kata sandi salah.']); exit;
}

session_set_cookie_params($ingat ? 60*60*24*30 : 0);  // 30 hari kalau "Ingat saya" dicentang
session_start();
session_regenerate_id(true);
$_SESSION['user_id']  = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['tamu']     = false;

echo json_encode(['ok'=>true,'username'=>$user['username']]);