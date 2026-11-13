CREATE DATABASE IF NOT EXISTS spin_kelompok
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spin_kelompok;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesi_spin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  jenis ENUM('putar','gacha','detektif') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE hasil_kelompok (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sesi_id INT NOT NULL,
  nama_kelompok VARCHAR(50) NOT NULL,
  nama_anggota VARCHAR(50) NOT NULL,
  is_ketua TINYINT(1) DEFAULT 0,
  urutan_tampil INT NULL,
  FOREIGN KEY (sesi_id) REFERENCES sesi_spin(id) ON DELETE CASCADE
);