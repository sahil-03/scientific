from flask import Flask, request, jsonify
from io import BytesIO
from PyPDF2 import PdfReader
from transformers import AutoTokenizer
import nltk
import pickle
from nltk.tokenize import sent_tokenize

app = Flask("__name__")

nltk.download('punkt')
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

MAX_TOKENS = 512  # Maximum tokens per chunk
OVERLAP = 50  # Number of overlapping tokens between chunks

@app.route('/process_pdf', methods=['POST'])
def process_pdf():
    if 'application/pdf' not in request.headers.get('Content-Type', ''):
        return jsonify({"error": "Invalid content type, expected PDF"}), 400
    
    pdf_data = request.data
    pdf_file = BytesIO(pdf_data)
    
    # Read PDF
    pdf_reader = PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    # Tokenize into sentences
    sentences = sent_tokenize(text)
    
    # Chunk sentences into semantically meaningful parts
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence_tokens = tokenizer.encode(sentence)
        sentence_length = len(sentence_tokens)

        if current_length + sentence_length > MAX_TOKENS:
            if current_chunk:
                chunks.append(tokenizer.decode(current_chunk))
            current_chunk = sentence_tokens[-OVERLAP:]  # Start with overlap from previous chunk
            current_length = len(current_chunk)
        
        current_chunk.extend(sentence_tokens)
        current_length += sentence_length

        # Check if we need to start a new chunk
        while current_length > MAX_TOKENS:
            chunks.append(tokenizer.decode(current_chunk[:MAX_TOKENS]))
            current_chunk = current_chunk[MAX_TOKENS-OVERLAP:]
            current_length = len(current_chunk)

    if current_chunk:
        chunks.append(tokenizer.decode(current_chunk))
    
    with open('chunk_store.pkl', 'wb') as file: 
        pickle.dump(chunks, file)
    
    return jsonify({"chunks": chunks})

if __name__ == '__main__':
    app.run(debug=True)