document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file');
    const fileLabel = document.querySelector('.footer p');
    const uploadContainer = document.querySelector('.container');

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            fileLabel.textContent = file.name;
        }
    });

    uploadContainer.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            uploadFile(file);
        }
    });

    function uploadFile(file) {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        
        if (!allowedTypes.includes(file.type)) {
            alert('Solo se permiten archivos PDF, DOCX y DOC');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {

             // Crear ventana emergente con códigos QR
        const qrWindow = window.open('', 'QR Codes', 'width=600,height=400');
        qrWindow.document.write('<html><head><title>Códigos QR de Archivos</title>');
        qrWindow.document.write('<style>body { font-family: Arial; text-align: center; }</style>');
        qrWindow.document.write('</head><body>');
        qrWindow.document.write('<h2>CNC</h2>');

        data.qrCodes.forEach(qrCode => {
            qrWindow.document.write(`
                <div>
                    <h3>${qrCode.filename}</h3>
                    <p>Vista Web:</p>
                    <img src="${qrCode.webViewQR}" style="max-width:200px;">
                </div>
            `);
        });

        qrWindow.document.write('</body></html>');
        qrWindow.document.close();

            alert('Archivo subido exitosamente');
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al subir el archivo');
        });
    }
});