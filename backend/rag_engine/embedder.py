import torch
from langchain_huggingface import HuggingFaceEmbeddings

class InspiraEmbedder:
    def __init__(self, model_name: str = "BAAI/bge-m3"):
        """
        Initializes the embedding model with hardware acceleration.
        """
        # Determine the best device available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"--- [LOG] Using device: {device.upper()} ---")
        
        print(f"--- [LOG] Loading embedding model: {model_name} ---")
        self.model = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={'device': device}, 
            encode_kwargs={'normalize_embeddings': True}
        )
        print("--- [LOG] Model loaded and ready! ---")

    def get_embeddings(self, text_chunks: list[str]):
        """
        Converts text fragments into vectors using GPU acceleration.
        """
        print(f"--- [LOG] Vectorizing {len(text_chunks)} chunks on GPU... ---")
        return self.model.embed_documents(text_chunks)