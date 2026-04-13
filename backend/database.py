"""
SQLite database setup using SQLModel.
Single file DB at ./inspira.db — no external dependencies.
"""
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///./inspira.db"

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db():
	"""Create all tables if they don't exist."""
	SQLModel.metadata.create_all(engine)


def get_session():
	"""FastAPI dependency — yields a DB session per request."""
	with Session(engine) as session:
		yield session
