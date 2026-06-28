 document the request lifecycle:
Query → Auth middleware → RAG session creation → embed → AES encrypt → FAISS store → query → decrypt → Groq LLM → answer → wipe session keys.