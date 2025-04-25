<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents('php://input'), true);

if (isset($_POST['data'])) {
    $data = $_POST['data'];
    
    // Guardar en el archivo videos.txt
    file_put_contents('videos.txt', $data);
    
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Datos no recibidos']);
}
?>