const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const message = document.getElementById('message');
const fileLabel = document.getElementById('fileLabel');

fileLabel.addEventListener('click', () => {
    fileInput.click();
});

uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUpload();
});

fileInput.addEventListener('change', () => {
    if (fileInput.value) {
        message.textContent = `Selected file: ${fileInput.value.split('\\').pop()}`;
        }
});

function handleUpload() {
    message.textContent = 'Processing...';
    let formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.ok ? Promise.resolve(response) : Promise.reject(response))
    .then(response => response.json())
    .then(data => message.textContent = 'File(s) processed and archived successfully.')
    .catch(error => message.textContent = 'Upload failed. Please try again.');
}