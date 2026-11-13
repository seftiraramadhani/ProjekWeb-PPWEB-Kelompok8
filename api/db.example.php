<?php
// Salin file ini menjadi db.php (di folder yang sama).
// Sesuaikan port dan password kalau berbeda di laptopmu.
// Port default MySQL biasanya 3306, di proyek ini 3308.
$pdo = new PDO(
  "mysql:host=127.0.0.1;port=3308;dbname=spin_kelompok;charset=utf8mb4",
  "root", "",
  [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
   PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
header('Content-Type: application/json; charset=utf-8');