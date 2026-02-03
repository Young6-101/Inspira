import chromadb
from backend.rag_engine.embedder import InspiraEmbedder

class InspiraVault:
    def __init__(self, db_path="./inspira_db"):
        """
        Initializes the persistent vector database.
        """
        # 1. Create a local database client
        self.client = chromadb.PersistentClient(path=db_path)
        
        # 2. Re-use our GPU-accelerated embedder
        self.embedder = InspiraEmbedder()
        
        # 3. Create or get the collection (think of it as a 'table' for your chaos)
        self.collection = self.client.get_or_create_collection(name="user_inspiration")

    def store_clarity(self, chunks: list[str], metadata: list[dict] = None):
        """
        Takes raw chunks, embeds them, and saves to local storage.
        """
        # Generate unique IDs for each chunk
        ids = [f"id_{i}" for i in range(len(chunks))]
        
        # Convert chunks to vectors
        embeddings = self.embedder.get_embeddings(chunks)
        
        # Save to database
        self.collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadata or [{"source": "pdf_upload"}] * len(chunks),
            ids=ids
        )
        print(f"--- [LOG] Successfully stored {len(chunks)} fragments into the Vault. ---")

    def search_clarity(self, query: str, top_k: int = 3):
        """
        Search for the most relevant fragments from the vault.
        query: The user's natural language question.
        top_k: Number of fragments to retrieve.
        """
        # Convert the query into a vector using the same GPU-accelerated embedder
        query_vector = self.embedder.get_embeddings([query])[0]
        
        # Query the collection
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=top_k
        )
        
        # Return the retrieved text fragments
        return results['documents'][0]