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
        
        try {
            const response = fetch('http://127.0.0.1:5000/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: message
                })
            });
            const data = response.json();
            addMessage(data.answer, false);
            console.log(data.answer)
        } catch (error) {
            console.error('Error asking question:', error);
            addMessage("Sorry, there was an error processing your question.", false);
        }
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
        e.preventDefault(); 
        sendMessage();
        this.style.height = 'auto';
    }
});

function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message);
        chatInput.value = '';
        chatInput.style.height = 'auto';
    }
}


pdfUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const pdfData = event.target.result;
            try {
                const response = await fetch('http://127.0.0.1:5000/process_pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/pdf'
                    },
                    body: pdfData
                });
                const data = await response.json();
                if (data.chunks) {
                    window.pdfChunks = data.chunks;
                    console.log('PDF processed successfully');
                }
            } catch (error) {
                console.error('Error processing PDF:', error);
            }
        };
        reader.readAsArrayBuffer(file);

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
