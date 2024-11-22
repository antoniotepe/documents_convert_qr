const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const CLIENT_ID = '29507336525-p5q2m5eusaatfvvaafgpnd562vu8q4uk.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//041bCNBthED1bCgYIARAAGAQSNwF-L9IrVrQFVhMPlVyZcnbveKKHY02OonnDlvFYOs5l7hBbL57eJWeLw8skeHWHDml8VFEGJac';
const PARENT_FOLDER_ID = '1Y47aj7AMxsQ37rH-Q7jGPkBxVJu83jbw';

class GoogleDriveUploader {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );

        this.oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        });
    }

    // Obtener el tipo MIME correcto según la extensión del archivo
    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    // Subir un solo archivo
    async uploadFile(filename, folderPath) {
        try {
            const filePath = path.join(folderPath, filename);
            const mimeType = this.getMimeType(filename);

            const response = await this.drive.files.create({
                requestBody: {
                    name: filename,
                    mimeType: mimeType,
                    parents: [PARENT_FOLDER_ID]
                },
                media: {
                    mimeType: mimeType,
                    body: fs.createReadStream(filePath)
                }
            });

            console.log(`Archivo subido: ${filename}`);
            return response.data.id;

        } catch (error) {
            console.error(`Error subiendo ${filename}:`, error.message);
            return null;
        }
    }

    // Generar URL pública
    async generatePublicUrl(fileId) {
        try {
            await this.drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            const result = await this.drive.files.get({
                fileId: fileId,
                fields: 'webViewLink, webContentLink'
            });

            console.log('Links Públicos:');
            console.log('Link de Vista Web:', result.data.webViewLink);
            console.log('Link de Contenido Web:', result.data.webContentLink);

            return result.data;
        } catch (error) {
            console.error('Error generando URL pública:', error.message);
            return null;
        }
    }

    // Procesar todos los archivos de una carpeta
    async processFiles(folderPath) {
        try {
            // Leer archivos de la carpeta
            const files = fs.readdirSync(folderPath)
                .filter(file => {
                    const ext = path.extname(file).toLowerCase();
                    return ['.pdf', '.docx', '.doc'].includes(ext);
                });

            const uploadResults = [];

            for (const file of files) {
                const fileId = await this.uploadFile(file, folderPath);
                if (fileId) {
                    const publicUrls = await this.generatePublicUrl(fileId);
                    uploadResults.push({
                        filename: file,
                        fileId: fileId,
                        publicUrls: publicUrls
                    });
                }
            }

            console.log('\n--- Resumen de Subida ---');
            console.log(`Total de archivos procesados: ${uploadResults.length}`);
            console.log('Detalles de archivos:');
            uploadResults.forEach(result => {
                console.log(`- ${result.filename}`);
                console.log(`  ID de archivo: ${result.fileId}`);
                if (result.publicUrls) {
                    console.log(`  Link de Vista Web: ${result.publicUrls.webViewLink}`);
                    console.log(`  Link de Contenido Web: ${result.publicUrls.webContentLink}`);
                    
                }
            });

            return uploadResults;

        } catch (error) {
            console.error('Error procesando archivos:', error.message);
            return [];
        }
    }
}

// Uso del uploader
async function main() {
    try {
        // Ruta de la carpeta con archivos
        const folderPath = path.join(__dirname, 'output');

        // Crear instancia del uploader
        const uploader = new GoogleDriveUploader();

        // Procesar y subir archivos
        await uploader.processFiles(folderPath);

    } catch (error) {
        console.error('Error general:', error);
    }
}

// Ejecutar script
main();

module.exports = GoogleDriveUploader;
