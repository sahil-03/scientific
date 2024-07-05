const pdfUpload = document.getElementById('pdf-upload');
const pdfViewer = document.getElementById('pdf-viewer');
const fileName = document.getElementById('file-name');
const removePdfBtn = document.getElementById('remove-pdf');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');


sendButton.addEventListener('click', sendMessage);


function addMessage(message, isUser = true) {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${isUser ? 'You' : 'AI'}: ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


async function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        addMessage(message, true);
        chatInput.value = '';
        
        try {
            const response = await fetch('http://127.0.0.1:5000/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: message
                })
            });
            console.log("Received response:", response);


            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // console.log(data.answer);
            addMessage(data.answer, false);
        } catch (error) {
            console.error('Error asking question:', error);
            addMessage("Sorry, there was an error processing your question.", false);
        }
    }
}



chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});


chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); 
        sendMessage();
        this.style.height = 'auto';
    }
});


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


pdfUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileURL = URL.createObjectURL(file);
    pdfViewer.src = fileURL;
});


removePdfBtn.addEventListener('click', function() {
    pdfViewer.src = '';
    pdfUpload.value = '';
    removePdfBtn.disabled = true;
    fileName.textContent = '';
});

// Disable the remove button initially
removePdfBtn.disabled = true;
