"""
DynamoDB models and operations for Inspira project
Handles both local testing (moto) and AWS production environments
"""

import boto3
import os
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from moto import mock_aws

class DatabaseManager:
    """
    Unified database manager that works in both local and AWS environments
    """
    
    def __init__(self):
        self.is_local = not bool(os.getenv('AWS_REGION'))
        
        if self.is_local:
            # Local development with mocked DynamoDB
            print("Using local DynamoDB (mocked)")
            self.mock = mock_aws()
            self.mock.start()
            self.dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            self._create_local_tables()
        else:
            # Production AWS DynamoDB
            print("Using AWS DynamoDB")
            self.dynamodb = boto3.resource('dynamodb')
    
    def _create_local_tables(self):
        """Create tables for local development"""
        import importlib.util
        import os
        
        # Get the directory of the current file
        current_dir = os.path.dirname(__file__)
        local_setup_path = os.path.join(current_dir, 'local_setup.py')
        
        # Import the module
        spec = importlib.util.spec_from_file_location("local_setup", local_setup_path)
        local_setup = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(local_setup)
        
        # Call the function
        local_setup.create_local_tables()
    
    # =================== FILES OPERATIONS ===================
    
    def store_file_metadata(self, 
                           user_id: str, 
                           filename: str, 
                           s3_key: str,
                           content_type: str,
                           file_size: int,
                           extracted_text: Optional[str] = None,
                           embedded: bool = False,
                           embedding_id: Optional[str] = None) -> Dict[str, Any]:
        """Store file metadata in inspira-files table"""
        
        table = self.dynamodb.Table('inspira-files')
        
        item = {
            'user_id': user_id,
            'filename': filename,
            's3_key': s3_key,
            'content_type': content_type,
            'file_size': file_size,
            'embedded': embedded,
            'created_at': datetime.utcnow().isoformat()
        }
        
        if extracted_text:
            item['extracted_text'] = extracted_text
        if embedding_id:
            item['embedding_id'] = embedding_id
            
        table.put_item(Item=item)
        return item
    
    def get_user_files(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all files for a user"""
        table = self.dynamodb.Table('inspira-files')
        
        response = table.query(
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user_id}
        )
        
        return response['Items']
    
    def update_file_embedding_status(self, user_id: str, filename: str, embedding_id: str):
        """Mark file as embedded with embedding ID"""
        table = self.dynamodb.Table('inspira-files')
        
        table.update_item(
            Key={'user_id': user_id, 'filename': filename},
            UpdateExpression='SET embedded = :embedded, embedding_id = :eid',
            ExpressionAttributeValues={
                ':embedded': True,
                ':eid': embedding_id
            }
        )
    
    # =================== SESSIONS OPERATIONS ===================
    
    def create_session(self,
                      user_id: str,
                      question: str,
                      answer: str,
                      reasoning_trace: List[str],
                      retrieved_files: List[str],
                      pattern_analysis: Optional[str] = None) -> str:
        """Store a chat session"""
        
        table = self.dynamodb.Table('inspira-sessions')
        session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        item = {
            'user_id': user_id,
            'session_id': session_id,
            'question': question,
            'answer': answer,
            'reasoning_trace': reasoning_trace,
            'retrieved_files': retrieved_files,
            'created_at': datetime.utcnow().isoformat()
        }
        
        if pattern_analysis:
            item['pattern_analysis'] = pattern_analysis
            
        table.put_item(Item=item)
        return session_id
    
    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent sessions for a user"""
        table = self.dynamodb.Table('inspira-sessions')
        
        response = table.query(
            KeyConditionExpression='user_id = :uid',
            ExpressionAttributeValues={':uid': user_id},
            ScanIndexForward=False,  # Most recent first
            Limit=limit
        )
        
        return response['Items']
    
    # =================== TASKS OPERATIONS ===================
    
    def create_task(self, user_id: str, question: str) -> str:
        """Create async task for long-running operations"""
        table = self.dynamodb.Table('inspira-tasks')
        task_id = str(uuid.uuid4())
        
        table.put_item(Item={
            'task_id': task_id,
            'status': 'processing',
            'user_id': user_id,
            'question': question,
            'created_at': datetime.utcnow().isoformat()
        })
        
        return task_id
    
    def update_task_result(self, task_id: str, result: str, status: str = 'completed'):
        """Update task with result"""
        table = self.dynamodb.Table('inspira-tasks')
        
        table.update_item(
            Key={'task_id': task_id},
            UpdateExpression='SET #status = :status, #result = :result, completed_at = :completed',
            ExpressionAttributeNames={
                '#status': 'status',
                '#result': 'result'
            },
            ExpressionAttributeValues={
                ':status': status,
                ':result': result,
                ':completed': datetime.utcnow().isoformat()
            }
        )
    
    def update_task_error(self, task_id: str, error_message: str):
        """Update task with error"""
        table = self.dynamodb.Table('inspira-tasks')
        
        table.update_item(
            Key={'task_id': task_id},
            UpdateExpression='SET #status = :status, error_message = :error, completed_at = :completed',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': 'failed',
                ':error': error_message,
                ':completed': datetime.utcnow().isoformat()
            }
        )
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status"""
        table = self.dynamodb.Table('inspira-tasks')
        
        response = table.get_item(Key={'task_id': task_id})
        return response.get('Item')
    
    def cleanup(self):
        """Clean up resources (for local testing)"""
        if hasattr(self, 'mock'):
            self.mock.stop()