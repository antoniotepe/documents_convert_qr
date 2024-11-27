document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file');
    const fileLabel = document.querySelector('.footer p');
    const uploadContainer = document.querySelector('.container');

    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.classList.add('loading-overlay');
    loadingOverlay.innerHTML = `Subiendo archivo...`;
    document.body.appendChild(loadingOverlay);

    loadingOverlay.style.display = 'none';

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            fileLabel.textContent = file.name;
            uploadFile(file);
        }
    });

    uploadContainer.addEventListener('click', () => {
        fileInput.click();
    });

    function uploadFile(file) {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        
        if (!allowedTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Archivo no válido',
                text: 'Solo se permiten archivos PDF, DOCX y DOC',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        // Mostrar loading con SweetAlert
        Swal.fire({
            title: 'Subiendo archivo...',
            html: 'Por favor, espere',
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Ocultar loading
            Swal.close();

            // Crear ventana emergente con códigos QR
            const qrWindow = window.open('', 'QR Codes', 'width=600,height=600');
            
            // Estructura HTML para mostrar QR
            qrWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Códigos QR</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; }
                        .qr-container { margin: 20px; }
                        img { max-width: 200px; border: 1px solid #ccc; }
                    </style>
                </head>
                <body>
                    <h1>Códigos QR de CNC</h1>
                    ${data.qrCodes.map(qrCode => `
                        <div class="qr-container">
                            <h2>${qrCode.filename}</h2>
                            <h3>Vista Web</h3>
                            <img src="${qrCode.webViewQR}" alt="QR Vista Web">
                            <h3>Contenido Web</h3>
                            <img src="${qrCode.webContentQR}" alt="QR Contenido Web">
                        </div>
                    `).join('')}
                </body>
                </html>
            `);
            
            qrWindow.document.close();

            // Mostrar alerta de éxito
            Swal.fire({
                icon: 'success',
                title: '¡Archivo subido!',
                text: 'El archivo se ha subido correctamente',
                confirmButtonColor: '#3085d6'
            });

            console.log(data);
            
            // Reset file input
            fileInput.value = '';
            fileLabel.textContent = 'No se ha seleccionado archivo';
        })
        .catch(error => {
            // Mostrar error con SweetAlert
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al subir el archivo',
                confirmButtonColor: '#d33'
            });
            console.error('Error:', error);
        });
    }
});