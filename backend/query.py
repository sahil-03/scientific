import pickle
import numpy as np
from sentence_transformers import SentenceTransformer, util
from openai import OpenAI 
from flask import Flask, request, jsonify

app = Flask("parser")

# Unpickle the file
with open('chunks_store.pkl', 'rb') as file:
    chunks = pickle.load(file)

# Load pre-trained model
model = SentenceTransformer('all-MiniLM-L6-v2')
chunk_embeddings = model.encode(chunks, convert_to_tensor=True)

# Create OpenAI client 
client = OpenAI()

SYS_PROMPT = "You are an intelligent chat bot that, given context from some research paper and a question, "\
             "can provide an accurate and insightful answer to help clarify whatever the user asked."


def get_top_k_chunks(query, k=5):
    # Encode query
    query_embedding = model.encode(query, convert_to_tensor=True)

    # Compute cosine similarities
    cosine_scores = util.pytorch_cos_sim(query_embedding, chunk_embeddings)[0]

    # Get top-k chunks
    top_k_indices = np.argpartition(cosine_scores, -k)[-k:]
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

    response = client.chat.completions.create(
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