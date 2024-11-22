const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const GoogleDriveUploader = require('./src/googleDriveUploader');

const app = express();
const PORT = 3000;

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir);
        }
        cb(null, outputDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.docx', '.doc'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten PDF, DOCX y DOC'));
    }
});

// Servir archivos estáticos
app.use(express.static('public'));

// Endpoint de subida de archivos

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se ha subido ningún archivo');
        }

        const uploader = new GoogleDriveUploader();
        const folderPath = path.join(__dirname, 'output');
        
        const uploadResults = await uploader.processFiles(folderPath);
        
        // Generar QR para los enlaces
        const qrCodes = await Promise.all(uploadResults.map(async (result) => {
            if (result.publicUrls) {
                const webViewQR = await QRCode.toDataURL(result.publicUrls.webViewLink);
                const webContentQR = await QRCode.toDataURL(result.publicUrls.webContentLink);
                return {
                    filename: result.filename,
                    webViewQR,
                    webContentQR
                };
            }
            return null;
        }));

        // Eliminar archivo después de procesar
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'Archivo subido exitosamente',
            results: uploadResults,
            qrCodes: qrCodes.filter(qr => qr !== null)
        });
    } catch (error) {
        console.error('Error en la subida:', error);
        res.status(500).send('Error al subir el archivo');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});