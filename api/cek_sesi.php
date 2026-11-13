<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['login'=>false]);
  exit;
}

echo json_encode([
  'login'    => true,
  'username' => $_SESSION['username'],
  'tamu'     => $_SESSION['tamu']
]);