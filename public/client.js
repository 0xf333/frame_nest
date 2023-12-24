const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const message = document.getElementById('message');
const fileLabel = document.getElementById('fileLabel');

// This triggers file selection dialog when the file label is clicked.
fileLabel.addEventListener('click', () => {
    fileInput.click();
});

// This is what is Handling form submission to upload the selected file.
uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleUpload();
});

// And this is what is updating the client message with the name of the 
// selected file.
fileInput.addEventListener('change', () => {
    if (fileInput.value) {
        message.textContent = `Selected file: ${fileInput.value.split('\\').pop()}`;
        }
});


/**
 * Here I'm andling the file upload process when a user submits 
 * the upload form.
 * The workflow is: it first displays a processing message, 
 * then creates a FormData object containing the selected file from 
 * the input, then send a POST request to the '/upload' endpoint with 
 * the file data. Finally after the server processes the file, it 
 * updates the message on the client side based on the server's response. 
 * That's basically it.
 * 
 * @example
 * ```
 * // Triggereing when the upload form is submitted
 * uploadForm.addEventListener('submit', (e) => {
 *     e.preventDefault();
 *     handleUpload();
 * });
 * ```
 */
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