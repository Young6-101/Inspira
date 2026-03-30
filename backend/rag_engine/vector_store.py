"""
Vector store using ChromaDB with Gemini embeddings.
Simplified: text-only storage (images are described as text then stored).
"""
import os
import chromadb
import uuid

from rag_engine.embedder import InspiraEmbedder


class InspiraVault:
    def __init__(self, db_path: str | None = None):
        db_path = db_path or os.getenv("VECTOR_DB_PATH", "./inspira_db")
        os.makedirs(db_path, exist_ok=True)
        self.client = chromadb.PersistentClient(path=db_path)
        self.embedder = InspiraEmbedder()

    def get_collection(self, stack_id: str):
        """Get or create a collection for a specific stack."""
        return self.client.get_or_create_collection(name=f"stack_{stack_id}")

    def store_chunks(self, stack_id: str, chunks: list[str], source: str = "upload"):
        """Store text chunks into a stack's collection."""
        if not chunks:
            return

        collection = self.get_collection(stack_id)
        embeddings = self.embedder.get_embeddings(chunks)
        ids = [f"{source}_{uuid.uuid4().hex[:8]}" for _ in chunks]
        metadatas = [{"source": source}] * len(chunks)

        collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )
        print(f"--- [LOG] Stored {len(chunks)} chunks into stack {stack_id} ---")

    def search(self, stack_id: str, query: str, top_k: int = 5) -> list[str]:
        """Search for relevant chunks in a stack."""
        collection = self.get_collection(stack_id)
        if collection.count() == 0:
            return []

        query_embedding = self.embedder.get_single_embedding(query)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
        )
        return results["documents"][0] if results["documents"] else []
