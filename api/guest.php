<?php
require 'db.php';
session_start();
session_regenerate_id(true);
$_SESSION = ['user_id' => null, 'username' => 'Tamu', 'tamu' => true];
echo json_encode(['ok'=>true,'username'=>'Tamu']);