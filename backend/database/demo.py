"""
Demo script showing how to use the DatabaseManager for Inspira project
"""

from models import DatabaseManager

def demo_database_operations():
    """Demonstrate all database operations"""
    
    # Initialize database manager (automatically detects local vs AWS)
    db = DatabaseManager()
    
    print("=== Inspira Database Demo ===\n")
    
    # Demo user
    user_id = "demo-user-456"
    
    # 1. Store file metadata
    print("1. Storing file metadata...")
    db.store_file_metadata(
        user_id=user_id,
        filename="architecture_inspiration.jpg",
        s3_key="uploads/demo-user-456/architecture_inspiration.jpg",
        content_type="image/jpeg",
        file_size=1024000,
        extracted_text="Modern minimalist building with clean lines",
        embedded=True,
        embedding_id="chroma_embed_001"
    )
    
    db.store_file_metadata(
        user_id=user_id,
        filename="design_patterns.pdf",
        s3_key="uploads/demo-user-456/design_patterns.pdf",
        content_type="application/pdf",
        file_size=2048000,
        extracted_text="Geometric patterns in contemporary design...",
        embedded=False
    )
    
    # 2. Retrieve user files
    print("2. Retrieving user files...")
    files = db.get_user_files(user_id)
    for file in files:
        print(f"   - {file['filename']} ({file['content_type']}, embedded: {file['embedded']})")
    
    # 3. Create chat session
    print("\n3. Creating chat session...")
    session_id = db.create_session(
        user_id=user_id,
        question="What patterns do you see in my aesthetic preferences?",
        answer="Your unconscious preferences show strong attraction to minimalist geometric forms...",
        reasoning_trace=[
            "Cross-modal retrieval: Found 5 related items",
            "Pattern synthesis: Identified geometric minimalism theme",
            "Insight generation: Connected visual patterns to psychological preferences",
            "Grading: Generated novel and well-supported insights"
        ],
        retrieved_files=["architecture_inspiration.jpg", "design_patterns.pdf"],
        pattern_analysis="Geometric minimalism with emphasis on clean lines and negative space"
    )
    print(f"   Created session: {session_id}")
    
    # 4. Get user sessions
    print("\n4. Retrieving user sessions...")
    sessions = db.get_user_sessions(user_id, limit=5)
    for session in sessions:
        print(f"   - {session['session_id']}: {session['question'][:50]}...")
    
    # 5. Async task operations
    print("\n5. Creating async task...")
    task_id = db.create_task(
        user_id=user_id,
        question="Generate creative inspiration based on my uploaded materials"
    )
    print(f"   Created task: {task_id}")
    
    # Simulate task completion
    db.update_task_result(
        task_id=task_id,
        result="Your aesthetic DNA suggests exploring Nordic design principles with warm wood tones...",
        status="completed"
    )
    
    # Check task status
    task_status = db.get_task_status(task_id)
    print(f"   Task status: {task_status['status']}")
    print(f"   Result: {task_status['result'][:50]}...")
    
    print("\n=== Database operations completed successfully! ===")
    
    # Clean up (for local testing)
    db.cleanup()

if __name__ == "__main__":
    demo_database_operations()