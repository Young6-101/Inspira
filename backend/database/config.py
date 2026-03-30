"""
Environment configuration for Inspira database
Handles local vs AWS environments and table naming
"""

import os
from typing import Dict, Optional

class DatabaseConfig:
    """Configuration class for database connections and table names"""
    
    def __init__(self):
        self.environment = os.getenv('ENVIRONMENT', 'local')
        self.aws_region = os.getenv('AWS_REGION', 'ap-southeast-1')
        self.aws_profile = os.getenv('AWS_PROFILE', 'inspira-project')
        self.is_aws = bool(os.getenv('AWS_REGION'))
        
    @property 
    def table_names(self) -> Dict[str, str]:
        """Get table names based on environment"""
        if self.is_aws:
            # AWS deployed table names (with environment suffix)
            env_suffix = os.getenv('ENVIRONMENT', 'dev')
            return {
                'files': f'inspira-files-{env_suffix}',
                'sessions': f'inspira-sessions-{env_suffix}',
                'tasks': f'inspira-tasks-{env_suffix}'
            }
        else:
            # Local testing table names (no suffix)
            return {
                'files': 'inspira-files',
                'sessions': 'inspira-sessions', 
                'tasks': 'inspira-tasks'
            }
    
    @property
    def s3_bucket_name(self) -> Optional[str]:
        """Get S3 bucket name for file uploads"""
        if self.is_aws:
            env_suffix = os.getenv('ENVIRONMENT', 'dev')
            account_id = os.getenv('AWS_ACCOUNT_ID', '515048895416')
            return f'inspira-uploads-{env_suffix}-{account_id}'
        return None
    
    def get_boto3_session(self):
        """Get configured boto3 session"""
        if self.is_aws:
            # Production AWS with proper session
            import boto3
            if self.aws_profile:
                session = boto3.Session(profile_name=self.aws_profile)
                return session.resource('dynamodb', region_name=self.aws_region)
            else:
                # Lambda environment - use default credentials
                return boto3.resource('dynamodb', region_name=self.aws_region)
        else:
            # Local mocked environment
            import boto3
            return boto3.resource('dynamodb', region_name='us-east-1')

# Global config instance
config = DatabaseConfig()