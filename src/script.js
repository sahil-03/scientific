const pdfUpload = document.getElementById('pdf-upload');
const pdfViewer = document.getElementById('pdf-viewer');
const fileName = document.getElementById('file-name');
const removePdfBtn = document.getElementById('remove-pdf');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');


pdfUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileURL = URL.createObjectURL(file);
    pdfViewer.src = fileURL;
});

function addMessage(message, isUser = true) {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${isUser ? 'You' : 'AI'}: ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message);
        chatInput.value = '';
        // Here you would typically send the message to your AI backend
        // and then add the AI's response using addMessage(aiResponse, false);
    }
}

sendButton.addEventListener('click', sendMessage);


chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Reset height when cleared
chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default to avoid newline
        sendMessage();
        this.style.height = 'auto'; // Reset height after sending
    }
});

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message);
        chatInput.value = '';
        chatInput.style.height = 'auto'; // Reset height after sending
    }
}


pdfUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        pdfViewer.src = fileURL;
        removePdfBtn.disabled = false;
        fileName.textContent = file.name;
    }
});

removePdfBtn.addEventListener('click', function() {
    pdfViewer.src = '';
    pdfUpload.value = '';
    removePdfBtn.disabled = true;
    fileName.textContent = '';
});

// Disable the remove button initially
removePdfBtn.disabled = true;
