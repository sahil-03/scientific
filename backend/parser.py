from flask import Flask, request, jsonify
from io import BytesIO
from PyPDF2 import PdfReader
from transformers import AutoTokenizer
import nltk
import pickle
from nltk.tokenize import sent_tokenize
import numpy as np
from sentence_transformers import SentenceTransformer, util
import openai

app = Flask("__name__")

nltk.download('punkt')
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

MAX_TOKENS = 512  # Maximum tokens per chunk
OVERLAP = 50  # Number of overlapping tokens between chunks

SYS_PROMPT = "You are an intelligent chat bot that, given context from some research paper and a question, "\
             "can provide an accurate and insightful answer to help clarify whatever the user asked."

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


def get_top_k_chunks(query, k=5):
    with open('chunk_store.pkl', 'rb') as file:
        chunks = pickle.load(file)

    # Load pre-trained model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    chunk_embeddings = model.encode(chunks, convert_to_tensor=True)

    # Encode query
    query_embedding = model.encode(query, convert_to_tensor=True)

    # Compute cosine similarities
    cosine_scores = util.pytorch_cos_sim(query_embedding, chunk_embeddings)[0]

    # Get top-k chunks
    top_k_indices = np.argsort(cosine_scores)[-k:]
    top_k_chunks = [chunks[i] for i in top_k_indices]

    return top_k_chunks


@app.route('/ask', methods=['POST'])
def ask():
    data = request.json
    if 'question' not in data:
        return jsonify({"error": "No question provided"}), 400

    prompt = f"Question: {data['question']}\n\nContext:\n"
    prompt += "\n".join(get_top_k_chunks(data['question']))
    prompt += "\n\nAnswer:"

    response = openai.ChatCompletion.create(
        model="gpt-4o", 
        messages=[
            {"role": "system", "content": SYS_PROMPT}, 
            {"role": "user", "content": prompt}
        ]
    )
    x = response.choices[0].text.strip()
    print(x)
    return x

if __name__ == '__main__':
    app.run(debug=True)