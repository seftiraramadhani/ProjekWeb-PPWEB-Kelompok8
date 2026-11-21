# ProjekWeb-PPWEB-Kelompok8
Seftira Ramadhani - 25076067
Siti Fadhilah Rahman - 25076069
## Cara menjalankan
1. Pasang **XAMPP** (Apache dan MySQL), lalu nyalakan keduanya di XAMPP Control Panel.
2. Clone repo ke folder `C:\xampp\htdocs\`:
   `git clone https://github.com/seftiraramadhani/ProjekWeb-PPWEB-Kelompok8.git`
3. Buka phpMyAdmin (`http://localhost/phpmyadmin`), klik tab **Impor**, lalu pilih file
   `database/schema.sql`. Ini otomatis membuat database `spin_kelompok` beserta tabelnya.
4. Salin `api/db.example.php` menjadi `api/db.php`. Port MySQL di proyek ini **3308**
   (lihat kolom Port di XAMPP Control Panel). Kalau MySQL kamu memakai port lain, ubah angka
   `port=3308` di `api/db.php`. Isi juga password kalau MySQL kamu memakainya.
5. Buka `http://localhost/ProjekWeb-PPWEB-Kelompok8/` di browser.

> `api/db.php` tidak ikut ke GitHub (ada di `.gitignore`), jadi setiap orang membuat sendiri.

### Kalau phpMyAdmin menolak tersambung
Biasanya port MySQL bukan 3306. Di `C:\xampp\phpMyAdmin\config.inc.php`, tambahkan di bawah baris `host`:
`$cfg['Servers'][$i]['port'] = '3308';`