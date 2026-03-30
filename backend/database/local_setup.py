"""
Local DynamoDB setup for testing Inspira database schema
"""

import boto3
import os
from datetime import datetime
from moto import mock_aws

@mock_aws
def create_local_tables():
    """Create local DynamoDB tables for testing"""
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    # Files metadata table
    files_table = dynamodb.create_table(
        TableName='inspira-files',
        KeySchema=[
            {'AttributeName': 'user_id', 'KeyType': 'HASH'},
            {'AttributeName': 'filename', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'user_id', 'AttributeType': 'S'},
            {'AttributeName': 'filename', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # Chat sessions table
    sessions_table = dynamodb.create_table(
        TableName='inspira-sessions',
        KeySchema=[
            {'AttributeName': 'user_id', 'KeyType': 'HASH'},
            {'AttributeName': 'session_id', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'user_id', 'AttributeType': 'S'},
            {'AttributeName': 'session_id', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # Async tasks table
    tasks_table = dynamodb.create_table(
        TableName='inspira-tasks',
        KeySchema=[
            {'AttributeName': 'task_id', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'task_id', 'AttributeType': 'S'}
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    return files_table, sessions_table, tasks_table

@mock_aws
def test_schema():
    """Test the DynamoDB schema with sample data"""
    files_table, sessions_table, tasks_table = create_local_tables()
    
    # Test files table
    print("Testing files table...")
    files_table.put_item(Item={
        'user_id': 'test-user-123',
        'filename': 'design_inspiration.pdf',
        's3_key': 'uploads/test-user-123/design_inspiration.pdf',
        'content_type': 'application/pdf',
        'extracted_text': 'Modern minimalist design with geometric patterns...',
        'embedded': True,
        'created_at': datetime.utcnow().isoformat(),
        'file_size': 2048000,
        'embedding_id': 'chroma_collection_001'
    })
    
    # Test sessions table
    print("Testing sessions table...")
    sessions_table.put_item(Item={
        'user_id': 'test-user-123',
        'session_id': f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        'question': 'What patterns do you see in my design preferences?',
        'answer': 'Your unconscious preferences show a strong inclination toward...',
        'reasoning_trace': [
            'Cross-modal retrieval: Found 8 related items',
            'Pattern synthesis: Identified minimalist geometric themes',
            'Insight generation: Connecting visual elements to user psychology',
            'Grading: Novel and well-supported insights generated'
        ],
        'retrieved_files': ['design_inspiration.pdf', 'architecture_screenshots.jpg'],
        'pattern_analysis': 'Geometric minimalism with warm color palettes'
    })
    
    # Test tasks table
    print("Testing tasks table...")
    tasks_table.put_item(Item={
        'task_id': 'task-uuid-12345',
        'status': 'completed',
        'user_id': 'test-user-123',
        'created_at': datetime.utcnow().isoformat(),
        'question': 'Generate inspiration based on my uploaded materials',
        'result': 'Your aesthetic preferences suggest exploring Nordic design principles...',
        'error_message': None
    })
    
    # Query test
    print("Testing queries...")
    
    # Get user files
    response = files_table.query(
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': 'test-user-123'}
    )
    print(f"Found {response['Count']} files for user")
    
    # Get user sessions
    response = sessions_table.query(
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': 'test-user-123'}
    )
    print(f"Found {response['Count']} sessions for user")
    
    # Get task status
    response = tasks_table.get_item(Key={'task_id': 'task-uuid-12345'})
    if 'Item' in response:
        print(f"Task status: {response['Item']['status']}")
    
    print("\nSchema validation completed successfully!")
    print("Your DynamoDB tables are ready for the Inspira project.")

if __name__ == "__main__":
    test_schema()